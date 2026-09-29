/**
 * Unit tests for the query depth validation rule (graphql/depthLimit.ts).
 */

import { describe, it, expect } from '@jest/globals';
import { buildSchema, parse, validate, getIntrospectionQuery, Kind } from 'graphql';
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

/**
 * Builds a document where fragment F<i> spreads F<i+1> twice, so the number of
 * paths to the last fragment doubles with every level (2^count in total).
 */
function fanOutQuery(count: number, leaf: string): string {
  let query = 'query FanOut { node { ...F0 } }\n';
  for (let i = 0; i < count; i++) {
    query += `fragment F${i} on Node { ...F${i + 1} ...F${i + 1} }\n`;
  }
  return `${query}fragment F${count} on Node { ${leaf} }\n`;
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

  it('walks each fragment once per starting depth on fan-out documents', () => {
    const fragmentCount = 16;
    const document = parse(fanOutQuery(fragmentCount, 'id'));
    let selectionSetReads = 0;
    for (const definition of document.definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        const { selectionSet } = definition;
        Object.defineProperty(definition, 'selectionSet', {
          get: () => {
            selectionSetReads++;
            return selectionSet;
          },
        });
      }
    }

    expect(validate(schema, document, [depthLimit(10)])).toHaveLength(0);
    // Walking every path instead would read the selection sets 2^17 - 1 times.
    expect(selectionSetReads).toBeLessThan(10 * (fragmentCount + 1));
  });

  it('reports an over-deep node inside a shared fragment once', () => {
    // The leaf fragment's `id` sits at depth 2 (node=0, child=1, id=2) behind 2^8 paths.
    const errors = run(fanOutQuery(8, 'child { id }'), 1);

    expect(errors.map((error) => error.message)).toEqual([
      "'FanOut' exceeds maximum operation depth of 1",
    ]);
    expect(errors[0].locations?.[0].line).toBe(10);
  });

  it('evaluates every operation in the document', () => {
    const query = `${nestedQuery(1)} query Second { node { child { child { id } } } }`;
    const errors = run(query, 1);

    expect(errors.map((error) => error.message)).toEqual([
      "'Second' exceeds maximum operation depth of 1",
    ]);
  });
});
