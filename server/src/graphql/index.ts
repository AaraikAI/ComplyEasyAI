/**
 * GraphQL Server Setup
 *
 * Configures and exports the GraphQL middleware for Express.
 * Uses graphql-js for proper schema-based query execution with:
 * - Full GraphQL spec compliance (parsing, validation, execution)
 * - Query depth limiting to prevent recursive abuse
 * - Query complexity analysis to prevent resource exhaustion
 * Authentication is extracted from the JWT token in the Authorization header.
 */

import { Request, Response } from 'express';
import {
  buildSchema,
  graphql,
  validate,
  parse,
  DocumentNode,
  GraphQLError,
  TypeInfo,
  visitWithTypeInfo,
  visit,
  getNamedType,
  isCompositeType,
  GraphQLObjectType,
  GraphQLList,
} from 'graphql';
import depthLimit from 'graphql-depth-limit';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';
import { typeDefs } from './schemas/typeDefs';
import { resolvers } from './resolvers';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_QUERY_DEPTH = 10;
const MAX_QUERY_COMPLEXITY = 1000;
const MAX_QUERY_LENGTH = 10000;

// ============================================================================
// SCHEMA BUILD
// ============================================================================

const schema = buildSchema(typeDefs);

// ============================================================================
// ROOT VALUE (maps schema fields to resolver functions)
// ============================================================================

function buildRootValue(context: GraphQLContext) {
  const wrapResolver = (fn: Function) => {
    return (args: any) => fn(null, args, context);
  };

  const wrapFieldResolver = (typeName: string) => {
    const typeResolvers = (resolvers as any)[typeName];
    if (!typeResolvers) return {};
    const wrapped: Record<string, Function> = {};
    for (const [field, fn] of Object.entries(typeResolvers)) {
      wrapped[field] = (parent: any) => (fn as Function)(parent);
    }
    return wrapped;
  };

  return {
    // Query resolvers
    vendors: wrapResolver(resolvers.Query.vendors),
    vendor: wrapResolver(resolvers.Query.vendor),
    vendorDashboard: wrapResolver(resolvers.Query.vendorDashboard),
    frameworks: wrapResolver(resolvers.Query.frameworks),
    framework: wrapResolver(resolvers.Query.framework),
    frameworkTemplates: wrapResolver(resolvers.Query.frameworkTemplates),
    risks: wrapResolver(resolvers.Query.risks),
    risk: wrapResolver(resolvers.Query.risk),
    policies: wrapResolver(resolvers.Query.policies),
    policy: wrapResolver(resolvers.Query.policy),
    issues: wrapResolver(resolvers.Query.issues),
    issue: wrapResolver(resolvers.Query.issue),
    monitors: wrapResolver(resolvers.Query.monitors),
    monitor: wrapResolver(resolvers.Query.monitor),
    auditLogs: wrapResolver(resolvers.Query.auditLogs),
    me: wrapResolver(resolvers.Query.me),
    organizationUsers: wrapResolver(resolvers.Query.organizationUsers),
    dashboardStats: wrapResolver(resolvers.Query.dashboardStats),

    // Mutation resolvers
    createVendor: wrapResolver(resolvers.Mutation.createVendor),
    updateVendor: wrapResolver(resolvers.Mutation.updateVendor),
    deleteVendor: wrapResolver(resolvers.Mutation.deleteVendor),
    createRisk: wrapResolver(resolvers.Mutation.createRisk),
    updateRisk: wrapResolver(resolvers.Mutation.updateRisk),
    deleteRisk: wrapResolver(resolvers.Mutation.deleteRisk),
    createPolicy: wrapResolver(resolvers.Mutation.createPolicy),
    deletePolicy: wrapResolver(resolvers.Mutation.deletePolicy),
    createIssue: wrapResolver(resolvers.Mutation.createIssue),
    addIssueComment: wrapResolver(resolvers.Mutation.addIssueComment),
    createFramework: wrapResolver(resolvers.Mutation.createFramework),
    applyTemplate: wrapResolver(resolvers.Mutation.applyTemplate),
    deleteFramework: wrapResolver(resolvers.Mutation.deleteFramework),
    createMonitor: wrapResolver(resolvers.Mutation.createMonitor),
    toggleMonitor: wrapResolver(resolvers.Mutation.toggleMonitor),
    runMonitor: wrapResolver(resolvers.Mutation.runMonitor),
  };
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

interface GraphQLContext {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  } | null;
}

async function buildContext(req: Request): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as {
      userId: string;
      email: string;
      role: string;
      organizationId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    if (!user) return { user: null };

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  } catch (error) {
    return { user: null };
  }
}

// ============================================================================
// COMPLEXITY ANALYSIS
// ============================================================================

/**
 * Calculate query complexity based on field selections and list types.
 * Each field costs 1 point. List fields cost 10 points (multiplied by nesting).
 * This prevents expensive queries that request deeply nested list data.
 */
function calculateComplexity(document: DocumentNode): number {
  let complexity = 0;
  const typeInfo = new TypeInfo(schema);

  visit(
    document,
    visitWithTypeInfo(typeInfo, {
      Field: {
        enter() {
          const parentType = typeInfo.getParentType();
          const fieldDef = typeInfo.getFieldDef();
          if (!fieldDef) {
            complexity += 1;
            return;
          }

          const returnType = getNamedType(fieldDef.type);

          // List fields are more expensive
          if (fieldDef.type instanceof GraphQLList ||
              (fieldDef.type as any)?.ofType instanceof GraphQLList) {
            complexity += 10;
          } else if (returnType && isCompositeType(returnType)) {
            complexity += 2;
          } else {
            complexity += 1;
          }

          // Connection/paginated types are more expensive
          if (parentType && parentType instanceof GraphQLObjectType) {
            const typeName = parentType.name;
            if (typeName.endsWith('Connection')) {
              complexity += 5;
            }
          }
        },
      },
    })
  );

  return complexity;
}

