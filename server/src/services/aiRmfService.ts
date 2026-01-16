import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { NIST_AI_RMF_DATA } from '../data/nistAiRmfData';

/**
 * NIST AI RMF 1.0 Service
 * Implements the Artificial Intelligence Risk Management Framework
 * Based on NIST AI 100-1
 */
class AIRMFService {
  // ============================================================================
  // AI System Management
  // ============================================================================

  /**
   * Create a new AI system
   */
  async createAISystem(organizationId: string, data: {
    name: string;
    description?: string;
    systemType: string;
    useCase?: string;
    deploymentContext?: string;
    lifecycleStage?: string;
    autonomyLevel?: string;
    metadata?: any;
  }) {
    try {
      const aiSystem = await prisma.aISystem.create({
        data: {
          organizationId,
          name: data.name,
          description: data.description,
          systemType: data.systemType,
          useCase: data.useCase,
          deploymentContext: data.deploymentContext,
          lifecycleStage: data.lifecycleStage || 'Plan_and_Design',
          autonomyLevel: data.autonomyLevel || 'Human_in_Loop',
          metadata: data.metadata,
        },
      });

      // Initialize core functions
      await this.initializeCoreFunctions(aiSystem.id);

      // Initialize trustworthiness characteristics
      await this.initializeTrustworthinessCharacteristics(aiSystem.id);

      // Initialize lifecycle stages
      await this.initializeLifecycleStages(aiSystem.id);

      return aiSystem;
    } catch (error: any) {
      logger.error('Error creating AI system:', error);
      throw new AppError(`Failed to create AI system: ${error.message}`, 500);
    }
  }

