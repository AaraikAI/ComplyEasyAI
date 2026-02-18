import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import geminiService from '../services/geminiService';
import secureChatService from '../services/secureChatService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

class AIController {
  generateReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework, companyName, context } = req.body;

      if (!framework || !companyName || !context) {
        throw new AppError('Framework, company name, and context are required', 400);
      }

      const report = await geminiService.generateComplianceReport(
        framework,
        companyName,
        context,
        authReq.user!.id
      );

      res.json({ report });
    } catch (error: any) {
      logger.error('Generate report error', {
        error: error.message,
        stack: error.stack,
        userId: (req as AuthRequest).user?.id,
      });

      if (error instanceof AppError) {
        throw error;
      }

      if (error.message && !error.message.includes('Failed to generate report')) {
        throw new AppError(error.message, 500);
      }

      throw new AppError('Failed to generate report', 500);
    }
  };

  generatePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { type, company, tone } = req.body;

      if (!type || !company || !tone) {
        throw new AppError('Type, company, and tone are required', 400);
      }

      const policy = await geminiService.generatePolicy(type, company, tone, authReq.user!.id);
      res.json({ policy });
    } catch (error: any) {
      logger.error('Generate policy error', {
        error: error.message,
        stack: error.stack,
        userId: (req as AuthRequest).user?.id,
      });

      if (error instanceof AppError) {
        throw error;
      }

      if (error.message && !error.message.includes('Failed to generate policy')) {
        throw new AppError(error.message, 500);
      }

      throw new AppError('Failed to generate policy', 500);
    }
  };

  analyzeContract: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { text } = req.body;
      const analysis = await geminiService.analyzeContract(text, authReq.user!.id);
      res.json({ analysis });
    } catch (error) {
      logger.error('Analyze contract error', error);
      throw new AppError('Failed to analyze contract', 500);
    }
  };

  performGapAnalysis: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { current, target } = req.body;
      const targetArray = Array.isArray(target) ? target : [target];
      const result = await geminiService.performGapAnalysis(current, targetArray, authReq.user!.id);
      res.json(result);
    } catch (error: any) {
      logger.error('Gap analysis error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to perform gap analysis', 500);
    }
  };

  generateRFPResponse: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { question, context } = req.body;
      const result = await geminiService.generateRFPResponse(question, context, authReq.user!.id);
      res.json(result);
    } catch (error: any) {
      logger.error('RFP response error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to generate RFP response', 500);
    }
  };

  generatePhishing: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { type, theme, department, difficulty } = req.body;
      const result = await geminiService.generatePhishingSimulation(
        type || 'Email',
        theme,
        department,
        difficulty || 'Medium',
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Generate phishing error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to generate phishing simulation', 500);
    }
  };

  scoreVendor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { vendor, service, dataAccess } = req.body;
      const score = await geminiService.scoreVendorRisk(vendor, service, dataAccess, authReq.user!.id);
      res.json({ score });
    } catch (error) {
      logger.error('Score vendor error', error);
      throw new AppError('Failed to score vendor', 500);
    }
  };

  generateDataMap: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { process } = req.body;
      const result = await geminiService.generateDataMap(process, authReq.user!.id);
      res.json(result);
    } catch (error: any) {
      logger.error('Generate data map error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to generate data map', 500);
    }
  };

  generateBCP: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenario, rto, rpo } = req.body;
      const result = await geminiService.generateBCP(
        scenario,
        rto || '4 hours',
        rpo || '1 hour',
        authReq.user!.id
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Generate BCP error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to generate BCP', 500);
    }
  };

  chat: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { message, fileContext } = req.body;

      if (!message) {
        throw new AppError('Message is required', 400);
      }

      const chatResponse = await secureChatService.chatWithUser(
        message,
        authReq.user!.id,
        authReq.user!.organizationId,
        fileContext
      );

      res.json({
        response: chatResponse.response,
        sources: chatResponse.sources,
        encrypted: chatResponse.encrypted,
      });
    } catch (error: any) {
      logger.error('Chat error', {
        error: error.message,
        stack: error.stack,
        userId: (req as AuthRequest).user?.id,
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to get chat response', 500);
    }
  };

  /* ================================================================== */
  /*  TIER AI FEATURES                                                   */
  /* ================================================================== */

  crossFrameworkMapping: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { sourceFramework, targetFramework, sourceControls, targetControls } = req.body;

      if (!sourceFramework || !targetFramework) {
        throw new AppError('Source and target frameworks are required', 400);
      }

      const result = await geminiService.crossFrameworkMapping(
        sourceFramework,
        targetFramework,
        sourceControls || [],
        targetControls || [],
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Cross-framework mapping error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to perform cross-framework mapping', 500);
    }
  };

  regulatoryAutoRemediation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework, gaps, organizationContext } = req.body;

      if (!framework || !gaps || !Array.isArray(gaps)) {
        throw new AppError('Framework and gaps array are required', 400);
      }

      const result = await geminiService.regulatoryAutoRemediation(
        framework,
        gaps,
        organizationContext || '',
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Auto-remediation error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to generate remediation plan', 500);
    }
  };

  checkEvidenceCompleteness: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework, controls } = req.body;

      if (!framework || !controls || !Array.isArray(controls)) {
        throw new AppError('Framework and controls array are required', 400);
      }

      const result = await geminiService.checkEvidenceCompleteness(
        framework,
        controls,
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Evidence completeness error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to check evidence completeness', 500);
    }
  };

  agenticVendorRisk: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { vendor, assessmentScope } = req.body;

      if (!vendor || !vendor.name) {
        throw new AppError('Vendor details are required', 400);
      }

      const result = await geminiService.agenticVendorRisk(
        vendor,
        assessmentScope || ['Security', 'Privacy', 'Business Continuity', 'Regulatory', 'Fourth-Party'],
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Agentic vendor risk error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to assess vendor risk', 500);
    }
  };

  simulateAudit: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework, controlDomain, controlsToAudit, previousAnswers } = req.body;

      if (!framework || !controlDomain) {
        throw new AppError('Framework and control domain are required', 400);
      }

      const result = await geminiService.simulateAudit(
        framework,
        controlDomain,
        controlsToAudit || [],
        previousAnswers,
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Audit simulation error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to simulate audit', 500);
    }
  };

  naturalLanguageQuery: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { query, context } = req.body;

      if (!query) {
        throw new AppError('Query is required', 400);
      }

      const result = await geminiService.naturalLanguageQuery(
        query,
        context || { frameworks: [] },
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('NL query error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to process query', 500);
    }
  };

  complianceCopilot: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { message, conversationHistory, context } = req.body;

      if (!message) {
        throw new AppError('Message is required', 400);
      }

      const result = await geminiService.complianceCopilot(
        message,
        conversationHistory || [],
        context || {},
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Copilot error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to get copilot response', 500);
    }
  };

  forecastComplianceScore: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { currentScores, upcomingChanges, historicalData } = req.body;

      if (!currentScores || !Array.isArray(currentScores)) {
        throw new AppError('Current scores array is required', 400);
      }

      const result = await geminiService.forecastComplianceScore(
        currentScores,
        upcomingChanges || [],
        historicalData || [],
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Forecasting error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to forecast compliance score', 500);
    }
  };

  analyzeProcess: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { processDescription, category, complianceFrameworks } = req.body;

      if (!processDescription) {
        throw new AppError('Process description is required', 400);
      }

      const result = await geminiService.analyzeProcess(
        processDescription,
        category || 'Business Operations',
        complianceFrameworks || [],
        authReq.user!.id
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Process analysis error', { error: error.message, userId: (req as AuthRequest).user?.id });
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to analyze process', 500);
    }
  };
}

export default new AIController();