// ============================================================================
// GRAPHQL REQUEST HANDLER
// ============================================================================

/**
 * Express middleware that handles GraphQL requests.
 * Uses graphql-js for proper schema-based execution with
 * query depth limiting and complexity analysis.
 */
export function graphqlMiddleware() {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract query, variables, and operation name from request
      let query: string | undefined;
      let variables: Record<string, any> | undefined;
      let operationName: string | undefined;

      if (req.method === 'POST') {
        query = req.body?.query;
        variables = req.body?.variables;
        operationName = req.body?.operationName;
      } else if (req.method === 'GET') {
        query = req.query.query as string;
        variables = req.query.variables ? JSON.parse(req.query.variables as string) : undefined;
        operationName = req.query.operationName as string;
      }

      if (!query) {
        res.status(400).json({
          errors: [{ message: 'GraphQL query is required' }],
        });
        return;
      }

      // Enforce query size limit
      if (query.length > MAX_QUERY_LENGTH) {
        res.status(400).json({
          errors: [{ message: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` }],
        });
        return;
      }

      // Parse the query
      let document: DocumentNode;
      try {
        document = parse(query);
      } catch (parseError: any) {
        res.status(400).json({
          errors: [{ message: `GraphQL syntax error: ${parseError.message}` }],
        });
        return;
      }

      // Validate against schema with depth limiting
      const validationErrors = validate(schema, document, [
        depthLimit(MAX_QUERY_DEPTH),
      ]);

      if (validationErrors.length > 0) {
        res.status(400).json({
          errors: validationErrors.map((e: GraphQLError) => ({
            message: e.message,
            locations: e.locations,
          })),
        });
        return;
      }

      // Complexity analysis
      const complexity = calculateComplexity(document);
      if (complexity > MAX_QUERY_COMPLEXITY) {
        res.status(400).json({
          errors: [{
            message: `Query complexity ${complexity} exceeds maximum allowed complexity of ${MAX_QUERY_COMPLEXITY}`,
            extensions: { code: 'COMPLEXITY_LIMIT_EXCEEDED', complexity, maxComplexity: MAX_QUERY_COMPLEXITY },
          }],
        });
        return;
      }

      // Build context with authenticated user
      const context = await buildContext(req);

      // Execute the query using graphql-js
      const result = await graphql({
        schema,
        source: query,
        rootValue: buildRootValue(context),
        variableValues: variables,
        operationName,
      });

      // Add complexity header for monitoring
      res.setHeader('X-GraphQL-Complexity', complexity.toString());
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('[GraphQL] Request error:', error);
      res.status(500).json({
        errors: [{ message: error.message || 'Internal server error' }],
      });
    }
  };
}

// ============================================================================
// GRAPHQL PLAYGROUND / IDE
// ============================================================================

/**
 * Serves a simple GraphQL Playground HTML page for development.
 */
export function graphqlPlayground() {
  return (_req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>ComplyEasyAI GraphQL Playground</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #app { height: 100%; display: flex; flex-direction: column; }
    header { background: #1a1a2e; color: white; padding: 12px 20px; display: flex; align-items: center; gap: 12px; }
    header h1 { margin: 0; font-size: 18px; font-weight: 600; }
    header .badge { background: #0f3460; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .editor { flex: 1; display: flex; gap: 1px; background: #e0e0e0; }
    .panel { flex: 1; display: flex; flex-direction: column; background: white; }
    .panel-header { padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; }
    textarea { flex: 1; border: none; padding: 16px; font-family: 'Fira Code', 'Consolas', monospace; font-size: 13px; resize: none; outline: none; }
    pre { flex: 1; margin: 0; padding: 16px; overflow: auto; font-size: 13px; background: #fafafa; }
    .toolbar { padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #e0e0e0; display: flex; gap: 8px; align-items: center; }
    button { background: #e94560; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
    button:hover { background: #c81e45; }
    input { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; flex: 1; }
  </style>
</head>
<body>
  <div id="app">
    <header>
      <h1>ComplyEasyAI</h1>
      <span class="badge">GraphQL</span>
    </header>
    <div class="toolbar">
      <input id="authToken" type="text" placeholder="Bearer token (paste JWT here)" />
      <button onclick="executeQuery()">Execute Query</button>
    </div>
    <div class="editor">
      <div class="panel">
        <div class="panel-header">Query</div>
        <textarea id="queryInput" spellcheck="false">query {
  dashboardStats
  vendors(pagination: { page: 0, pageSize: 5 }) {
    data { id name riskLevel status }
    pagination { totalItems totalPages }
  }
}</textarea>
      </div>
      <div class="panel">
        <div class="panel-header">Response</div>
        <pre id="response">Click "Execute Query" to run</pre>
      </div>
    </div>
  </div>
  <script>
    async function executeQuery() {
      const query = document.getElementById('queryInput').value;
      const token = document.getElementById('authToken').value;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = token.startsWith('Bearer') ? token : 'Bearer ' + token;
      try {
        const res = await fetch('/api/graphql', { method: 'POST', headers, body: JSON.stringify({ query }) });
        const json = await res.json();
        document.getElementById('response').textContent = JSON.stringify(json, null, 2);
      } catch(e) {
        document.getElementById('response').textContent = 'Error: ' + e.message;
      }
    }
  </script>
</body>
</html>`);
  };
}

export default { graphqlMiddleware, graphqlPlayground };
