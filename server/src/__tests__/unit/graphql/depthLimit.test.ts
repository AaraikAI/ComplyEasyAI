/**
 * Unit tests for the query depth validation rule (graphql/depthLimit.ts).
 */

import { describe, it, expect } from '@jest/globals';
import { buildSchema, parse, validate, getIntrospectionQuery } from 'graphql';
import { depthLimit } from '../../../graphql/depthLimit';

const schema = buildSchema(`
  type Node {
    id: ID!
    name: String
    child: Node
  }

  type Query {
    node: Node
  }
`);

/** Builds `query Deep { node { child { ... { id } } } }` whose deepest field sits at depth `levels`. */
function nestedQuery(levels: number): string {
  let selection = 'id';
  for (let i = 1; i < levels; i++) {
    selection = `child { ${selection} }`;
  }
  return `query Deep { node { ${selection} } }`;
}

function run(query: string, maxDepth: number) {
  return validate(schema, parse(query), [depthLimit(maxDepth)]);
}

describe('depthLimit validation rule', () => {
  it('accepts an operation whose nesting stays within the limit', () => {
    // Deepest field sits at depth 3 (node=0, child=1, child=2, id=3).
    expect(run(nestedQuery(3), 3)).toHaveLength(0);
  });

  it('rejects an operation that nests past the limit, with message and locations', () => {
    const errors = run(nestedQuery(4), 3);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("'Deep' exceeds maximum operation depth of 3");
    expect(errors[0].locations).toBeDefined();
    expect(errors[0].locations?.[0].line).toBe(1);
  });

  it('uses an empty operation name for anonymous operations', () => {
    const errors = run('{ node { child { child { id } } } }', 1);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe("'' exceeds maximum operation depth of 1");
  });

  it('counts depth through named fragments and inline fragments', () => {
    const query = `
      query Frag { node { ...A } }
      fragment A on Node { child { ... on Node { child { id } } } }
    `;

    expect(run(query, 3)).toHaveLength(0);
    expect(run(query, 2)).toHaveLength(1);
  });

  it('does not descend into introspection fields', () => {
    expect(run(getIntrospectionQuery(), 2)).toHaveLength(0);
  });

  it('ignores spreads of unknown fragments instead of throwing', () => {
    expect(() => run('query Q { node { ...Missing } }', 5)).not.toThrow();
    expect(run('query Q { node { ...Missing } }', 5)).toHaveLength(0);
  });

  it('terminates on fragment cycles', () => {
    const query = `
      query Cycle { node { ...A } }
      fragment A on Node { name ...B }
      fragment B on Node { id ...A }
    `;

    expect(() => run(query, 5)).not.toThrow();
    expect(run(query, 5)).toHaveLength(0);
  });

  it('evaluates every operation in the document', () => {
    const query = `${nestedQuery(1)} query Second { node { child { child { id } } } }`;
    const errors = run(query, 1);

    expect(errors.map((error) => error.message)).toEqual([
      "'Second' exceeds maximum operation depth of 1",
    ]);
  });
});
