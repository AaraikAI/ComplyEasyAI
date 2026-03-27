/**
 * State Machine Utility
 * Validates status transitions for various entities across the application.
 * Ensures business rules are enforced for status changes.
 */

import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Generic state machine configuration type
 */
export interface StateMachineConfig<S extends string> {
  name: string;
  states: readonly S[];
  initialState: S;
  transitions: Record<S, readonly S[]>;
  finalStates?: readonly S[];
}

/**
 * State transition result
 */
export interface TransitionResult<S extends string> {
  valid: boolean;
  fromState: S;
  toState: S;
  error?: string;
  allowedTransitions?: readonly S[];
}

/**
 * Generic state machine class for validating transitions
 */
export class StateMachine<S extends string> {
  private config: StateMachineConfig<S>;

  constructor(config: StateMachineConfig<S>) {
    this.config = config;
  }

  /**
   * Validate if a transition from one state to another is allowed
   */
  canTransition(fromState: S, toState: S): TransitionResult<S> {
    const allowedTransitions = this.config.transitions[fromState] || [];

    if (!this.config.states.includes(fromState)) {
      return {
        valid: false,
        fromState,
        toState,
        error: `Invalid current state: ${fromState}. Valid states: ${this.config.states.join(', ')}`,
        allowedTransitions,
      };
    }

    if (!this.config.states.includes(toState)) {
      return {
        valid: false,
        fromState,
        toState,
        error: `Invalid target state: ${toState}. Valid states: ${this.config.states.join(', ')}`,
        allowedTransitions,
      };
    }

    if (fromState === toState) {
      return { valid: true, fromState, toState, allowedTransitions };
    }

    if (this.config.finalStates?.includes(fromState)) {
      return {
        valid: false,
        fromState,
        toState,
        error: `Cannot transition from final state: ${fromState}`,
        allowedTransitions: [],
      };
    }

    const isValid = allowedTransitions.includes(toState);
    const result: TransitionResult<S> = {
      valid: isValid,
      fromState,
      toState,
      allowedTransitions,
    };

    if (!isValid) {
      result.error = `Invalid transition from '${fromState}' to '${toState}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`;
    }

    return result;
  }

  /**
   * Assert a transition is valid, throwing an error if not
   */
  assertTransition(fromState: S, toState: S): void {
    const result = this.canTransition(fromState, toState);
    if (!result.valid) {
      logger.warn(`[StateMachine:${this.config.name}] ${result.error}`);
      throw new AppError(result.error || 'Invalid state transition', 400);
    }
  }

  /**
   * Get allowed transitions from a state
   */
  getAllowedTransitions(fromState: S): readonly S[] {
    return this.config.transitions[fromState] || [];
  }

  /**
   * Check if a state is a final state
   */
  isFinalState(state: S): boolean {
    return this.config.finalStates?.includes(state) ?? false;
  }

  /**
   * Get the state machine name
   */
  getName(): string {
    return this.config.name;
  }
}

// ============================================================================
// PRE-DEFINED STATE MACHINES FOR COMMON ENTITIES
// ============================================================================

// JIT Access Request States
const jitAccessStates = ['pending', 'approved', 'denied', 'expired', 'revoked'] as const;
export type JITAccessState = typeof jitAccessStates[number];

export const jitAccessStateMachine = new StateMachine<JITAccessState>({
  name: 'JITAccessRequest',
  states: jitAccessStates,
  initialState: 'pending',
  transitions: {
    pending: ['approved', 'denied', 'expired'],
    approved: ['expired', 'revoked'],
    denied: [],
    expired: [],
    revoked: [],
  },
  finalStates: ['denied', 'expired', 'revoked'],
});

// Agentic AI Action States
const agenticActionStates = ['pending', 'approved', 'executing', 'completed', 'rolled_back', 'failed'] as const;
export type AgenticActionState = typeof agenticActionStates[number];

export const agenticActionStateMachine = new StateMachine<AgenticActionState>({
  name: 'AgenticAction',
  states: agenticActionStates,
  initialState: 'pending',
  transitions: {
    pending: ['approved', 'executing'],
    approved: ['executing'],
    executing: ['completed', 'failed'],
    completed: ['rolled_back'],
    rolled_back: [],
    failed: ['rolled_back'],
  },
  finalStates: ['rolled_back'],
});

// Compliance Control States
const controlStates = ['not_started', 'in_progress', 'implemented', 'not_applicable', 'needs_review'] as const;
export type ControlState = typeof controlStates[number];

export const controlStateMachine = new StateMachine<ControlState>({
  name: 'ComplianceControl',
  states: controlStates,
  initialState: 'not_started',
  transitions: {
    not_started: ['in_progress', 'not_applicable'],
    in_progress: ['implemented', 'not_started', 'not_applicable', 'needs_review'],
    implemented: ['needs_review', 'in_progress'],
    not_applicable: ['not_started', 'in_progress'],
    needs_review: ['in_progress', 'implemented'],
  },
});

