/**
 * Questionnaire Service Contract Tests
 *
 * Verifies the contract for questionnaire CRUD, question management,
 * and AI-assisted response generation.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockQuestionnaire } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'AI response' },
      }),
    }),
  })),
}));

import questionnaireService from '../../../services/questionnaireService';

describe('QuestionnaireService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createQuestionnaire
  // ---------------------------------------------------------------------------
  describe('createQuestionnaire', () => {
    it('should call prisma.questionnaire.create with correct shape', async () => {
      const mockQuestionnaire = createMockQuestionnaire({ id: 'q-1' });
      prismaMock.questionnaire.create.mockResolvedValue(mockQuestionnaire);

      await questionnaireService.createQuestionnaire({
        organizationId: 'org-123',
        title: 'Vendor Security Assessment',
        questionnaireType: 'Security',
        userId: 'user-1',
      });

      expect(prismaMock.questionnaire.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          title: 'Vendor Security Assessment',
          questionnaireType: 'Security',
          status: 'Draft',
          requestDate: expect.any(Date),
        }),
      });
    });

    it('should default status to Draft', async () => {
      prismaMock.questionnaire.create.mockResolvedValue(createMockQuestionnaire());

      await questionnaireService.createQuestionnaire({
        organizationId: 'org-123',
        title: 'Test',
        questionnaireType: 'Compliance',
        userId: 'user-1',
      });

      expect(prismaMock.questionnaire.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'Draft',
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.questionnaire.create.mockRejectedValue(new Error('DB error'));

      await expect(
        questionnaireService.createQuestionnaire({
          organizationId: 'org-123',
          title: 'Test',
          questionnaireType: 'Security',
          userId: 'user-1',
        })
      ).rejects.toThrow('DB error');
    });

    it('should handle optional dueDate field', async () => {
      prismaMock.questionnaire.create.mockResolvedValue(createMockQuestionnaire());
      const dueDate = new Date('2026-06-01');

      await questionnaireService.createQuestionnaire({
        organizationId: 'org-123',
        title: 'Test',
        questionnaireType: 'Security',
        dueDate,
        userId: 'user-1',
      });

      expect(prismaMock.questionnaire.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dueDate,
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addQuestions
  // ---------------------------------------------------------------------------
  describe('addQuestions', () => {
    beforeEach(() => {
      // Multi-tenant pre-check: parent questionnaire must belong to org.
      prismaMock.questionnaire.findFirst.mockResolvedValue({
        id: 'q-1',
        organizationId: 'org-123',
      } as any);
    });

    it('should create questions with correct order and category defaults', async () => {
      prismaMock.questionnaireQuestion.create
        .mockResolvedValueOnce({ id: 'qq-1', order: 1 })
        .mockResolvedValueOnce({ id: 'qq-2', order: 2 });

      await questionnaireService.addQuestions(
        'q-1',
        [
          { questionText: 'Do you have SOC 2?', questionType: 'YesNo' },
          { questionText: 'Describe your security program', questionType: 'FreeText', category: 'Security' },
        ],
        'user-1',
        'org-123'
      );

      // First question with default category
      expect(prismaMock.questionnaireQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          questionnaireId: 'q-1',
          questionText: 'Do you have SOC 2?',
          questionType: 'YesNo',
          category: 'General',
          required: true,
          order: 1,
        }),
      });

      // Second question with explicit category
      expect(prismaMock.questionnaireQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          questionText: 'Describe your security program',
          category: 'Security',
          order: 2,
        }),
      });
    });

    it('should default required to true when not specified', async () => {
      prismaMock.questionnaireQuestion.create.mockResolvedValue({ id: 'qq-1' });

      await questionnaireService.addQuestions(
        'q-1',
        [{ questionText: 'Question?', questionType: 'YesNo' }],
        'user-1',
        'org-123'
      );

      expect(prismaMock.questionnaireQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          required: true,
        }),
      });
    });

    it('should return array of created questions', async () => {
      prismaMock.questionnaireQuestion.create
        .mockResolvedValueOnce({ id: 'qq-1' })
        .mockResolvedValueOnce({ id: 'qq-2' });

      const result = await questionnaireService.addQuestions(
        'q-1',
        [
          { questionText: 'Q1', questionType: 'YesNo' },
          { questionText: 'Q2', questionType: 'FreeText' },
        ],
        'user-1',
        'org-123'
      );

      expect(result).toHaveLength(2);
    });
  });
});
