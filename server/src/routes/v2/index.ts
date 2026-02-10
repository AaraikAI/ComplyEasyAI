/**
 * API V2 Router
 *
 * Inherits all v1 routes and adds v2-specific enhancements:
 * - Standardized response envelope
 * - Batch operations
 * - Enhanced error format with error codes
 * - Pagination in response body
 */

import { Router } from 'express';
import { v2ResponseEnvelope } from '../../middleware/apiVersioning';
import v1Router from '../v1';
import batchRoutes from './batchRoutes';
import { apiLimiter } from '../../middleware/rateLimiter';

const v2Router = Router();

// Apply v2 response envelope to all v2 routes
v2Router.use(v2ResponseEnvelope());

// Inherit all v1 routes (they work identically under v2, with the envelope applied)
v2Router.use('/', v1Router);

// V2-only: Batch operations
v2Router.use('/batch', apiLimiter, batchRoutes);

export default v2Router;
