import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import geminiService from '../services/geminiService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

class AIController {
  async generateReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { framework, companyName, context } = req.body;

      if (!framework || !companyName || !context) {
        throw new AppError('Framework, company name, and context are required', 400);
      }

      const report = await geminiService.generateComplianceReport(
        framework,
        companyName,
        context,
        req.user!.id
      );

      res.json({ report });
    } catch (error) {
      logger.error('Generate report error', error);
      throw new AppError('Failed to generate report', 500);
    }
  }

  async generatePolicy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, company, tone } = req.body;
      const policy = await geminiService.generatePolicy(type, company, tone, req.user!.id);
      res.json({ policy });
    } catch (error) {
      logger.error('Generate policy error', error);
      throw new AppError('Failed to generate policy', 500);
    }
  }

  async analyzeContract(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { text } = req.body;
      const analysis = await geminiService.analyzeContract(text, req.user!.id);
      res.json({ analysis });
    } catch (error) {
      logger.error('Analyze contract error', error);
      throw new AppError('Failed to analyze contract', 500);
    }
  }

  async performGapAnalysis(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { current, target } = req.body;
      const analysis = await geminiService.performGapAnalysis(current, target, req.user!.id);
      res.json({ analysis });
    } catch (error) {
      logger.error('Gap analysis error', error);
      throw new AppError('Failed to perform gap analysis', 500);
    }
  }

  async generateRFPResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { question, context } = req.body;
      const response = await geminiService.generateRFPResponse(question, context, req.user!.id);
      res.json({ response });
    } catch (error) {
      logger.error('RFP response error', error);
      throw new AppError('Failed to generate RFP response', 500);
    }
  }

  async generatePhishing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { theme, department } = req.body;
      const email = await geminiService.generatePhishingSimulation(theme, department, req.user!.id);
      res.json({ email });
    } catch (error) {
      logger.error('Generate phishing error', error);
      throw new AppError('Failed to generate phishing simulation', 500);
    }
  }

  async scoreVendor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vendor, service, dataAccess } = req.body;
      const score = await geminiService.scoreVendorRisk(vendor, service, dataAccess, req.user!.id);
      res.json({ score });
    } catch (error) {
      logger.error('Score vendor error', error);
      throw new AppError('Failed to score vendor', 500);
    }
  }

  async generateDataMap(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { process } = req.body;
      const map = await geminiService.generateDataMap(process, req.user!.id);
      res.json({ map });
    } catch (error) {
      logger.error('Generate data map error', error);
      throw new AppError('Failed to generate data map', 500);
    }
  }

  async generateBCP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scenario } = req.body;
      const plan = await geminiService.generateBCP(scenario, req.user!.id);
      res.json({ plan });
    } catch (error) {
      logger.error('Generate BCP error', error);
      throw new AppError('Failed to generate BCP', 500);
    }
  }

  async chat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { message } = req.body;
      const response = await geminiService.chatWithBot(message, req.user!.id);
      res.json({ response });
    } catch (error) {
      logger.error('Chat error', error);
      throw new AppError('Failed to get chat response', 500);
    }
  }
}

export default new AIController();
