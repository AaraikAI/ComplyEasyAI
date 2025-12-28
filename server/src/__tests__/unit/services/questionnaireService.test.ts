/**
 * Questionnaire Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('AI response'),
        },
      }),
    }),
  })),
}));

import { QuestionnaireService } from '../../../services/questionnaireService';

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuestionnaireService();
  });

  describe('createQuestionnaire()', () => {
    it('should create questionnaire', async () => {
      const data = {
        organizationId: 'org-123',
        title: 'Security Assessment',
        questionnaireType: 'Security',
        userId: 'user-123',
      };

      const mockQuestionnaire = {
        id: 'questionnaire-123',
        ...data,
        status: 'Draft',
      };

      prismaMock.questionnaire.create.mockResolvedValue(mockQuestionnaire as any);

      const result = await service.createQuestionnaire(data);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'Draft');
    });
  });

  describe('addQuestions()', () => {
    it('should add questions to questionnaire', async () => {
      const questions = [
        { questionText: 'Question 1', questionType: 'text' },
        { questionText: 'Question 2', questionType: 'multiple-choice' },
      ];

      prismaMock.questionnaireQuestion.create.mockResolvedValue({
        id: 'question-123',
      } as any);

      const result = await service.addQuestions(
        'questionnaire-123',
        questions,
        'user-123',
        'org-123'
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('submitResponse()', () => {
    it('should submit questionnaire response', async () => {
      const responseData = {
        questionnaireId: 'questionnaire-123',
        responses: [{ questionId: 'q-1', answer: 'Yes' }],
      };

      prismaMock.questionnaireResponse.create.mockResolvedValue({
        id: 'response-123',
      } as any);
      prismaMock.questionnaire.update.mockResolvedValue({} as any);

      const result = await service.submitResponse(
        responseData.questionnaireId,
        responseData.responses,
        'user-123',
        'org-123'
      );

      expect(result).toHaveProperty('id');
    });
  });
});