  /**
   * Get all AI systems for an organization
   */
  async getAISystems(organizationId: string, filters?: {
    status?: string;
    lifecycleStage?: string;
    riskLevel?: string;
  }) {
    try {
      const where: any = { organizationId };
      if (filters?.status) where.status = filters.status;
      if (filters?.lifecycleStage) where.lifecycleStage = filters.lifecycleStage;
      if (filters?.riskLevel) where.riskLevel = filters.riskLevel;

      return await prisma.aISystem.findMany({
        where,
        include: {
          coreFunctions: {
            include: {
              categories: {
                include: {
                  subcategories: true,
                },
              },
            },
          },
          trustworthinessCharacteristics: true,
          lifecycleStages: true,
          actors: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Error fetching AI systems:', error);
      throw new AppError(`Failed to fetch AI systems: ${error.message}`, 500);
    }
  }

  /**
   * Get AI system by ID
   */
  async getAISystemById(organizationId: string, aiSystemId: string) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
        include: {
          coreFunctions: {
            include: {
              categories: {
                include: {
                  subcategories: {
                    include: {
                      owner: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          trustworthinessCharacteristics: true,
          lifecycleStages: true,
          actors: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          assessments: {
            orderBy: { assessmentDate: 'desc' },
            take: 10,
          },
          profiles: true,
          riskActivities: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      return aiSystem;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching AI system:', error);
      throw new AppError(`Failed to fetch AI system: ${error.message}`, 500);
    }
  }

  /**
   * Update AI system
   */
  async updateAISystem(organizationId: string, aiSystemId: string, updates: any) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      return await prisma.aISystem.update({
        where: { id: aiSystemId },
        data: updates,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating AI system:', error);
      throw new AppError(`Failed to update AI system: ${error.message}`, 500);
    }
  }

  /**
   * Delete AI system
   */
  async deleteAISystem(organizationId: string, aiSystemId: string) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      await prisma.aISystem.delete({
        where: { id: aiSystemId },
      });

      return { success: true };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting AI system:', error);
      throw new AppError(`Failed to delete AI system: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Core Functions Management
  // ============================================================================

  /**
   * Initialize core functions for an AI system
   */
  private async initializeCoreFunctions(aiSystemId: string) {
    const coreFunctions = ['GOVERN', 'MAP', 'MEASURE', 'MANAGE'];
    
    for (const functionName of coreFunctions) {
      await prisma.aIRMFCoreFunction.create({
        data: {
          aiSystemId,
          functionName,
          description: this.getCoreFunctionDescription(functionName),
        },
      });

      // Initialize categories for each function
      await this.initializeCategories(aiSystemId, functionName);
    }
  }

  /**
   * Get core function description
   */
  private getCoreFunctionDescription(functionName: string): string {
    const functionData = NIST_AI_RMF_DATA[functionName];
    return functionData?.description || '';
  }

  /**
   * Initialize categories for a core function
   */
  private async initializeCategories(aiSystemId: string, functionName: string) {
    const categories = this.getCategoriesForFunction(functionName);
    const coreFunction = await prisma.aIRMFCoreFunction.findFirst({
      where: { aiSystemId, functionName },
    });

    if (!coreFunction) return;

    for (const category of categories) {
      await prisma.aIRMFCategory.create({
        data: {
          coreFunctionId: coreFunction.id,
          categoryId: category.id,
          name: category.name,
          description: category.description,
        },
      });

      // Initialize subcategories
      if (category.subcategories) {
        const createdCategory = await prisma.aIRMFCategory.findFirst({
          where: { coreFunctionId: coreFunction.id, categoryId: category.id },
        });

        if (createdCategory) {
          for (const subcategory of category.subcategories) {
            await prisma.aIRMFSubcategory.create({
              data: {
                categoryId: createdCategory.id,
                subcategoryId: subcategory.id,
                name: subcategory.name,
                description: subcategory.description,
              },
            });
          }
        }
      }
    }
  }

  /**
   * Get categories for a core function (based on NIST AI RMF 1.0)
   */
  private getCategoriesForFunction(functionName: string): any[] {
    const functionData = NIST_AI_RMF_DATA[functionName];
    if (!functionData) return [];

    return functionData.categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      subcategories: category.subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
      })),
    }));
  }

  /**
   * Update core function
   */
  async updateCoreFunction(organizationId: string, aiSystemId: string, functionName: string, updates: any) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      const coreFunction = await prisma.aIRMFCoreFunction.findFirst({
        where: { aiSystemId, functionName },
      });

      if (!coreFunction) {
        throw new AppError('Core function not found', 404);
      }

      return await prisma.aIRMFCoreFunction.update({
        where: { id: coreFunction.id },
        data: updates,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating core function:', error);
      throw new AppError(`Failed to update core function: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Category and Subcategory Management
  // ============================================================================

  /**
   * Update category
   */
  async updateCategory(organizationId: string, categoryId: string, updates: any) {
    try {
      const category = await prisma.aIRMFCategory.findFirst({
        where: { id: categoryId },
        include: {
          coreFunction: {
            include: {
              aiSystem: true,
            },
          },
        },
      });

      if (!category || category.coreFunction.aiSystem.organizationId !== organizationId) {
        throw new AppError('Category not found', 404);
      }

      return await prisma.aIRMFCategory.update({
        where: { id: categoryId },
        data: updates,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating category:', error);
      throw new AppError(`Failed to update category: ${error.message}`, 500);
    }
  }

  /**
   * Update subcategory
   */
  async updateSubcategory(organizationId: string, subcategoryId: string, updates: any) {
    try {
      const subcategory = await prisma.aIRMFSubcategory.findFirst({
        where: { id: subcategoryId },
        include: {
          category: {
            include: {
              coreFunction: {
                include: {
                  aiSystem: true,
                },
              },
              subcategories: true,
            },
          },
        },
      });

      if (!subcategory || subcategory.category.coreFunction.aiSystem.organizationId !== organizationId) {
        throw new AppError('Subcategory not found', 404);
      }

      const updated = await prisma.aIRMFSubcategory.update({
        where: { id: subcategoryId },
        data: updates,
      });

      // Recalculate category completion
      await this.recalculateCategoryCompletion(subcategory.categoryId);

      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating subcategory:', error);
      throw new AppError(`Failed to update subcategory: ${error.message}`, 500);
    }
  }

  /**
   * Recalculate category completion based on subcategories
   */
  private async recalculateCategoryCompletion(categoryId: string) {
    try {
      const category = await prisma.aIRMFCategory.findUnique({
        where: { id: categoryId },
        include: {
          subcategories: true,
          coreFunction: {
            include: {
              categories: {
                include: {
                  subcategories: true,
                },
              },
            },
          },
        },
      });

      if (!category || !category.subcategories || category.subcategories.length === 0) {
        return;
      }

      // Calculate category completion based on subcategories
      const completedSubcategories = category.subcategories.filter(
        (sub: any) => sub.status === 'Completed' || sub.status === 'Implemented'
      ).length;
      const categoryCompletion = Math.round(
        (completedSubcategories / category.subcategories.length) * 100
      );

      await prisma.aIRMFCategory.update({
        where: { id: categoryId },
        data: { completionPercent: categoryCompletion },
      });

      // Recalculate core function completion
      await this.recalculateCoreFunctionCompletion(category.coreFunctionId);
    } catch (error: any) {
      logger.error('Error recalculating category completion:', error);
    }
  }

  /**
   * Recalculate core function completion based on categories
   */
  private async recalculateCoreFunctionCompletion(coreFunctionId: string) {
    try {
      const coreFunction = await prisma.aIRMFCoreFunction.findUnique({
        where: { id: coreFunctionId },
        include: {
          categories: {
            include: {
              subcategories: true,
            },
          },
        },
      });

      if (!coreFunction || !coreFunction.categories || coreFunction.categories.length === 0) {
        return;
      }

      // Calculate based on all subcategories across all categories
      let totalSubcategories = 0;
      let completedSubcategories = 0;

      for (const category of coreFunction.categories) {
        if (category.subcategories) {
          totalSubcategories += category.subcategories.length;
          completedSubcategories += category.subcategories.filter(
            (sub: any) => sub.status === 'Completed' || sub.status === 'Implemented'
          ).length;
        }
      }

      const functionCompletion = totalSubcategories > 0
        ? Math.round((completedSubcategories / totalSubcategories) * 100)
        : 0;

      await prisma.aIRMFCoreFunction.update({
        where: { id: coreFunctionId },
        data: { completionPercent: functionCompletion },
      });
    } catch (error: any) {
      logger.error('Error recalculating core function completion:', error);
    }
  }

  // ============================================================================
  // Trustworthiness Characteristics
  // ============================================================================

  /**
   * Initialize trustworthiness characteristics
   */
  private async initializeTrustworthinessCharacteristics(aiSystemId: string) {
    const characteristics = [
      'Valid_and_Reliable',
      'Safe',
      'Secure_and_Resilient',
      'Accountable_and_Transparent',
      'Explainable_and_Interpretable',
      'Privacy_Enhanced',
      'Fair_with_Bias_Managed',
    ];

    for (const characteristic of characteristics) {
      await prisma.aIRMFTrustworthinessCharacteristic.create({
        data: {
          aiSystemId,
          characteristic,
          description: this.getCharacteristicDescription(characteristic),
        },
      });
    }
  }

  /**
   * Get characteristic description
   */
  private getCharacteristicDescription(characteristic: string): string {
    const descriptions: Record<string, string> = {
      Valid_and_Reliable: 'AI system produces accurate and consistent results',
      Safe: 'AI system operates safely and minimizes harm',
      Secure_and_Resilient: 'AI system is secure against attacks and resilient to failures',
      Accountable_and_Transparent: 'AI system is accountable and transparent in its operations',
      Explainable_and_Interpretable: 'AI system decisions can be explained and interpreted',
      Privacy_Enhanced: 'AI system protects privacy and handles data appropriately',
      Fair_with_Bias_Managed: 'AI system is fair and manages harmful bias',
    };
    return descriptions[characteristic] || '';
  }

  /**
   * Update trustworthiness characteristic
   */
  async updateTrustworthinessCharacteristic(organizationId: string, aiSystemId: string, characteristic: string, updates: any) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      const trustworthiness = await prisma.aIRMFTrustworthinessCharacteristic.findFirst({
        where: { aiSystemId, characteristic },
      });

      if (!trustworthiness) {
        throw new AppError('Trustworthiness characteristic not found', 404);
      }

      return await prisma.aIRMFTrustworthinessCharacteristic.update({
        where: { id: trustworthiness.id },
        data: updates,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating trustworthiness characteristic:', error);
      throw new AppError(`Failed to update trustworthiness characteristic: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Lifecycle Stages
  // ============================================================================

  /**
   * Initialize lifecycle stages
   */
  private async initializeLifecycleStages(aiSystemId: string) {
    const stages = [
      'Plan_and_Design',
      'Collect_and_Process',
      'Build_and_Validate',
      'Deploy_and_Operate',
      'Monitor_and_Maintain',
    ];

    for (const stage of stages) {
      await prisma.aIRMFLifecycleStage.create({
        data: {
          aiSystemId,
          stage,
        },
      });
    }
  }

  /**
   * Get lifecycle stage description
   */
  private getLifecycleStageDescription(stage: string): string {
    const descriptions: Record<string, string> = {
      Plan_and_Design: 'Planning and design phase of the AI system',
      Collect_and_Process: 'Data collection and processing phase',
      Build_and_Validate: 'Model building and validation phase',
      Deploy_and_Operate: 'Deployment and operational phase',
      Monitor_and_Maintain: 'Ongoing monitoring and maintenance phase',
    };
    return descriptions[stage] || '';
  }

  /**
   * Update lifecycle stage
   */
  async updateLifecycleStage(organizationId: string, aiSystemId: string, stage: string, updates: any) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      const lifecycleStage = await prisma.aIRMFLifecycleStage.findFirst({
        where: { aiSystemId, stage },
      });

      if (!lifecycleStage) {
        throw new AppError('Lifecycle stage not found', 404);
      }

      return await prisma.aIRMFLifecycleStage.update({
        where: { id: lifecycleStage.id },
        data: updates,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating lifecycle stage:', error);
      throw new AppError(`Failed to update lifecycle stage: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // AI Actors
  // ============================================================================

  /**
   * Add AI actor
   */
  async addActor(organizationId: string, aiSystemId: string, data: {
    actorType: string;
    userId?: string;
    name: string;
    role: string;
    responsibilities?: string[];
    involvementStages?: string[];
  }) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      // Validate userId if provided
      let userId = null;
      if (data.userId && data.userId.trim()) {
        const user = await prisma.user.findFirst({
          where: {
            id: data.userId,
            organizationId,
          },
        });
        if (!user) {
          throw new AppError('User not found', 404);
        }
        userId = data.userId;
      }

      return await prisma.aIRMFActor.create({
        data: {
          aiSystemId,
          actorType: data.actorType,
          userId,
          name: data.name,
          role: data.role,
          responsibilities: data.responsibilities || [],
          involvementStages: data.involvementStages || [],
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding actor:', error);
      throw new AppError(`Failed to add actor: ${error.message}`, 500);
    }
  }

  /**
   * Remove AI actor
   */
  async removeActor(organizationId: string, actorId: string) {
    try {
      const actor = await prisma.aIRMFActor.findFirst({
        where: { id: actorId },
        include: {
          aiSystem: true,
        },
      });

      if (!actor || actor.aiSystem.organizationId !== organizationId) {
        throw new AppError('Actor not found', 404);
      }

      await prisma.aIRMFActor.delete({
        where: { id: actorId },
      });

      return { success: true };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error removing actor:', error);
      throw new AppError(`Failed to remove actor: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Assessments
  // ============================================================================

  /**
   * Create assessment
   */
  async createAssessment(organizationId: string, aiSystemId: string, data: {
    assessmentType: string;
    assessedBy: string;
    overallScore?: number;
    functionScores?: any;
    characteristicScores?: any;
    findings?: any;
    recommendations?: string[];
  }) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
        include: {
          coreFunctions: true,
        },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      // Auto-populate function scores from core functions if not provided
      let functionScores = data.functionScores;
      if (!functionScores && aiSystem.coreFunctions) {
        functionScores = {};
        for (const func of aiSystem.coreFunctions) {
          functionScores[func.functionName] = func.completionPercent || 0;
        }
      }

      // Calculate overall score from function scores if not provided
      let overallScore = data.overallScore;
      if (overallScore === undefined && functionScores) {
        const scores = Object.values(functionScores) as number[];
        if (scores.length > 0) {
          overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        }
      }

      return await prisma.aIRMFAssessment.create({
        data: {
          aiSystemId,
          assessmentType: data.assessmentType,
          assessedBy: data.assessedBy,
          overallScore: overallScore,
          functionScores: functionScores,
          characteristicScores: data.characteristicScores,
          findings: data.findings,
          recommendations: data.recommendations || [],
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating assessment:', error);
      throw new AppError(`Failed to create assessment: ${error.message}`, 500);
    }
  }

  /**
   * Get assessments for an AI system
   */
  async getAssessments(organizationId: string, aiSystemId: string) {
    try {
      const assessments = await prisma.aIRMFAssessment.findMany({
        where: {
          aiSystemId,
          aiSystem: {
            organizationId,
          },
        },
        orderBy: {
          assessmentDate: 'desc',
        },
      });

      // Get user information for assessedBy
      const userIds = Array.from(new Set(assessments.map(a => a.assessedBy).filter(Boolean)));
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      // Get current AI system core function completion percentages for dynamic scores
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
        include: {
          coreFunctions: true,
        },
      });

      // Calculate current function scores from core functions
      let currentFunctionScores: any = {};
      if (aiSystem && aiSystem.coreFunctions) {
        for (const func of aiSystem.coreFunctions) {
          currentFunctionScores[func.functionName] = func.completionPercent || 0;
        }
      }

      // Calculate current overall score
      const currentScoreValues = Object.values(currentFunctionScores) as number[];
      const currentOverallScore = currentScoreValues.length > 0
        ? Math.round(currentScoreValues.reduce((sum, score) => sum + score, 0) / currentScoreValues.length)
        : 0;

      return assessments.map(assessment => ({
        ...assessment,
        assessedByUser: userMap.get(assessment.assessedBy) || null,
        // Add current system scores for dynamic display
        currentFunctionScores,
        currentOverallScore,
      }));
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting assessments:', error);
      throw new AppError(`Failed to get assessments: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Profiles
  // ============================================================================

  /**
   * Create profile
   */
  async createProfile(organizationId: string, aiSystemId: string, data: {
    profileName: string;
    profileType: string;
    description?: string;
    selectedFunctions: any;
    priorities?: any;
    customizations?: any;
  }) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      return await prisma.aIRMFProfile.create({
        data: {
          aiSystemId,
          profileName: data.profileName,
          profileType: data.profileType,
          description: data.description,
          selectedFunctions: data.selectedFunctions,
          priorities: data.priorities,
          customizations: data.customizations,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating profile:', error);
      throw new AppError(`Failed to create profile: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Risk Activities
  // ============================================================================

  /**
   * Create risk activity
   */
  async createRiskActivity(organizationId: string, aiSystemId: string, data: {
    activityType: string;
    relatedFunction?: string;
    relatedCategory?: string;
    relatedSubcategory?: string;
    description: string;
    riskLevel: string;
    mitigationPlan?: string;
    ownerId?: string;
    targetDate?: Date;
    evidence?: any;
  }) {
    try {
      const aiSystem = await prisma.aISystem.findFirst({
        where: { id: aiSystemId, organizationId },
      });

      if (!aiSystem) {
        throw new AppError('AI system not found', 404);
      }

      // Validate ownerId if provided
      let ownerId = null;
      if (data.ownerId && data.ownerId.trim()) {
        const owner = await prisma.user.findFirst({
          where: {
            id: data.ownerId,
            organizationId,
          },
        });
        if (!owner) {
          throw new AppError('Owner user not found', 404);
        }
        ownerId = data.ownerId;
      }

      return await prisma.aIRMFRiskActivity.create({
        data: {
          aiSystemId,
          activityType: data.activityType,
          relatedFunction: data.relatedFunction || null,
          relatedCategory: data.relatedCategory || null,
          relatedSubcategory: data.relatedSubcategory || null,
          description: data.description,
          riskLevel: data.riskLevel,
          mitigationPlan: data.mitigationPlan || null,
          ownerId,
          targetDate: data.targetDate || null,
          evidence: data.evidence || null,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating risk activity:', error);
      throw new AppError(`Failed to create risk activity: ${error.message}`, 500);
    }
  }

  /**
   * Update risk activity
   */
  async updateRiskActivity(organizationId: string, riskActivityId: string, updates: any) {
    try {
      const riskActivity = await prisma.aIRMFRiskActivity.findFirst({
        where: { id: riskActivityId },
        include: {
          aiSystem: true,
        },
      });

      if (!riskActivity || riskActivity.aiSystem.organizationId !== organizationId) {
        throw new AppError('Risk activity not found', 404);
      }

      return await prisma.aIRMFRiskActivity.update({
        where: { id: riskActivityId },
        data: updates,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating risk activity:', error);
      throw new AppError(`Failed to update risk activity: ${error.message}`, 500);
    }
  }

  // ============================================================================
  // Analytics and Reporting
  // ============================================================================

  /**
   * Calculate overall trustworthiness score
   */
  async calculateTrustworthinessScore(organizationId: string, aiSystemId: string): Promise<number> {
    try {
      const characteristics = await prisma.aIRMFTrustworthinessCharacteristic.findMany({
        where: { aiSystemId },
      });

      if (characteristics.length === 0) return 0;

      const scores = characteristics
        .map(c => c.score)
        .filter((score): score is number => score !== null);

      if (scores.length === 0) return 0;

      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Update AI system with calculated score
      await prisma.aISystem.update({
        where: { id: aiSystemId },
        data: { overallTrustworthinessScore: Math.round(average) },
      });

      return Math.round(average);
    } catch (error: any) {
      logger.error('Error calculating trustworthiness score:', error);
      throw new AppError(`Failed to calculate trustworthiness score: ${error.message}`, 500);
    }
  }

  /**
   * Get AI RMF dashboard data
   */
  async getDashboardData(organizationId: string) {
    try {
      const aiSystems = await this.getAISystems(organizationId);

      const stats = {
        totalSystems: aiSystems.length,
        byStatus: {} as Record<string, number>,
        byLifecycleStage: {} as Record<string, number>,
        byRiskLevel: {} as Record<string, number>,
        averageTrustworthinessScore: 0,
      };

      let totalScore = 0;
      let systemsWithScore = 0;

      for (const system of aiSystems) {
        // Count by status
        stats.byStatus[system.status] = (stats.byStatus[system.status] || 0) + 1;

        // Count by lifecycle stage
        stats.byLifecycleStage[system.lifecycleStage] = (stats.byLifecycleStage[system.lifecycleStage] || 0) + 1;

        // Count by risk level
        if (system.riskLevel) {
          stats.byRiskLevel[system.riskLevel] = (stats.byRiskLevel[system.riskLevel] || 0) + 1;
        }

        // Calculate average trustworthiness score
        if (system.overallTrustworthinessScore !== null) {
          totalScore += system.overallTrustworthinessScore;
          systemsWithScore++;
        }
      }

      if (systemsWithScore > 0) {
        stats.averageTrustworthinessScore = Math.round(totalScore / systemsWithScore);
      }

      return stats;
    } catch (error: any) {
      logger.error('Error fetching dashboard data:', error);
      throw new AppError(`Failed to fetch dashboard data: ${error.message}`, 500);
    }
  }
}

export default new AIRMFService();

