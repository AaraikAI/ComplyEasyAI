/**
 * Global Search Routes
 *
 * Full-text search across all indexed resources using PostgreSQL
 * ts_vector / ts_rank for relevance ordering. Supports filtering
 * by resource type, framework, status, and result limiting.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

function paginate(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

// ============================================================================
// FULL-TEXT SEARCH
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      const q = (req.query.q as string || '').trim();
      const type = req.query.type as string | undefined;
      const framework = req.query.framework as string | undefined;
      const status = req.query.status as string | undefined;
      const limitParam = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

      if (!q) {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }

      // Convert the search query to a tsquery-compatible format
      // Replace spaces with & for AND semantics, handle special characters
      const tsQueryTerms = q
        .replace(/[^\w\s]/g, '') // Remove special characters
        .split(/\s+/)
        .filter(Boolean)
        .map((term) => `${term}:*`) // Prefix matching
        .join(' & ');

      if (!tsQueryTerms) {
        res.json({ status: 'success', data: { results: [], total: 0, query: q } });
        return;
      }

      // Build metadata filter conditions for the raw query
      const conditions: string[] = [
        `"organizationId" = $1`,
      ];
      const params: any[] = [orgId];
      let paramIndex = 2;

      if (type) {
        conditions.push(`"resourceType" = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      // Framework and status are stored in the metadata JSON column
      if (framework) {
        conditions.push(`"metadata"->>'framework' = $${paramIndex}`);
        params.push(framework);
        paramIndex++;
      }

      if (status) {
        conditions.push(`"metadata"->>'status' = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Use PostgreSQL full-text search with ts_rank for ordering
      // to_tsvector combines title (weight A) and content (weight B) for ranking
      const searchQuery = `
        SELECT
          id,
          "organizationId",
          "resourceType",
          "resourceId",
          title,
          LEFT(content, 300) as excerpt,
          metadata,
          "updatedAt",
          ts_rank(
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(content, '')), 'B'),
            to_tsquery('english', $${paramIndex})
          ) as rank
        FROM "SearchIndex"
        WHERE ${whereClause}
          AND (
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(content, '')), 'B')
          ) @@ to_tsquery('english', $${paramIndex})
        ORDER BY rank DESC
        LIMIT $${paramIndex + 1}
      `;

      params.push(tsQueryTerms, limitParam);

      const results: any[] = await prisma.$queryRawUnsafe(searchQuery, ...params);

      // Get total count for the same query (without LIMIT)
      const countQuery = `
        SELECT COUNT(*)::int as total
        FROM "SearchIndex"
        WHERE ${whereClause}
          AND (
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(content, '')), 'B')
          ) @@ to_tsquery('english', $${paramIndex - conditions.length + 1 + conditions.length - 1})
      `;

      // Simpler count query using same params minus the limit
      const countParams = [...params.slice(0, -1)]; // Remove the limit param
      let total = results.length;
      try {
        const countResult: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as total
           FROM "SearchIndex"
           WHERE ${whereClause}
             AND (
               setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
               setweight(to_tsvector('english', COALESCE(content, '')), 'B')
             ) @@ to_tsquery('english', $${paramIndex})`,
          ...countParams
        );
        total = countResult[0]?.total ?? results.length;
      } catch {
        // If count query fails, use results length
      }

      // Highlight matching terms in excerpts
      const highlightedResults = results.map((r) => ({
        id: r.id,
        resourceType: r.resourceType || r.resourcetype,
        resourceId: r.resourceId || r.resourceid,
        title: r.title,
        excerpt: r.excerpt,
        metadata: r.metadata,
        updatedAt: r.updatedAt || r.updatedat,
        relevanceScore: parseFloat(r.rank) || 0,
      }));

      res.json({
        status: 'success',
        data: {
          results: highlightedResults,
          total,
          query: q,
          filters: { type, framework, status },
        },
      });
    } catch (error) {
      logger.error('Search error:', error);

      // Fallback to ILIKE search if full-text search fails (e.g., missing tsvector index)
      try {
        const q = (req.query.q as string || '').trim();
        const type = req.query.type as string | undefined;
        const limitParam = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

        const where: any = {
          organizationId: orgId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        };

        if (type) where.resourceType = type;

        const results = await prisma.searchIndex.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: limitParam,
        });

        res.json({
          status: 'success',
          data: {
            results: results.map((r) => ({
              id: r.id,
              resourceType: r.resourceType,
              resourceId: r.resourceId,
              title: r.title,
              excerpt: r.content.substring(0, 300),
              metadata: r.metadata,
              updatedAt: r.updatedAt,
              relevanceScore: 0,
            })),
            total: results.length,
            query: q,
            filters: { type },
            fallback: true,
          },
        });
      } catch (fallbackError) {
        logger.error('Search fallback error:', fallbackError);
        res.status(500).json({ error: 'Failed to perform search' });
      }
    }
  })
);

// ============================================================================
// MANUALLY TRIGGER RE-INDEXING (Admin only)
// ============================================================================

router.post(
  '/index',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      const startTime = Date.now();
      let indexed = 0;

      // Index Risks
      try {
        const risks = await prisma.risk.findMany({
          where: { organizationId: orgId },
          select: { id: true, title: true, description: true, category: true, status: true, framework: true },
        });

        for (const risk of risks) {
          await prisma.searchIndex.upsert({
            where: {
              id: `risk-${risk.id}`,
            },
            update: {
              title: risk.title,
              content: `${risk.title} ${risk.description || ''} ${risk.category || ''}`,
              metadata: { status: risk.status, category: risk.category, framework: risk.framework },
            },
            create: {
              id: `risk-${risk.id}`,
              organizationId: orgId,
              resourceType: 'risk',
              resourceId: risk.id,
              title: risk.title,
              content: `${risk.title} ${risk.description || ''} ${risk.category || ''}`,
              metadata: { status: risk.status, category: risk.category, framework: risk.framework },
            },
          });
          indexed++;
        }
      } catch (e) {
        logger.warn('Error indexing risks:', e);
      }

      // Index Controls
      try {
        const controls = await prisma.control.findMany({
          where: { organizationId: orgId },
          select: { id: true, title: true, description: true, status: true, framework: true },
        });

        for (const control of controls) {
          await prisma.searchIndex.upsert({
            where: {
              id: `control-${control.id}`,
            },
            update: {
              title: control.title,
              content: `${control.title} ${control.description || ''}`,
              metadata: { status: control.status, framework: control.framework },
            },
            create: {
              id: `control-${control.id}`,
              organizationId: orgId,
              resourceType: 'control',
              resourceId: control.id,
              title: control.title,
              content: `${control.title} ${control.description || ''}`,
              metadata: { status: control.status, framework: control.framework },
            },
          });
          indexed++;
        }
      } catch (e) {
        logger.warn('Error indexing controls:', e);
      }

      // Index Evidence
      try {
        const evidence = await prisma.evidence.findMany({
          where: { organizationId: orgId },
          select: { id: true, title: true, description: true, status: true, framework: true },
        });

        for (const ev of evidence) {
          await prisma.searchIndex.upsert({
            where: {
              id: `evidence-${ev.id}`,
            },
            update: {
              title: ev.title,
              content: `${ev.title} ${ev.description || ''}`,
              metadata: { status: ev.status, framework: ev.framework },
            },
            create: {
              id: `evidence-${ev.id}`,
              organizationId: orgId,
              resourceType: 'evidence',
              resourceId: ev.id,
              title: ev.title,
              content: `${ev.title} ${ev.description || ''}`,
              metadata: { status: ev.status, framework: ev.framework },
            },
          });
          indexed++;
        }
      } catch (e) {
        logger.warn('Error indexing evidence:', e);
      }

      // Index Vendors
      try {
        const vendors = await prisma.vendor.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true, description: true, riskLevel: true, status: true },
        });

        for (const vendor of vendors) {
          await prisma.searchIndex.upsert({
            where: {
              id: `vendor-${vendor.id}`,
            },
            update: {
              title: vendor.name,
              content: `${vendor.name} ${vendor.description || ''}`,
              metadata: { status: vendor.status, riskLevel: vendor.riskLevel },
            },
            create: {
              id: `vendor-${vendor.id}`,
              organizationId: orgId,
              resourceType: 'vendor',
              resourceId: vendor.id,
              title: vendor.name,
              content: `${vendor.name} ${vendor.description || ''}`,
              metadata: { status: vendor.status, riskLevel: vendor.riskLevel },
            },
          });
          indexed++;
        }
      } catch (e) {
        logger.warn('Error indexing vendors:', e);
      }

      // Index Policies
      try {
        const policies = await prisma.policy.findMany({
          where: { organizationId: orgId },
          select: { id: true, title: true, content: true, status: true, framework: true },
        });

        for (const policy of policies) {
          await prisma.searchIndex.upsert({
            where: {
              id: `policy-${policy.id}`,
            },
            update: {
              title: policy.title,
              content: `${policy.title} ${(policy.content || '').substring(0, 5000)}`,
              metadata: { status: policy.status, framework: policy.framework },
            },
            create: {
              id: `policy-${policy.id}`,
              organizationId: orgId,
              resourceType: 'policy',
              resourceId: policy.id,
              title: policy.title,
              content: `${policy.title} ${(policy.content || '').substring(0, 5000)}`,
              metadata: { status: policy.status, framework: policy.framework },
            },
          });
          indexed++;
        }
      } catch (e) {
        logger.warn('Error indexing policies:', e);
      }

      const elapsed = Date.now() - startTime;

      res.json({
        status: 'success',
        data: {
          message: 'Re-indexing completed',
          indexedCount: indexed,
          elapsedMs: elapsed,
        },
      });
    } catch (error) {
      logger.error('Error during re-indexing:', error);
      res.status(500).json({ error: 'Failed to re-index resources' });
    }
  })
);

// ============================================================================
// GET RECENT SEARCHES FOR USER
// ============================================================================

router.get(
  '/recent',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const limitParam = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    try {
      // Store recent searches in a SearchIndex entry with resourceType = 'recent_search'
      const recentSearches = await prisma.searchIndex.findMany({
        where: {
          organizationId: user.organizationId,
          resourceType: 'recent_search',
          resourceId: user.id,
        },
        orderBy: { updatedAt: 'desc' },
        take: limitParam,
        select: {
          id: true,
          title: true,
          metadata: true,
          updatedAt: true,
        },
      });

      res.json({
        status: 'success',
        data: {
          searches: recentSearches.map((s) => ({
            id: s.id,
            query: s.title,
            metadata: s.metadata,
            searchedAt: s.updatedAt,
          })),
        },
      });
    } catch (error) {
      logger.error('Error fetching recent searches:', error);
      res.status(500).json({ error: 'Failed to fetch recent searches' });
    }
  })
);

// ============================================================================
// SAVE A SEARCH QUERY
// ============================================================================

router.post(
  '/recent',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { query, filters } = req.body;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'query string is required' });
        return;
      }

      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        res.status(400).json({ error: 'query cannot be empty' });
        return;
      }

      // Create a deterministic ID so duplicate queries update instead of creating new entries
      const searchId = `recent-${user.id}-${Buffer.from(trimmedQuery.toLowerCase()).toString('base64').substring(0, 40)}`;

      await prisma.searchIndex.upsert({
        where: { id: searchId },
        update: {
          title: trimmedQuery,
          content: trimmedQuery,
          metadata: {
            filters: filters || {},
            lastSearchedAt: new Date().toISOString(),
          },
        },
        create: {
          id: searchId,
          organizationId: user.organizationId,
          resourceType: 'recent_search',
          resourceId: user.id,
          title: trimmedQuery,
          content: trimmedQuery,
          metadata: {
            filters: filters || {},
            lastSearchedAt: new Date().toISOString(),
          },
        },
      });

      // Keep only the most recent 50 searches per user
      const allRecent = await prisma.searchIndex.findMany({
        where: {
          organizationId: user.organizationId,
          resourceType: 'recent_search',
          resourceId: user.id,
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });

      if (allRecent.length > 50) {
        const toDelete = allRecent.slice(50).map((s) => s.id);
        await prisma.searchIndex.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      res.json({
        status: 'success',
        data: { message: 'Search query saved', query: trimmedQuery },
      });
    } catch (error) {
      logger.error('Error saving recent search:', error);
      res.status(500).json({ error: 'Failed to save search query' });
    }
  })
);

export default router;
