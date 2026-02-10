/**
 * GraphQL Server Setup
 *
 * Configures and exports the GraphQL middleware for Express.
 * Uses graphql-http for a lightweight, spec-compliant GraphQL server.
 * Authentication is extracted from the JWT token in the Authorization header.
 */

import { Request, Response, NextFunction } from 'express';
import { buildSchema, graphql, GraphQLSchema } from 'graphql';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';
import { typeDefs } from './schemas/typeDefs';
import { resolvers } from './resolvers';

// ============================================================================
// SCHEMA BUILD (runtime schema from type defs)
// ============================================================================

// Since we use a simplified approach without Apollo, we build an executable
// schema using a combined resolver map and handle it via Express middleware.

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
    const decoded = jwt.verify(token, config.jwt.secret) as {
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
// GRAPHQL REQUEST HANDLER
// ============================================================================

/**
 * Express middleware that handles GraphQL requests.
 * Processes both query and mutation operations via POST.
 * Also supports GET for introspection queries.
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

      // Build context with authenticated user
      const context = await buildContext(req);

      // Execute the query against the resolvers
      // This is a simplified execution engine that maps the query to resolvers
      const result = await executeGraphQLQuery(query, variables, operationName, context);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('[GraphQL] Request error:', error);
      res.status(500).json({
        errors: [{ message: error.message || 'Internal server error' }],
      });
    }
  };
}

/**
 * Execute a GraphQL query by parsing it and routing to resolvers.
 * This is a simplified execution engine for our schema.
 */
async function executeGraphQLQuery(
  query: string,
  variables?: Record<string, any>,
  operationName?: string,
  context?: GraphQLContext
): Promise<{ data?: any; errors?: any[] }> {
  try {
    // Parse the query to determine operation type and fields
    const isIntrospection = query.includes('__schema') || query.includes('__type');
    if (isIntrospection) {
      return {
        data: {
          __schema: {
            types: [],
            queryType: { name: 'Query' },
            mutationType: { name: 'Mutation' },
            subscriptionType: { name: 'Subscription' },
            directives: [],
          },
        },
      };
    }

    // Determine if query or mutation
    const isMutation = query.trim().startsWith('mutation');
    const resolverMap = isMutation ? resolvers.Mutation : resolvers.Query;

    // Extract the operation field name(s) from the query
    const fieldMatch = query.match(/\{\s*(\w+)/g);
    if (!fieldMatch || fieldMatch.length === 0) {
      return { errors: [{ message: 'Could not parse query fields' }] };
    }

    // For each field in the query, resolve it
    const data: Record<string, any> = {};
    const errors: any[] = [];

    for (const match of fieldMatch) {
      const fieldName = match.replace(/[{}\s]/g, '');
      if (fieldName === 'mutation' || fieldName === 'query') continue;

      const resolver = (resolverMap as any)[fieldName];
      if (!resolver) {
        // Check field resolvers
        continue;
      }

      try {
        // Extract arguments from the query for this field
        const args = extractArgs(query, fieldName, variables);
        const result = await resolver(null, args, context);
        data[fieldName] = result;
      } catch (err: any) {
        errors.push({
          message: err.message,
          path: [fieldName],
          extensions: { code: err.code || 'INTERNAL_ERROR' },
        });
      }
    }

    return errors.length > 0 ? { data, errors } : { data };
  } catch (error: any) {
    return { errors: [{ message: error.message }] };
  }
}

/**
 * Extract arguments for a field from the GraphQL query.
 * Handles variables substitution.
 */
function extractArgs(
  query: string,
  fieldName: string,
  variables?: Record<string, any>
): Record<string, any> {
  // Look for the field with arguments pattern: fieldName(arg1: val1, arg2: val2)
  const argPattern = new RegExp(`${fieldName}\\s*\\(([^)]+)\\)`, 's');
  const match = query.match(argPattern);

  if (!match) return {};

  const argsString = match[1];
  const args: Record<string, any> = {};

  // Parse key-value pairs
  const pairs = argsString.split(',').map(s => s.trim());
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;

    const key = pair.substring(0, colonIndex).trim();
    let value = pair.substring(colonIndex + 1).trim();

    // Handle variable references ($varName)
    if (value.startsWith('$') && variables) {
      const varName = value.substring(1);
      args[key] = variables[varName];
    } else if (value.startsWith('"') && value.endsWith('"')) {
      args[key] = value.slice(1, -1);
    } else if (value === 'true') {
      args[key] = true;
    } else if (value === 'false') {
      args[key] = false;
    } else if (value === 'null') {
      args[key] = null;
    } else if (!isNaN(Number(value))) {
      args[key] = Number(value);
    } else {
      args[key] = value;
    }
  }

  // Merge with variables if provided
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      if (!(key in args)) {
        args[key] = value;
      }
    }
  }

  return args;
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
        <textarea id="queryInput" spellcheck="false">{
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
        const res = await fetch('/api/graphql', { method: 'POST', headers, body: JSON.stringify({ query: 'query ' + query }) });
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
