import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import geminiService from '../services/geminiService';
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
    } catch (error) {
      logger.error('Generate report error', error);
      throw new AppError('Failed to generate report', 500);
    }
  };

  generatePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { type, company, tone } = req.body;
      const policy = await geminiService.generatePolicy(type, company, tone, authReq.user!.id);
      res.json({ policy });
    } catch (error) {
      logger.error('Generate policy error', error);
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
      const analysis = await geminiService.performGapAnalysis(current, target, authReq.user!.id);
      res.json({ analysis });
    } catch (error) {
      logger.error('Gap analysis error', error);
      throw new AppError('Failed to perform gap analysis', 500);
    }
  };

  generateRFPResponse: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { question, context } = req.body;
      const response = await geminiService.generateRFPResponse(question, context, authReq.user!.id);
      res.json({ response });
    } catch (error) {
      logger.error('RFP response error', error);
      throw new AppError('Failed to generate RFP response', 500);
    }
  };

  generatePhishing: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { theme, department } = req.body;
      const email = await geminiService.generatePhishingSimulation(theme, department, authReq.user!.id);
      res.json({ email });
    } catch (error) {
      logger.error('Generate phishing error', error);
      throw new AppError('Failed to generate phishing simulation', 500);
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
      const map = await geminiService.generateDataMap(process, authReq.user!.id);
      res.json({ map });
    } catch (error) {
      logger.error('Generate data map error', error);
      throw new AppError('Failed to generate data map', 500);
    }
  };

  generateBCP: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { scenario } = req.body;
      const plan = await geminiService.generateBCP(scenario, authReq.user!.id);
      res.json({ plan });
    } catch (error) {
      logger.error('Generate BCP error', error);
      throw new AppError('Failed to generate BCP', 500);
    }
  };

  chat: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { message } = req.body;
      const response = await geminiService.chatWithBot(message, authReq.user!.id);
      res.json({ response });
    } catch (error) {
      logger.error('Chat error', error);
      throw new AppError('Failed to get chat response', 500);
    }
  };
}

export default new AIController();
