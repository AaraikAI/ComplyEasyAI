import { PrismaClient, QuestionnaireStatus } from '@prisma/client';
import { AuditLogger } from '../utils/auditLogger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    dueDate?: Date;
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
        dueDate: data.dueDate,
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
      options?: any;
    }>,
    userId: string,
    organizationId: string
  ) {
    const createdQuestions = await Promise.all(
      questions.map(async (q, index) => {
        return await prisma.questionnaireQuestion.create({
          data: {
            questionnaireId,
            questionText: q.questionText,
            questionType: q.questionType,
            category: q.category || 'General',
            required: q.required ?? true,
            questionOrder: index + 1,
            options: q.options || {},
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
    // Get questionnaire with questions
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('Questionnaire not found');
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
      throw new Error('Organization not found');
    }

    const responses: any[] = [];
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
          evidence: aiResponse.evidence,
        },
      });

      responses.push(response);
      totalConfidence += aiResponse.confidence;
    }

    // Update questionnaire with AI assistance flag
    const averageConfidence = totalConfidence / questionnaire.questions.length;

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
    organization: any
  ): Promise<{
    answer: string;
    confidence: number;
    evidence: any;
  }> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
          evidence: parsed.evidence || [],
        };
      }

      // Fallback if JSON parsing fails
      return {
        answer: text,
        confidence: 0.5,
        evidence: [],
      };
    } catch (error) {
      console.error('AI response generation failed:', error);
      return {
        answer:
          'This question requires manual review. Please provide a response based on your organization's specific practices.',
        confidence: 0.0,
        evidence: [],
      };
    }
  }

  /**
   * Private helper: Build organization context for AI
   */
  private buildOrganizationContext(organization: any): string {
    const context: string[] = [];

    // Add basic info
    context.push(`Organization Name: ${organization.name}`);
    context.push(`Plan: ${organization.plan}`);

    // Add frameworks
    if (organization.frameworks && organization.frameworks.length > 0) {
      const frameworks = organization.frameworks
        .map((f: any) => f.name)
        .join(', ');
      context.push(`Compliance Frameworks: ${frameworks}`);

      const totalControls = organization.frameworks.reduce(
        (sum: number, f: any) => sum + (f.controls?.length || 0),
        0
      );
      context.push(`Total Controls Implemented: ${totalControls}`);
    }

    // Add policies
    if (organization.policies && organization.policies.length > 0) {
      const policies = organization.policies
        .map((p: any) => p.title)
        .join(', ');
      context.push(`Policies: ${policies}`);
    }

    // Add certifications
    if (
      organization.trustCertificates &&
      organization.trustCertificates.length > 0
    ) {
      const certs = organization.trustCertificates
        .filter((c: any) => c.status === 'Active')
        .map((c: any) => c.certificationType)
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
      evidence?: any;
      attachments?: any;
    },
    userId: string,
    organizationId: string
  ) {
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
          evidence: data.evidence,
          attachments: data.attachments,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });
    } else {
      // Create new response
      response = await prisma.questionnaireResponse.create({
        data: {
          questionnaireId,
          questionId,
          responseText: data.responseText,
          evidence: data.evidence,
          attachments: data.attachments,
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
    // Check all required questions have responses
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: true,
        responses: true,
      },
    });

    if (!questionnaire) {
      throw new Error('Questionnaire not found');
    }

    const requiredQuestions = questionnaire.questions.filter(
      (q) => q.required
    );
    const answeredQuestions = new Set(
      questionnaire.responses.map((r) => r.questionId)
    );

    const unansweredRequired = requiredQuestions.filter(
      (q) => !answeredQuestions.has(q.id)
    );

    if (unansweredRequired.length > 0) {
      throw new Error(
        `Cannot complete questionnaire: ${unansweredRequired.length} required questions unanswered`
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
    });

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
  private calculateAverageCompletionTime(questionnaires: any[]): number {
    const completed = questionnaires.filter(
      (q) => q.status === 'Completed' && q.completedAt && q.requestDate
    );

    if (completed.length === 0) return 0;

    const totalDays = completed.reduce((sum, q) => {
      const days =
        (q.completedAt.getTime() - q.requestDate.getTime()) /
        (24 * 60 * 60 * 1000);
      return sum + days;
    }, 0);

    return Math.round(totalDays / completed.length);
  }

  /**
   * Export questionnaire to PDF/Word (placeholder for future implementation)
   */
  async exportQuestionnaire(
    questionnaireId: string,
    format: 'pdf' | 'docx' | 'json'
  ) {
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          orderBy: { questionOrder: 'asc' },
        },
        responses: true,
      },
    });

    if (!questionnaire) {
      throw new Error('Questionnaire not found');
    }

    // For now, return JSON format
    // PDF/DOCX generation would require additional libraries
    return {
      questionnaire,
      format,
      generatedAt: new Date(),
    };
  }
}

export default new QuestionnaireService();
