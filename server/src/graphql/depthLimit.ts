/**
 * Query depth limiting validation rule.
 *
 * Replaces the unmaintained `graphql-depth-limit` package (last published 2018),
 * which builds its errors with the positional `new GraphQLError(message, nodes)`
 * constructor. graphql-js v17 removed that form, so under v17 the package's
 * errors silently lose their `locations`. This rule keeps the same depth
 * semantics and error message, and additionally:
 *  - reports errors with the options-object constructor, so locations survive;
 *  - skips spreads of unknown fragments instead of throwing a TypeError (the
 *    standard KnownFragmentNames rule reports those when `graphql()` validates
 *    the document with the specified rules);
 *  - stops at fragment cycles instead of recursing until the stack overflows
 *    (the standard NoFragmentCycles rule reports those in the same pass);
 *  - measures each fragment at most once per starting depth within an
 *    operation. graphql-depth-limit re-walked a fragment for every spread that
 *    reached it, so a few hundred bytes of fragments that each spread the next
 *    one twice cost 2^n steps and blocked the event loop. The same over-deep
 *    node inside a shared fragment is therefore reported once, not once per
 *    path.
 *
 * Depth semantics match graphql-depth-limit 1.1.0: top-level fields sit at
 * depth 0, each nested selection set adds one, fragment spreads and inline
 * fragments add nothing, and fields whose name starts with `__` (introspection)
 * are not descended into. A node reached at a depth greater than `maxDepth`
 * produces the error.
 */

import {
  GraphQLError,
  Kind,
  type ASTVisitor,
  type FragmentDefinitionNode,
  type OperationDefinitionNode,
  type SelectionNode,
  type ValidationContext,
  type ValidationRule,
} from 'graphql';

type DepthNode = SelectionNode | FragmentDefinitionNode | OperationDefinitionNode;

/** Per-operation walk state. */
interface OperationWalk {
  operationName: string;
  /** Fragments currently being expanded on the walk's path (cycle guard). */
  activeFragments: Set<string>;
  /** Depth already measured for `<fragment name>:<starting depth>`. */
  measuredFragments: Map<string, number>;
}

export function depthLimit(maxDepth: number): ValidationRule {
  return (context: ValidationContext): ASTVisitor => {
    const fragments = new Map<string, FragmentDefinitionNode>();
    for (const definition of context.getDocument().definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        fragments.set(definition.name.value, definition);
      }
    }

    const measure = (node: DepthNode, depthSoFar: number, walk: OperationWalk): number => {
      if (depthSoFar > maxDepth) {
        context.reportError(
          new GraphQLError(
            `'${walk.operationName}' exceeds maximum operation depth of ${maxDepth}`,
            { nodes: node }
          )
        );
        return 0;
      }

      switch (node.kind) {
        case Kind.FIELD:
          if (node.name.value.startsWith('__') || !node.selectionSet) {
            return 0;
          }
          return 1 + maxOf(node.selectionSet.selections.map((selection) =>
            measure(selection, depthSoFar + 1, walk)
          ));
        case Kind.FRAGMENT_SPREAD: {
          const name = node.name.value;
          const fragment = fragments.get(name);
          if (!fragment || walk.activeFragments.has(name)) {
            return 0;
          }
          const key = `${name}:${depthSoFar}`;
          const measured = walk.measuredFragments.get(key);
          if (measured !== undefined) {
            return measured;
          }
          walk.activeFragments.add(name);
          const depth = measure(fragment, depthSoFar, walk);
          walk.activeFragments.delete(name);
          walk.measuredFragments.set(key, depth);
          return depth;
        }
        case Kind.INLINE_FRAGMENT:
        case Kind.FRAGMENT_DEFINITION:
        case Kind.OPERATION_DEFINITION:
          return maxOf(node.selectionSet.selections.map((selection) =>
            measure(selection, depthSoFar, walk)
          ));
        default:
          return 0;
      }
    };

    return {
      OperationDefinition(node) {
        measure(node, 0, {
          operationName: node.name?.value ?? '',
          activeFragments: new Set(),
          measuredFragments: new Map(),
        });
        return false;
      },
      FragmentDefinition() {
        return false;
      },
    };
  };
}

function maxOf(values: number[]): number {
  let result = 0;
  for (const value of values) {
    if (value > result) result = value;
  }
  return result;
}

export default depthLimit;