// Risk Assessment States
const riskStates = ['identified', 'assessing', 'mitigating', 'accepted', 'closed', 'reopened'] as const;
export type RiskState = typeof riskStates[number];

export const riskStateMachine = new StateMachine<RiskState>({
  name: 'RiskAssessment',
  states: riskStates,
  initialState: 'identified',
  transitions: {
    identified: ['assessing', 'accepted', 'closed'],
    assessing: ['mitigating', 'accepted', 'closed'],
    mitigating: ['closed', 'accepted', 'assessing'],
    accepted: ['reopened', 'closed'],
    closed: ['reopened'],
    reopened: ['assessing', 'mitigating'],
  },
  finalStates: [],
});

// Incident States
const incidentStates = ['detected', 'investigating', 'contained', 'remediated', 'closed', 'archived'] as const;
export type IncidentState = typeof incidentStates[number];

export const incidentStateMachine = new StateMachine<IncidentState>({
  name: 'Incident',
  states: incidentStates,
  initialState: 'detected',
  transitions: {
    detected: ['investigating', 'contained'],
    investigating: ['contained', 'remediated', 'closed'],
    contained: ['remediated', 'investigating'],
    remediated: ['closed'],
    closed: ['archived'],
    archived: [],
  },
  finalStates: ['archived'],
});

// Workflow Task States
const taskStates = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'] as const;
export type TaskState = typeof taskStates[number];

export const taskStateMachine = new StateMachine<TaskState>({
  name: 'WorkflowTask',
  states: taskStates,
  initialState: 'pending',
  transitions: {
    pending: ['in_progress', 'blocked', 'cancelled'],
    in_progress: ['completed', 'blocked', 'cancelled', 'pending'],
    completed: [],
    blocked: ['pending', 'in_progress', 'cancelled'],
    cancelled: [],
  },
  finalStates: ['completed', 'cancelled'],
});

// SoD Violation States
const sodViolationStates = ['active', 'mitigated', 'accepted', 'remediated', 'resolved'] as const;
export type SoDViolationState = typeof sodViolationStates[number];

export const sodViolationStateMachine = new StateMachine<SoDViolationState>({
  name: 'SoDViolation',
  states: sodViolationStates,
  initialState: 'active',
  transitions: {
    active: ['mitigated', 'accepted', 'remediated'],
    mitigated: ['resolved', 'active'],
    accepted: ['resolved', 'active', 'remediated'],
    remediated: ['resolved'],
    resolved: ['active'],
  },
});

// DORA Resilience Test States
const resilienceTestStates = ['draft', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'] as const;
export type ResilienceTestState = typeof resilienceTestStates[number];

export const resilienceTestStateMachine = new StateMachine<ResilienceTestState>({
  name: 'DORAResilienceTest',
  states: resilienceTestStates,
  initialState: 'draft',
  transitions: {
    draft: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'failed'],
    completed: ['draft'],
    failed: ['draft', 'scheduled'],
    cancelled: [],
  },
  finalStates: ['cancelled'],
});

// Subscription States
const subscriptionStates = ['trialing', 'active', 'past_due', 'canceled', 'paused', 'incomplete'] as const;
export type SubscriptionState = typeof subscriptionStates[number];

export const subscriptionStateMachine = new StateMachine<SubscriptionState>({
  name: 'Subscription',
  states: subscriptionStates,
  initialState: 'trialing',
  transitions: {
    trialing: ['active', 'canceled', 'incomplete'],
    active: ['past_due', 'canceled', 'paused'],
    past_due: ['active', 'canceled'],
    canceled: [],
    paused: ['active', 'canceled'],
    incomplete: ['active', 'canceled'],
  },
  finalStates: ['canceled'],
});

/**
 * Factory function to create a custom state machine
 */
export function createStateMachine<S extends string>(
  name: string,
  states: readonly S[],
  initialState: S,
  transitions: Record<S, readonly S[]>,
  finalStates?: readonly S[]
): StateMachine<S> {
  return new StateMachine<S>({
    name,
    states,
    initialState,
    transitions,
    finalStates,
  });
}

/**
 * Validate status transition with logging
 */
export function validateStatusTransition<S extends string>(
  machine: StateMachine<S>,
  currentStatus: S,
  newStatus: S
): { valid: boolean; error?: string } {
  const result = machine.canTransition(currentStatus, newStatus);

  if (!result.valid) {
    logger.warn(`[StateMachine:${machine.getName()}] Invalid transition: ${result.error}`);
  }

  return {
    valid: result.valid,
    error: result.error,
  };
}
