import { Router } from 'express';
import risksController from '../controllers/risksController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /v1/risks:
 *   get:
 *     summary: List all risks
 *     description: Retrieve a paginated list of risks for the organization
 *     tags: [Risks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number (0-indexed)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [Critical, High, Medium, Low]
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, Mitigated, Accepted, Closed]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, severity, title, status]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: List of risks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RiskItem'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', asyncHandler(risksController.list.bind(risksController)));

/**
 * @swagger
 * /v1/risks/{id}:
 *   get:
 *     summary: Get risk by ID
 *     description: Retrieve a specific risk by its unique identifier
 *     tags: [Risks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk unique identifier
 *     responses:
 *       200:
 *         description: Risk details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RiskItem'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', asyncHandler(risksController.getById.bind(risksController)));

/**
 * @swagger
 * /v1/risks:
 *   post:
 *     summary: Create a new risk
 *     description: Create a new risk record for the organization
 *     tags: [Risks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRiskInput'
 *     responses:
 *       201:
 *         description: Risk created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RiskItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authorize('admin', 'editor'), asyncHandler(risksController.create.bind(risksController)));

/**
 * @swagger
 * /v1/risks/{id}:
 *   patch:
 *     summary: Update a risk
 *     description: Update an existing risk record
 *     tags: [Risks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *               status:
 *                 type: string
 *                 enum: [Open, Mitigated, Accepted, Closed]
 *               likelihood:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               impact:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               mitigationPlan:
 *                 type: string
 *               assignedToId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Risk updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RiskItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/:id', authorize('admin', 'editor'), asyncHandler(risksController.update.bind(risksController)));

/**
 * @swagger
 * /v1/risks/{id}:
 *   delete:
 *     summary: Delete a risk
 *     description: Delete a risk record (Admin only)
 *     tags: [Risks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk unique identifier
 *     responses:
 *       204:
 *         description: Risk deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/:id', authorize('admin'), asyncHandler(risksController.delete.bind(risksController)));

/**
 * @swagger
 * /v1/risks/prioritize:
 *   post:
 *     summary: Prioritize risks
 *     description: AI-powered risk prioritization based on severity, likelihood, and impact
 *     tags: [Risks, AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               riskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional list of specific risk IDs to prioritize
 *               criteria:
 *                 type: object
 *                 properties:
 *                   weightSeverity:
 *                     type: number
 *                     default: 0.4
 *                   weightLikelihood:
 *                     type: number
 *                     default: 0.3
 *                   weightImpact:
 *                     type: number
 *                     default: 0.3
 *     responses:
 *       200:
 *         description: Prioritized risk list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     prioritizedRisks:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/RiskItem'
 *                           - type: object
 *                             properties:
 *                               priorityScore:
 *                                 type: number
 *                               priorityRank:
 *                                 type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/prioritize', authorize('admin', 'editor'), asyncHandler(risksController.prioritize.bind(risksController)));

/**
 * @swagger
 * /v1/risks/{id}/remediation:
 *   post:
 *     summary: Generate remediation plan
 *     description: Use AI to generate a remediation plan for a specific risk
 *     tags: [Risks, AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk unique identifier
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               context:
 *                 type: string
 *                 description: Additional context for remediation planning
 *               budget:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Budget constraint for remediation
 *               timeline:
 *                 type: string
 *                 enum: [immediate, short-term, long-term]
 *                 description: Desired timeline for remediation
 *     responses:
 *       200:
 *         description: Generated remediation plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     risk:
 *                       $ref: '#/components/schemas/RiskItem'
 *                     remediationPlan:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           type: string
 *                         steps:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               order:
 *                                 type: integer
 *                               action:
 *                                 type: string
 *                               responsible:
 *                                 type: string
 *                               deadline:
 *                                 type: string
 *                         estimatedCost:
 *                           type: string
 *                         estimatedTime:
 *                           type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/:id/remediation', authorize('admin', 'editor'), asyncHandler(risksController.generateRemediation.bind(risksController)));

/**
 * @swagger
 * /v1/risks/scan:
 *   post:
 *     summary: Scan for risks
 *     description: Automatically scan the organization for potential risks using AI
 *     tags: [Risks, AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [infrastructure, code, policies, vendors, personnel]
 *                 description: Data sources to scan
 *               frameworks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Compliance frameworks to consider
 *     responses:
 *       200:
 *         description: Scan results with identified risks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     scanId:
 *                       type: string
 *                       format: uuid
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     identifiedRisks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RiskItem'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalIdentified:
 *                           type: integer
 *                         bySeverity:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/scan', authorize('admin', 'editor'), asyncHandler(risksController.scan.bind(risksController)));

export default router;
