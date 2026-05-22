import { QuestionnaireStatus, QuestionnaireQuestion, QuestionnaireResponse, Prisma } from '../generated/prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger';
import config from '../config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface QuestionnaireWithRelations {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  questionnaireType: string;
  status: QuestionnaireStatus;
  requestedBy: string | null;
  requestDate: Date | null;
  dueDate: Date | null;
  aiAssisted: boolean;
  aiConfidence: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  questions: QuestionnaireQuestion[];
  responses: QuestionnaireResponse[];
}

/**
 * Questionnaire Automation Service
 * AI-powered questionnaire responses, vendor assessments, and due diligence
 */
export class QuestionnaireService {
  /**
   * Create questionnaire
   */
  async createQuestionnaire(data: {
    organizationId: string;
    title: string;
    description?: string;
    questionnaireType: string;
    requestedBy?: string;
    requestDate?: Date;
    dueDate?: Date | null;
    userId: string;
  }) {
    const questionnaire = await prisma.questionnaire.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        questionnaireType: data.questionnaireType,
        requestedBy: data.requestedBy,
        requestDate: data.requestDate || new Date(),
        dueDate: data.dueDate ?? null,
        status: 'Draft',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'questionnaire.created',
      resourceType: 'Questionnaire',
      resourceId: questionnaire.id,
      metadata: { questionnaireType: data.questionnaireType },
    });

    return questionnaire;
  }

  /**
   * Add questions to questionnaire
   */
  async addQuestions(
    questionnaireId: string,
    questions: Array<{
      questionText: string;
      questionType: string;
      category?: string;
      required?: boolean;
      options?: Record<string, unknown>;
    }>,
    userId: string,
    organizationId: string
  ) {
    const parentQuestionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
    });
    if (!parentQuestionnaire) {
      throw new AppError('Questionnaire not found', 404);
    }

    const createdQuestions = await Promise.all(
      questions.map(async (q, index) => {
        return await prisma.questionnaireQuestion.create({
          data: {
            questionnaireId,
            questionText: q.questionText,
            questionType: q.questionType,
            category: q.category || 'General',
            required: q.required ?? true,
            order: index + 1,
            options: (q.options || {}) as Prisma.InputJsonValue,
          },
        });
      })
    );

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'questionnaire.questions_added',
      resourceType: 'Questionnaire',
      resourceId: questionnaireId,
      metadata: { questionsCount: questions.length },
    });

    return createdQuestions;
  }

  /**
   * AI-assisted questionnaire response generation
   */
  async generateAIResponses(
    questionnaireId: string,
    userId: string,
    organizationId: string
  ) {
    // Verify questionnaire belongs to this organization
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        responses: true,
      },
    });

    if (!questionnaire) {
      throw new AppError('Questionnaire not found', 404);
    }

    // Get organization context for AI
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        frameworks: {
          include: {
            controls: true,
          },
        },
        policies: true,
        trustCertificates: true,
      },
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    const responses: QuestionnaireResponse[] = [];
    let totalConfidence = 0;

    // Generate AI responses for each question
    for (const question of questionnaire.questions) {
      const aiResponse = await this.generateSingleAIResponse(
        question.questionText,
        question.category || 'General',
        organization
      );

      const response = await prisma.questionnaireResponse.create({
        data: {
          questionnaireId,
          questionId: question.id,
          responseText: aiResponse.answer,
          aiGenerated: true,
          aiConfidence: aiResponse.confidence,
          responseData: aiResponse.evidence as Prisma.InputJsonValue,
        },
      });

      responses.push(response);
      totalConfidence += aiResponse.confidence;
    }

    // Update questionnaire with AI assistance flag
    const averageConfidence = questionnaire.questions.length > 0
      ? totalConfidence / questionnaire.questions.length
      : 0;

    await prisma.questionnaire.update({
      where: { id: questionnaireId },
      data: {
        aiAssisted: true,
        aiConfidence: averageConfidence,
        status: 'In_Progress',
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'questionnaire.ai_responses_generated',
      resourceType: 'Questionnaire',
      resourceId: questionnaireId,
      metadata: {
        questionsCount: questionnaire.questions.length,
        averageConfidence,
      },
    });

    return {
      responses,
      averageConfidence,
      requiresReview: averageConfidence < 0.8,
    };
  }

  /**
   * Private helper: Generate single AI response
   */
  private async generateSingleAIResponse(
    question: string,
    category: string,
    organization: Record<string, unknown>
  ): Promise<{
    answer: string;
    confidence: number;
    evidence: Record<string, unknown>;
  }> {
    try {
      const model = genAI.getGenerativeModel({ model: config.gemini.model });

      // Build context from organization data
      const context = this.buildOrganizationContext(organization);

      const prompt = `You are a compliance expert helping to answer a security questionnaire.

Organization Context:
${context}

Question Category: ${category}
Question: ${question}

Provide a detailed, professional answer based on the organization's context. If the organization has relevant certifications, policies, or controls, reference them in your answer.

Format your response as JSON:
{
  "answer": "Your detailed answer here",
  "confidence": 0.0-1.0 (how confident you are based on available data),
  "evidence": ["list of relevant policies, certifications, or controls that support this answer"]
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer,
          confidence: parsed.confidence,
          evidence: { items: parsed.evidence || [] },
        };
      }

      // Fallback if JSON parsing fails
      return {
        answer: text,
        confidence: 0.5,
        evidence: { items: [] },
      };
    } catch (error) {
      logger.error('AI response generation failed:', error);
      return {
        answer:
          'This question requires manual review. Please provide a response based on your organization\'s specific practices.',
        confidence: 0.0,
        evidence: { items: [] },
      };
    }
  }

  /**
   * Private helper: Build organization context for AI
   */
  private buildOrganizationContext(organization: Record<string, unknown>): string {
    const context: string[] = [];
    const org = organization as {
      name: string;
      plan: string;
      frameworks?: Array<{ name: string; controls?: unknown[] }>;
      policies?: Array<{ title: string }>;
      trustCertificates?: Array<{ status: string; certificateType: string }>;
    };

    // Add basic info
    context.push(`Organization Name: ${org.name}`);
    context.push(`Plan: ${org.plan}`);

    // Add frameworks
    if (org.frameworks && org.frameworks.length > 0) {
      const frameworks = org.frameworks
        .map((f) => f.name)
        .join(', ');
      context.push(`Compliance Frameworks: ${frameworks}`);

      const totalControls = org.frameworks.reduce(
        (sum: number, f) => sum + (f.controls?.length || 0),
        0
      );
      context.push(`Total Controls Implemented: ${totalControls}`);
    }

    // Add policies
    if (org.policies && org.policies.length > 0) {
      const policies = org.policies
        .map((p) => p.title)
        .join(', ');
      context.push(`Policies: ${policies}`);
    }

    // Add certifications
    if (org.trustCertificates && org.trustCertificates.length > 0) {
      const certs = org.trustCertificates
        .filter((c) => c.status === 'Valid')
        .map((c) => c.certificateType)
        .join(', ');
      if (certs) {
        context.push(`Certifications: ${certs}`);
      }
    }

    return context.join('\n');
  }

  /**
   * Submit manual response
   */
  async submitResponse(
    questionnaireId: string,
    questionId: string,
    data: {
      responseText: string;
      responseData?: Record<string, unknown>;
      attachments?: Record<string, unknown>;
    },
    userId: string,
    organizationId: string
  ) {
    // Verify questionnaire belongs to this organization
    const parentQuestionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
    });
    if (!parentQuestionnaire) {
      throw new AppError('Questionnaire not found', 404);
    }

    // Check if AI response exists
    const existing = await prisma.questionnaireResponse.findFirst({
      where: {
        questionnaireId,
        questionId,
      },
    });

    let response;

    if (existing) {
      // Update existing response
      response = await prisma.questionnaireResponse.update({
        where: { id: existing.id },
        data: {
          responseText: data.responseText,
          responseData: data.responseData as Prisma.InputJsonValue,
          attachments: data.attachments as Prisma.InputJsonValue,
          reviewedByHuman: true,
        },
      });
    } else {
      // Create new response
      response = await prisma.questionnaireResponse.create({
        data: {
          questionnaireId,
          questionId,
          responseText: data.responseText,
          responseData: data.responseData as Prisma.InputJsonValue,
          attachments: data.attachments as Prisma.InputJsonValue,
          aiGenerated: false,
        },
      });
    }

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'questionnaire.response_submitted',
      resourceType: 'QuestionnaireResponse',
      resourceId: response.id,
      metadata: { questionnaireId, questionId },
    });

    return response;
  }

  /**
   * Complete questionnaire
   */
  async completeQuestionnaire(
    questionnaireId: string,
    userId: string,
    organizationId: string
  ) {
    // Verify questionnaire belongs to this organization
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
      include: {
        questions: true,
        responses: true,
      },
    });

    if (!questionnaire) {
      throw new AppError('Questionnaire not found', 404);
    }

    const requiredQuestions = questionnaire.questions.filter(
      (q: QuestionnaireQuestion) => q.required
    );
    const answeredQuestions = new Set(
      questionnaire.responses.map((r: QuestionnaireResponse) => r.questionId)
    );

    const unansweredRequired = requiredQuestions.filter(
      (q: QuestionnaireQuestion) => !answeredQuestions.has(q.id)
    );

    if (unansweredRequired.length > 0) {
      throw new AppError(
        `Cannot complete questionnaire: ${unansweredRequired.length} required questions unanswered`,
        400
      );
    }

    const updated = await prisma.questionnaire.update({
      where: { id: questionnaireId },
      data: {
        status: 'Completed',
        completedAt: new Date(),
      },
      include: {
        questions: true,
        responses: true,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'questionnaire.completed',
      resourceType: 'Questionnaire',
      resourceId: questionnaireId,
      metadata: {
        totalQuestions: questionnaire.questions.length,
        aiAssisted: questionnaire.aiAssisted,
      },
    });

    return updated;
  }

  /**
   * Get questionnaires by organization
   */
  async getQuestionnairesByOrganization(
    organizationId: string,
    filters?: {
      status?: QuestionnaireStatus;
      questionnaireType?: string;
    }
  ) {
    return await prisma.questionnaire.findMany({
      where: {
        organizationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.questionnaireType && {
          questionnaireType: filters.questionnaireType,
        }),
      },
      include: {
        questions: true,
        responses: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get questionnaire metrics
   */
  async getQuestionnaireMetrics(organizationId: string) {
    const questionnaires = await prisma.questionnaire.findMany({
      where: { organizationId },
      include: {
        questions: true,
        responses: true,
      },
    }) as QuestionnaireWithRelations[];

    const now = new Date();

    return {
      total: questionnaires.length,
      byStatus: {
        draft: questionnaires.filter((q) => q.status === 'Draft').length,
        inProgress: questionnaires.filter((q) => q.status === 'In_Progress')
          .length,
        completed: questionnaires.filter((q) => q.status === 'Completed')
          .length,
        reviewed: questionnaires.filter((q) => q.status === 'Reviewed').length,
        approved: questionnaires.filter((q) => q.status === 'Approved').length,
      },
      aiAssisted: questionnaires.filter((q) => q.aiAssisted).length,
      averageAIConfidence:
        questionnaires.filter((q) => q.aiConfidence).length > 0
          ? Math.round(
              (questionnaires.reduce(
                (sum, q) => sum + (q.aiConfidence || 0),
                0
              ) /
                questionnaires.filter((q) => q.aiConfidence).length) *
                100
            ) / 100
          : 0,
      overdue: questionnaires.filter(
        (q) =>
          q.dueDate &&
          q.dueDate < now &&
          q.status !== 'Completed' &&
          q.status !== 'Approved'
      ).length,
      completionRate:
        questionnaires.length > 0
          ? Math.round(
              (questionnaires.filter(
                (q) => q.status === 'Completed' || q.status === 'Approved'
              ).length /
                questionnaires.length) *
                100
            )
          : 0,
      averageCompletionTime: this.calculateAverageCompletionTime(
        questionnaires
      ),
    };
  }

  /**
   * Private helper: Calculate average completion time
   */
  private calculateAverageCompletionTime(questionnaires: QuestionnaireWithRelations[]): number {
    const completed = questionnaires.filter(
      (q) => q.status === 'Completed' && q.completedAt && q.requestDate
    );

    if (completed.length === 0) return 0;

    const totalDays = completed.reduce((sum, q) => {
      const days =
        (q.completedAt!.getTime() - q.requestDate!.getTime()) /
        (24 * 60 * 60 * 1000);
      return sum + days;
    }, 0);

    return Math.round(totalDays / completed.length);
  }

  /**
   * Export questionnaire to PDF/Word
   * Production-ready: Full PDF export implementation
   */
  async exportQuestionnaire(
    questionnaireId: string,
    format: 'pdf' | 'docx' | 'json'
  ) {
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        responses: true,
      },
    });

    if (!questionnaire) {
      throw new AppError('Questionnaire not found', 404);
    }

    if (format === 'json') {
      return {
        questionnaire,
        format,
        generatedAt: new Date(),
      };
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      // Add title
      doc.fontSize(20).text(questionnaire.title, { align: 'center' });
      doc.moveDown();

      if (questionnaire.description) {
        doc.fontSize(12).text(questionnaire.description);
        doc.moveDown();
      }

      // Add questions
      doc.fontSize(16).text('Questions:', { underline: true });
      doc.moveDown(0.5);

      questionnaire.questions.forEach((q, index) => {
        doc.fontSize(14).text(`${index + 1}. ${q.questionText}`, { continued: false });
        if (q.questionType) {
          doc.fontSize(10).text(`Type: ${q.questionType}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      });

      // Add responses if available
      if (questionnaire.responses && questionnaire.responses.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Responses:', { underline: true });
        doc.moveDown(0.5);

        questionnaire.responses.forEach((r, index) => {
          doc.fontSize(12).text(`Response ${index + 1}:`, { continued: false });
          doc.text(JSON.stringify(r, null, 2), { indent: 20 });
          doc.moveDown(0.5);
        });
      }

      doc.end();

      return new Promise<{ format: string; content: Buffer; filename: string }>((resolve) => {
        doc.on('end', () => {
          resolve({
            format: 'pdf',
            content: Buffer.concat(chunks),
            filename: `questionnaire-${questionnaire.id}-${new Date().toISOString().split('T')[0]}.pdf`,
          });
        });
      });
    }

    // DOCX export (Production-ready: uses docx library)
    if (format === 'docx') {
      try {
        // Use docx library for DOCX generation
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: questionnaire.title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: '' }), // Spacing
              ...questionnaire.questions.map((q: any, index: number) => [
                new Paragraph({
                  text: `Question ${index + 1}`,
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: q.question,
                  spacing: { after: 200 },
                }),
                ...(q.options && q.options.length > 0 ? [
                  new Paragraph({
                    text: 'Options:',
                    spacing: { before: 100 },
                  }),
                  ...q.options.map((opt: string) => 
                    new Paragraph({
                      text: `  • ${opt}`,
                      indent: { left: 400 },
                    })
                  ),
                ] : []),
                ...(q.answer ? [
                  new Paragraph({
                    text: `Answer: ${q.answer}`,
                    spacing: { before: 100 },
                  }),
                ] : []),
                new Paragraph({ text: '' }), // Spacing between questions
              ]).flat(),
            ],
          }],
        });
        
        const buffer = await Packer.toBuffer(doc);
        
        return {
          format: 'docx',
          content: buffer,
          filename: `questionnaire-${questionnaire.id}-${new Date().toISOString().split('T')[0]}.docx`,
        };
      } catch (docxError: any) {
        logger.error('[Questionnaire] Error generating DOCX', docxError);
        // Fallback: Try using a simpler approach or return error
        throw new AppError(`DOCX generation failed: ${docxError.message}. Please install 'docx' package: npm install docx`, 500);
      }
    }
    
    // Return clear validation error with 400 status for unsupported format
    throw new AppError(
      `Unsupported export format '${format}'. Supported formats are: 'json', 'pdf', 'docx'.`,
      400
    );
  }
}

export default new QuestionnaireService();
