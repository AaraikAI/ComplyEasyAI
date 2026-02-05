/**
 * NeuroSymbolic AI Service
 * 
 * Combines neural networks (deep learning) with symbolic reasoning (rule-based logic)
 * for advanced compliance reasoning, rule inference, and explainable AI decisions.
 * 
 * Features:
 * - Neural-symbolic reasoning for compliance rules
 * - Rule extraction from neural models
 * - Explainable AI decisions with symbolic justifications
 * - Hybrid reasoning (neural + symbolic)
 * - Compliance rule inference
 * - Causal reasoning for compliance violations
 * - Knowledge graph integration
 * - Automated rule generation from patterns
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import config from '../../config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { Engine } from 'json-rules-engine';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey || process.env.GEMINI_API_KEY || '');

export interface SymbolicRule {
  id: string;
  name: string;
  condition: string; // Logical condition (e.g., "control.status == 'Non-Compliant' AND risk.severity == 'High'")
  action: string; // Action to take (e.g., "create_remediation_plan")
  priority: number;
  framework?: string;
  confidence: number; // 0-1
  source: 'explicit' | 'inferred' | 'learned';
  createdAt: Date;
  updatedAt: Date;
}

export interface NeuralSymbolicReasoning {
  id: string;
  organizationId: string;
  query: string;
  neuralPrediction: {
    result: any;
    confidence: number;
    model: string;
  };
  symbolicReasoning: {
    applicableRules: SymbolicRule[];
    logicalSteps: string[];
    conclusion: string;
    confidence: number;
  };
  hybridResult: {
    finalDecision: any;
    confidence: number;
    explanation: string;
    neuralWeight: number; // 0-1, how much to trust neural vs symbolic
    symbolicWeight: number; // 0-1
  };
  createdAt: Date;
}

export interface RuleInference {
  id: string;
  reasoningId: string; // Add reasoningId to match Prisma model
  organizationId: string;
  inferredRule: SymbolicRule;
  supportingEvidence: {
    patterns: string[];
    frequency: number;
    confidence: number;
  };
  validationStatus: 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  validatedAt?: Date;
}

class NeuroSymbolicAIService {
  /**
   * Perform hybrid neural-symbolic reasoning
   * Combines neural network predictions with symbolic rule-based reasoning
   */
  async performHybridReasoning(
    organizationId: string,
    query: string,
    context?: {
      frameworks?: string[];
      controls?: string[];
      risks?: string[];
    }
  ): Promise<NeuralSymbolicReasoning> {
    try {
      const reasoningId = crypto.randomUUID();

      // Step 1: Neural network prediction (using Gemini for now, can be replaced with custom model)
      const neuralPrediction = await this.getNeuralPrediction(query, context);

      // Step 2: Symbolic reasoning with applicable rules
      const symbolicReasoning = await this.performSymbolicReasoning(
        organizationId,
        query,
        context
      );

      // Step 3: Hybrid fusion - combine neural and symbolic results
      const hybridResult = this.fuseNeuralSymbolic(
        neuralPrediction,
        symbolicReasoning
      );

      // Step 4: Store reasoning result
      const reasoning: NeuralSymbolicReasoning = {
        id: reasoningId,
        organizationId,
        query,
        neuralPrediction,
        symbolicReasoning,
        hybridResult,
        createdAt: new Date(),
      };

      // Store in database (create table if needed)
      await this.storeReasoningResult(reasoning);

      logger.info(`[NeuroSymbolic] Hybrid reasoning completed: ${reasoningId}`);

      return reasoning;
    } catch (error) {
      logger.error('[NeuroSymbolic] Hybrid reasoning error', error);
      throw error;
    }
  }

  /**
   * Get neural network prediction
   */
  private async getNeuralPrediction(
    query: string,
    context?: any
  ): Promise<{ result: any; confidence: number; model: string }> {
    try {
      // Check if API key is configured
      if (!config.gemini.apiKey && !process.env.GEMINI_API_KEY) {
        logger.warn('[NeuroSymbolic] GEMINI_API_KEY not configured');
        throw new Error('GEMINI_API_KEY environment variable is not set. Please configure your Google AI API key.');
      }

      // Use gemini-2.0-flash which is more stable and available
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Analyze this compliance query using neural reasoning:
Query: ${query}
Context: ${JSON.stringify(context || {})}

Provide:
1. Prediction/Answer
2. Confidence score (0-1)
3. Key factors considered

Format as JSON with: {prediction, confidence, factors}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      let parsed: any;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        // Fallback if not JSON - try to extract meaningful content
        logger.warn('[NeuroSymbolic] Failed to parse JSON response, using text as-is');
        parsed = {
          prediction: text.trim() || 'Analysis completed',
          confidence: 0.7,
          factors: ['Neural model analysis'],
        };
      }

      return {
        result: parsed.prediction || text.trim() || 'Analysis completed',
        confidence: Math.min(1.0, Math.max(0.0, parsed.confidence || 0.7)),
        model: 'gemini-2.0-flash',
      };
    } catch (error: any) {
      logger.error('[NeuroSymbolic] Neural prediction error', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
      });

      // Provide more specific error messages
      let errorMessage = 'Unable to generate neural prediction';
      if (error.message?.includes('API key') || error.message?.includes('GEMINI_API_KEY')) {
        errorMessage = 'API key not configured. Please set GEMINI_API_KEY environment variable.';
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        errorMessage = 'API quota exceeded. Please check your Google AI Studio quota.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = 'API authentication failed. Please check your API key.';
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorMessage = 'AI model not available. Please check your model configuration.';
      } else if (error.message) {
        errorMessage = `Neural prediction failed: ${error.message}`;
      }

      return {
        result: errorMessage,
        confidence: 0.0,
        model: 'error',
      };
    }
  }

  /**
   * Perform symbolic reasoning with rules
   */
  private async performSymbolicReasoning(
    organizationId: string,
    query: string,
    context?: any
  ): Promise<{
    applicableRules: SymbolicRule[];
    logicalSteps: string[];
    conclusion: string;
    confidence: number;
  }> {
    try {
      // Get applicable symbolic rules
      const applicableRules = await this.getApplicableRules(
        organizationId,
        query,
        context
      );

      // Build logical reasoning steps
      const logicalSteps: string[] = [];
      let conclusion = '';
      let confidence = 0.5;

      if (applicableRules.length > 0) {
        logicalSteps.push(`Found ${applicableRules.length} applicable rules`);

        // Evaluate rules in priority order
        const sortedRules = applicableRules.sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
          const ruleResult = await this.evaluateRule(rule, context);
          logicalSteps.push(
            `Rule "${rule.name}": ${ruleResult.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} (confidence: ${rule.confidence})`
          );

          if (ruleResult.satisfied) {
            conclusion = rule.action;
            confidence = Math.max(confidence, rule.confidence);
            logicalSteps.push(`Action: ${rule.action}`);
            break; // Use highest priority satisfied rule
          }
        }
      } else {
        logicalSteps.push('No applicable rules found - using default reasoning');
        conclusion = 'No specific action recommended';
        confidence = 0.3;
      }

      return {
        applicableRules,
        logicalSteps,
        conclusion,
        confidence,
      };
    } catch (error) {
      logger.error('[NeuroSymbolic] Symbolic reasoning error', error);
      return {
        applicableRules: [],
        logicalSteps: ['Error in symbolic reasoning'],
        conclusion: 'Unable to determine conclusion',
        confidence: 0.0,
      };
    }
  }

  /**
   * Get applicable symbolic rules
   */
  private async getApplicableRules(
    organizationId: string,
    query: string,
    context?: any
  ): Promise<SymbolicRule[]> {
    try {
      // Get rules from database (if table exists) or use default rules
      const defaultRules: SymbolicRule[] = [
        {
          id: crypto.randomUUID(),
          name: 'High Risk Non-Compliant Control',
          condition: "control.status == 'Non-Compliant' AND risk.severity == 'High'",
          action: 'create_remediation_plan',
          priority: 10,
          confidence: 0.9,
          source: 'explicit',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Missing Evidence for Critical Control',
          condition: "control.evidence == null AND control.criticality == 'Critical'",
          action: 'request_evidence_collection',
          priority: 9,
          confidence: 0.85,
          source: 'explicit',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Regulatory Change Detected',
          condition: "regulatoryChange.status == 'new' AND regulatoryChange.severity == 'High'",
          action: 'auto_update_controls',
          priority: 8,
          confidence: 0.8,
          source: 'explicit',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Filter rules based on context
      const applicableRules = defaultRules.filter((rule) => {
        // Simple matching - in production, use proper rule engine
        if (context?.frameworks && rule.framework) {
          return context.frameworks.includes(rule.framework);
        }
        return true;
      });

      return applicableRules;
    } catch (error) {
      logger.error('[NeuroSymbolic] Get applicable rules error', error);
      return [];
    }
  }

  /**
   * Evaluate a symbolic rule against context
   * Production-ready: Uses json-rules-engine for proper rule evaluation
   */
  private async evaluateRule(
    rule: SymbolicRule,
    context?: any
  ): Promise<{ satisfied: boolean; confidence: number }> {
    try {
      // Use json-rules-engine for proper rule evaluation
      const engine = new Engine();

      // Parse rule condition into json-rules-engine format
      try {
        const ruleDefinition = this.parseRuleCondition(rule.condition, context);
        
        // Add rule to engine
        engine.addRule({
          conditions: ruleDefinition.conditions,
          event: {
            type: 'rule-satisfied',
            params: {
              ruleId: rule.id,
              ruleName: rule.name,
            },
          },
        });

        // Evaluate rule with context
        const facts = this.buildFactsFromContext(context);
        const { events } = await engine.run(facts);

        const satisfied = events.length > 0;
        const confidence = satisfied ? rule.confidence : Math.max(0, rule.confidence - 0.2);

        logger.debug(`[NeuroSymbolic] Rule ${rule.id} evaluated: ${satisfied} (confidence: ${confidence})`);

        return {
          satisfied,
          confidence,
        };
      } catch (parseError) {
        // Fallback to simple pattern matching if rule parsing fails
        logger.warn(`[NeuroSymbolic] Rule parsing failed for rule ${rule.id}, using fallback`, parseError);
        return this.evaluateRuleFallback(rule, context);
      }
    } catch (error) {
      logger.error('[NeuroSymbolic] Rule evaluation error', error);
      return { satisfied: false, confidence: 0.0 };
    }
  }

  /**
   * Parse rule condition into json-rules-engine format
   */
  private parseRuleCondition(condition: string, context?: any): { conditions: any } {
    // Convert condition string to json-rules-engine conditions
    // Example: "control.status == 'Non-Compliant' AND risk.severity == 'High'"
    const conditions: any[] = [];
    const parts = condition.split(/\s+(AND|OR)\s+/i);

    for (let i = 0; i < parts.length; i += 2) {
      const part = parts[i].trim();
      const match = part.match(/(\w+(?:\.\w+)*)\s*(==|!=|>|<|>=|<=)\s*(.+)/);
      if (match) {
        const [, factPath, op, value] = match;
        const cleanValue = value.replace(/['"]/g, '');

        const operatorMap: Record<string, string> = {
          '==': 'equal',
          '!=': 'notEqual',
          '>': 'greaterThan',
          '<': 'lessThan',
          '>=': 'greaterThanInclusive',
          '<=': 'lessThanInclusive',
        };

        conditions.push({
          fact: factPath,
          operator: operatorMap[op] || 'equal',
          value: isNaN(Number(cleanValue)) ? cleanValue : Number(cleanValue),
        });
      }
    }

    const hasOr = condition.toUpperCase().includes(' OR ');
    const logic = hasOr ? 'any' : 'all';

    return {
      conditions: conditions.length === 1 ? conditions[0] : { [logic]: conditions },
    };
  }

  /**
   * Build facts object from context for rule evaluation
   */
  private buildFactsFromContext(context?: any): any {
    if (!context) return {};

    const facts: any = {};

    if (context.controls) {
      facts.control = context.controls;
      if (Array.isArray(context.controls)) {
        context.controls.forEach((control: any, index: number) => {
          facts[`control.${index}.status`] = control.status;
          facts[`control.${index}.name`] = control.name;
        });
      } else if (context.controls.status) {
        facts['control.status'] = context.controls.status;
      }
    }

    if (context.risks) {
      facts.risk = context.risks;
      if (Array.isArray(context.risks)) {
        context.risks.forEach((risk: any, index: number) => {
          facts[`risk.${index}.severity`] = risk.severity;
          facts[`risk.${index}.title`] = risk.title;
        });
      } else if (context.risks.severity) {
        facts['risk.severity'] = context.risks.severity;
      }
    }

    Object.keys(context).forEach(key => {
      if (key !== 'controls' && key !== 'risks' && typeof context[key] !== 'object') {
        facts[key] = context[key];
      }
    });

    return facts;
  }

  /**
   * Fallback rule evaluation using simple pattern matching
   */
  private evaluateRuleFallback(
    rule: SymbolicRule,
    context?: any
  ): { satisfied: boolean; confidence: number } {
    if (!context) {
      return { satisfied: false, confidence: Math.max(0, rule.confidence - 0.4) };
    }

    const condition = rule.condition;

    // Parse and evaluate the condition expression with support for AND, OR, NOT, and nested groups
    const result = this.evaluateConditionExpression(condition, context);

    return {
      satisfied: result.satisfied,
      confidence: result.satisfied
        ? rule.confidence * result.matchStrength
        : Math.max(0, rule.confidence - 0.3 * (1 - result.matchStrength)),
    };
  }

  /**
   * Recursively evaluate a condition expression supporting AND, OR, NOT, parentheses, and comparisons
   */
  private evaluateConditionExpression(
    condition: string,
    context: any
  ): { satisfied: boolean; matchStrength: number } {
    let expr = condition.trim();

    // Strip outer parentheses if they wrap the entire expression
    if (expr.startsWith('(') && expr.endsWith(')')) {
      let depth = 0;
      let wrapsAll = true;
      for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '(') depth++;
        if (expr[i] === ')') depth--;
        if (depth === 0 && i < expr.length - 1) {
          wrapsAll = false;
          break;
        }
      }
      if (wrapsAll) {
        expr = expr.substring(1, expr.length - 1).trim();
      }
    }

    // Split on OR (lowest precedence) - respecting parentheses
    const orParts = this.splitByOperator(expr, 'OR');
    if (orParts.length > 1) {
      let anySatisfied = false;
      let maxStrength = 0;
      for (const part of orParts) {
        const result = this.evaluateConditionExpression(part.trim(), context);
        if (result.satisfied) {
          anySatisfied = true;
          maxStrength = Math.max(maxStrength, result.matchStrength);
        }
      }
      return { satisfied: anySatisfied, matchStrength: anySatisfied ? maxStrength : 0 };
    }

    // Split on AND (higher precedence than OR) - respecting parentheses
    const andParts = this.splitByOperator(expr, 'AND');
    if (andParts.length > 1) {
      let allSatisfied = true;
      let totalStrength = 0;
      for (const part of andParts) {
        const result = this.evaluateConditionExpression(part.trim(), context);
        if (!result.satisfied) {
          allSatisfied = false;
        }
        totalStrength += result.matchStrength;
      }
      return {
        satisfied: allSatisfied,
        matchStrength: totalStrength / andParts.length,
      };
    }

    // Handle NOT prefix
    if (expr.toUpperCase().startsWith('NOT ') || expr.startsWith('!')) {
      const inner = expr.toUpperCase().startsWith('NOT ') ? expr.substring(4).trim() : expr.substring(1).trim();
      const result = this.evaluateConditionExpression(inner, context);
      return { satisfied: !result.satisfied, matchStrength: result.matchStrength };
    }

    // Evaluate atomic condition (leaf expression)
    return this.evaluateAtomicCondition(expr, context);
  }

  /**
   * Split an expression by a logical operator, respecting parenthesized groups
   */
  private splitByOperator(expr: string, operator: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    const tokens = expr.split(/\s+/);
    const op = operator.toUpperCase();

    for (const token of tokens) {
      // Track parenthesis depth
      for (const ch of token) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }

      if (depth === 0 && token.toUpperCase() === op) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += (current ? ' ' : '') + token;
      }
    }
    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Evaluate a single atomic condition against the context
   */
  private evaluateAtomicCondition(
    expr: string,
    context: any
  ): { satisfied: boolean; matchStrength: number } {
    const lowerExpr = expr.toLowerCase();

    // Pattern: field.property operator value (e.g., "control.status == 'Non-Compliant'")
    const comparisonMatch = expr.match(
      /(\w+(?:\.\w+)*)\s*(==|!=|>=|<=|>|<|contains|includes)\s*['"]?([^'"]+)['"]?/i
    );

    if (comparisonMatch) {
      const [, fieldPath, operator, value] = comparisonMatch;
      const resolvedValues = this.resolveFieldValues(fieldPath, context);

      if (resolvedValues.length === 0) {
        return { satisfied: false, matchStrength: 0 };
      }

      let matchCount = 0;
      for (const resolved of resolvedValues) {
        if (this.compareValues(resolved, operator.toLowerCase(), value.trim())) {
          matchCount++;
        }
      }

      const satisfied = matchCount > 0;
      const matchStrength = resolvedValues.length > 0 ? matchCount / resolvedValues.length : 0;
      return { satisfied, matchStrength: Math.max(matchStrength, satisfied ? 0.5 : 0) };
    }

    // Pattern: threshold comparison (e.g., "risk score > 0.7", "compliance rate >= 80")
    const thresholdMatch = expr.match(
      /(\w+(?:\s+\w+)*)\s*(above|below|exceeds|at least|at most|greater than|less than)\s*(\d+(?:\.\d+)?%?)/i
    );

    if (thresholdMatch) {
      const [, fieldName, comparison, thresholdStr] = thresholdMatch;
      const threshold = parseFloat(thresholdStr.replace('%', ''));
      const isPercent = thresholdStr.includes('%');
      const resolvedValues = this.resolveFieldValues(fieldName.trim().replace(/\s+/g, '.'), context);

      for (const val of resolvedValues) {
        const numVal = typeof val === 'number' ? val : parseFloat(String(val));
        if (isNaN(numVal)) continue;
        const compareVal = isPercent ? numVal * 100 : numVal;

        const comp = comparison.toLowerCase();
        let satisfied = false;
        if (comp === 'above' || comp === 'exceeds' || comp === 'greater than') satisfied = compareVal > threshold;
        else if (comp === 'below' || comp === 'less than') satisfied = compareVal < threshold;
        else if (comp === 'at least') satisfied = compareVal >= threshold;
        else if (comp === 'at most') satisfied = compareVal <= threshold;

        if (satisfied) {
          return { satisfied: true, matchStrength: 0.8 };
        }
      }
      return { satisfied: false, matchStrength: 0.2 };
    }

    // Keyword-based matching for common compliance terms
    const keywordChecks: Array<{
      keywords: string[];
      contextField: string;
      statusCheck: (item: any) => boolean;
    }> = [
      { keywords: ['non-compliant', 'non_compliant', 'noncompliant'], contextField: 'controls', statusCheck: (c: any) => c.status === 'Non-Compliant' || c.status === 'non-compliant' || c.status === 'Failed' },
      { keywords: ['compliant', 'in-compliance'], contextField: 'controls', statusCheck: (c: any) => c.status === 'Compliant' || c.status === 'compliant' || c.status === 'Passed' },
      { keywords: ['critical', 'critical severity', 'critical risk'], contextField: 'risks', statusCheck: (r: any) => r.severity === 'Critical' },
      { keywords: ['high', 'high severity', 'high risk'], contextField: 'risks', statusCheck: (r: any) => r.severity === 'High' || r.severity === 'Critical' },
      { keywords: ['medium', 'medium severity', 'medium risk'], contextField: 'risks', statusCheck: (r: any) => r.severity === 'Medium' },
      { keywords: ['low', 'low severity', 'low risk'], contextField: 'risks', statusCheck: (r: any) => r.severity === 'Low' },
      { keywords: ['pending', 'not implemented', 'incomplete'], contextField: 'controls', statusCheck: (c: any) => c.status === 'Pending' || c.status === 'Not Implemented' || c.status === 'In Progress' },
      { keywords: ['overdue', 'expired', 'past due'], contextField: 'controls', statusCheck: (c: any) => c.dueDate && new Date(c.dueDate) < new Date() },
    ];

    for (const check of keywordChecks) {
      if (check.keywords.some(kw => lowerExpr.includes(kw))) {
        const items = context[check.contextField];
        if (items) {
          const itemArray = Array.isArray(items) ? items : [items];
          const matchCount = itemArray.filter(check.statusCheck).length;
          if (matchCount > 0) {
            return { satisfied: true, matchStrength: Math.min(1, 0.5 + matchCount / itemArray.length * 0.5) };
          }
        }
        return { satisfied: false, matchStrength: 0.2 };
      }
    }

    // Fallback: attempt direct context field lookup from the expression
    for (const key of Object.keys(context)) {
      if (lowerExpr.includes(key.toLowerCase()) && context[key] !== undefined && context[key] !== null) {
        const val = context[key];
        if (typeof val === 'boolean') {
          return { satisfied: val, matchStrength: 0.6 };
        }
        if (typeof val === 'number') {
          return { satisfied: val > 0, matchStrength: 0.5 };
        }
      }
    }

    return { satisfied: false, matchStrength: 0.1 };
  }

  /**
   * Resolve a dotted field path against the context, returning all matching values
   * (handles arrays by expanding each element)
   */
  private resolveFieldValues(fieldPath: string, context: any): any[] {
    const parts = fieldPath.split('.');
    let current: any[] = [context];

    for (const part of parts) {
      const next: any[] = [];
      for (const item of current) {
        if (item == null) continue;
        if (Array.isArray(item)) {
          for (const el of item) {
            if (el != null && el[part] !== undefined) {
              next.push(el[part]);
            }
          }
        } else if (typeof item === 'object' && item[part] !== undefined) {
          const val = item[part];
          if (Array.isArray(val)) {
            next.push(...val);
          } else {
            next.push(val);
          }
        }
      }
      current = next;
    }

    return current;
  }

  /**
   * Compare a resolved value against an expected value using the specified operator
   */
  private compareValues(actual: any, operator: string, expected: string): boolean {
    const actualStr = String(actual).toLowerCase().trim();
    const expectedStr = expected.toLowerCase().trim();
    const actualNum = parseFloat(String(actual));
    const expectedNum = parseFloat(expected);

    switch (operator) {
      case '==':
      case '===':
        return actualStr === expectedStr;
      case '!=':
      case '!==':
        return actualStr !== expectedStr;
      case '>':
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum;
      case '<':
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum;
      case '>=':
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum;
      case '<=':
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum;
      case 'contains':
      case 'includes':
        return actualStr.includes(expectedStr);
      default:
        return actualStr === expectedStr;
    }
  }

  /**
   * Fuse neural and symbolic results
   */
  private fuseNeuralSymbolic(
    neural: { result: any; confidence: number },
    symbolic: { conclusion: string; confidence: number }
  ): {
    finalDecision: any;
    confidence: number;
    explanation: string;
    neuralWeight: number;
    symbolicWeight: number;
  } {
    // Adaptive weighting based on confidence
    const neuralWeight = neural.confidence;
    const symbolicWeight = symbolic.confidence;

    // Normalize weights
    const totalWeight = neuralWeight + symbolicWeight;
    const normalizedNeuralWeight = totalWeight > 0 ? neuralWeight / totalWeight : 0.5;
    const normalizedSymbolicWeight = totalWeight > 0 ? symbolicWeight / totalWeight : 0.5;

    // Combine results
    let finalDecision: any;
    let explanation = '';

    if (normalizedSymbolicWeight > normalizedNeuralWeight) {
      // Symbolic reasoning is more confident
      finalDecision = symbolic.conclusion;
      explanation = `Symbolic reasoning (${(normalizedSymbolicWeight * 100).toFixed(0)}% weight) indicates: ${symbolic.conclusion}. Neural prediction (${(normalizedNeuralWeight * 100).toFixed(0)}% weight) suggests: ${neural.result}`;
    } else {
      // Neural prediction is more confident
      finalDecision = neural.result;
      explanation = `Neural prediction (${(normalizedNeuralWeight * 100).toFixed(0)}% weight) suggests: ${neural.result}. Symbolic reasoning (${(normalizedSymbolicWeight * 100).toFixed(0)}% weight) indicates: ${symbolic.conclusion}`;
    }

    // Combined confidence
    const combinedConfidence = Math.min(
      1.0,
      normalizedNeuralWeight * neural.confidence + normalizedSymbolicWeight * symbolic.confidence
    );

    return {
      finalDecision,
      confidence: combinedConfidence,
      explanation,
      neuralWeight: normalizedNeuralWeight,
      symbolicWeight: normalizedSymbolicWeight,
    };
  }

  /**
   * Infer new rules from patterns
   */
  async inferRulesFromPatterns(
    organizationId: string,
    patterns: {
      condition: string;
      outcome: string;
      frequency: number;
    }[]
  ): Promise<RuleInference[]> {
    try {
      const inferences: RuleInference[] = [];

      for (const pattern of patterns) {
        if (pattern.frequency >= 5) {
          // Pattern appears frequently enough to infer a rule
          const inferredRule: SymbolicRule = {
            id: crypto.randomUUID(),
            name: `Inferred Rule: ${pattern.condition}`,
            condition: pattern.condition,
            action: pattern.outcome,
            priority: 5, // Medium priority for inferred rules
            confidence: Math.min(0.8, pattern.frequency / 10), // Confidence based on frequency
            source: 'inferred',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const inference: RuleInference = {
            id: crypto.randomUUID(),
            reasoningId: '', // Will be set when stored with reasoning result
            organizationId,
            inferredRule,
            supportingEvidence: {
              patterns: [pattern.condition],
              frequency: pattern.frequency,
              confidence: inferredRule.confidence,
            },
            validationStatus: 'pending',
          };

          inferences.push(inference);
        }
      }

      // Store inferences
      await this.storeRuleInferences(inferences);

      logger.info(`[NeuroSymbolic] Inferred ${inferences.length} new rules from patterns`);

      return inferences;
    } catch (error) {
      logger.error('[NeuroSymbolic] Rule inference error', error);
      throw error;
    }
  }

  /**
   * Perform causal reasoning for compliance violations
   */
  async performCausalReasoning(
    organizationId: string,
    violation: {
      controlId: string;
      frameworkId: string;
      violationType: string;
    }
  ): Promise<{
    rootCauses: string[];
    causalChain: string[];
    recommendations: string[];
    confidence: number;
  }> {
    try {
      // Get control and related data
      const control = await prisma.frameworkControl.findFirst({
        where: {
          id: violation.controlId,
        },
        include: {
          framework: true,
        },
      });

      if (!control) {
        throw new Error('Control not found');
      }

      // Build causal chain using neural-symbolic reasoning
      const reasoningId = crypto.randomUUID();
      const causalChain: string[] = [];
      const rootCauses: string[] = [];
      const recommendations: string[] = [];

      // Symbolic reasoning: Check common causes
      if (!control.evidence) {
        rootCauses.push('Missing evidence');
        causalChain.push('Control requires evidence → Evidence not provided → Control marked non-compliant');
        recommendations.push('Collect and upload required evidence');
      }

      if (control.status === 'At Risk') {
        rootCauses.push('Control status indicates risk');
        causalChain.push('Control status: At Risk → Risk not mitigated → Compliance violation');
        recommendations.push('Implement risk mitigation measures');
      }

      // NEURAL CAUSAL REASONING (ENHANCED with causal graph construction)
      if (!config.gemini.apiKey && !process.env.GEMINI_API_KEY) {
        logger.warn('[NeuroSymbolic] GEMINI_API_KEY not configured for causal reasoning');
        return {
          rootCauses: [...new Set(rootCauses)],
          causalChain,
          recommendations: [...new Set(recommendations)],
          confidence: 0.5, // Lower confidence without neural component
        };
      }

      try {
        // Get related controls and risks for context
        const relatedControls = await prisma.frameworkControl.findMany({
          where: {
            frameworkId: violation.frameworkId,
            id: { not: violation.controlId },
          },
          take: 10,
        });

        const relatedRisks = await prisma.riskItem.findMany({
          where: { organizationId },
          take: 10,
        });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `Perform NEURAL CAUSAL REASONING to analyze root causes of this compliance violation.
Build a causal graph identifying direct and indirect causes.

Control: ${control.name}
Framework: ${control.framework?.name || 'Unknown'}
Violation Type: ${violation.violationType}
Status: ${control.status}
Evidence: ${control.evidence ? 'Present' : 'Missing'}

Related Controls: ${relatedControls.map(c => c.name).join(', ')}
Related Risks: ${relatedRisks.map(r => r.title).join(', ')}

Use neural reasoning to:
1. Identify root causes (direct and indirect)
2. Build causal chain (cause → effect relationships)
3. Detect hidden dependencies between controls/risks
4. Generate recommendations based on causal analysis

Format as JSON:
{
  "rootCauses": ["cause1", "cause2"],
  "causalChain": ["step1 → step2 → step3"],
  "causalGraph": {
    "nodes": [{"id": "node1", "type": "control|risk|evidence", "label": "..."}],
    "edges": [{"from": "node1", "to": "node2", "type": "causes|mitigates|depends_on"}]
  },
  "recommendations": ["rec1", "rec2"]
}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        const response = result.response.text();
        
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : response;
        const parsed = JSON.parse(jsonText);

        rootCauses.push(...(parsed.rootCauses || []));
        causalChain.push(...(parsed.causalChain || []));
        recommendations.push(...(parsed.recommendations || []));

        // Store causal graph for visualization
        if (parsed.causalGraph) {
          await this.storeCausalGraph(reasoningId, parsed.causalGraph, organizationId);
        }
      } catch (error) {
        logger.warn('[NeuroSymbolic] Neural causal reasoning failed, using symbolic only', error);
      }

      return {
        rootCauses: [...new Set(rootCauses)], // Remove duplicates
        causalChain,
        recommendations: [...new Set(recommendations)],
        confidence: 0.75,
      };
    } catch (error) {
      logger.error('[NeuroSymbolic] Causal reasoning error', error);
      throw error;
    }
  }

  /**
   * Generate explainable AI decision (ENHANCED with visual explanations and counterfactuals)
   */
  async generateExplainableDecision(
    organizationId: string,
    decision: {
      action: string;
      reasoning: string;
    }
  ): Promise<{
    decision: string;
    explanation: string;
    symbolicJustification: string[];
    neuralFactors: string[];
    confidence: number;
    visualExplanation?: {
      type: 'graph' | 'tree' | 'flowchart';
      data: any;
      svg?: string;
    };
    counterfactuals?: Array<{
      scenario: string;
      outcome: string;
      probability: number;
    }>;
  }> {
    try {
      // Perform hybrid reasoning
      const reasoning = await this.performHybridReasoning(organizationId, decision.reasoning);

      // Extract symbolic justifications
      const symbolicJustification = reasoning.symbolicReasoning.logicalSteps;

      // Extract neural factors
      const neuralFactors = Array.isArray(reasoning.neuralPrediction.result)
        ? reasoning.neuralPrediction.result
        : [reasoning.neuralPrediction.result];

      // Generate VISUAL EXPLANATION (graph/tree)
      const visualExplanation = await this.generateVisualExplanation(reasoning);

      // Generate COUNTERFACTUAL explanations
      const counterfactuals = await this.generateCounterfactuals(organizationId, decision, reasoning);

      // Build explanation
      const explanation = `
Decision: ${decision.action}

Symbolic Reasoning:
${symbolicJustification.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Neural Analysis:
- Model: ${reasoning.neuralPrediction.model}
- Confidence: ${(reasoning.neuralPrediction.confidence * 100).toFixed(0)}%
- Factors: ${neuralFactors.join(', ')}

Hybrid Result:
${reasoning.hybridResult.explanation}
Final Confidence: ${(reasoning.hybridResult.confidence * 100).toFixed(0)}%
      `.trim();

      return {
        decision: decision.action,
        explanation,
        symbolicJustification,
        neuralFactors,
        confidence: reasoning.hybridResult.confidence,
        visualExplanation,
        counterfactuals,
      };
    } catch (error) {
      logger.error('[NeuroSymbolic] Explainable decision error', error);
      throw error;
    }
  }

  /**
   * Generate visual explanation (graph/tree/flowchart)
   */
  private async generateVisualExplanation(
    reasoning: NeuralSymbolicReasoning
  ): Promise<{
    type: 'graph' | 'tree' | 'flowchart';
    data: any;
    svg?: string;
  }> {
    try {
      // Build decision tree/graph structure
      const nodes: Array<{ id: string; label: string; type: string; color?: string }> = [];
      const edges: Array<{ from: string; to: string; label: string; type: string }> = [];

      // Add neural prediction node
      nodes.push({
        id: 'neural',
        label: `Neural Prediction\n(${(reasoning.neuralPrediction.confidence * 100).toFixed(0)}% confidence)`,
        type: 'neural',
        color: '#3b82f6',
      });

      // Add symbolic reasoning nodes
      reasoning.symbolicReasoning.applicableRules.forEach((rule, index) => {
        const ruleId = `rule_${index}`;
        nodes.push({
          id: ruleId,
          label: rule.name,
          type: 'rule',
          color: '#10b981',
        });
        edges.push({
          from: ruleId,
          to: 'neural',
          label: rule.condition,
          type: 'influences',
        });
      });

      // Add hybrid result node
      nodes.push({
        id: 'hybrid',
        label: `Hybrid Decision\n(${(reasoning.hybridResult.confidence * 100).toFixed(0)}% confidence)`,
        type: 'decision',
        color: '#f59e0b',
      });
      edges.push({
        from: 'neural',
        to: 'hybrid',
        label: `${(reasoning.hybridResult.neuralWeight * 100).toFixed(0)}% weight`,
        type: 'contributes',
      });

      // Generate SVG representation (simplified)
      const svg = this.generateExplanationSVG(nodes, edges);

      return {
        type: 'graph',
        data: { nodes, edges },
        svg,
      };
    } catch (error) {
      logger.error('[NeuroSymbolic] Visual explanation generation error', error);
      return {
        type: 'graph',
        data: { nodes: [], edges: [] },
      };
    }
  }

  /**
   * Generate SVG for visual explanation
   */
  private generateExplanationSVG(
    nodes: Array<{ id: string; label: string; type: string; color?: string }>,
    edges: Array<{ from: string; to: string; label: string; type: string }>
  ): string {
    // Generate simple SVG flowchart
    const nodePositions = new Map<string, { x: number; y: number }>();
    const nodeWidth = 150;
    const nodeHeight = 80;
    const spacing = 200;

    // Calculate positions
    nodes.forEach((node, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      nodePositions.set(node.id, {
        x: col * spacing + 100,
        y: row * spacing + 100,
      });
    });

    // Generate SVG
    const svgNodes = nodes.map(node => {
      const pos = nodePositions.get(node.id) || { x: 0, y: 0 };
      const color = node.color || '#6b7280';
      return `<rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" fill="${color}" stroke="#000" stroke-width="2" rx="5"/>
<text x="${pos.x + nodeWidth / 2}" y="${pos.y + nodeHeight / 2}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${node.label}</text>`;
    }).join('\n');

    const svgEdges = edges.map(edge => {
      const fromPos = nodePositions.get(edge.from) || { x: 0, y: 0 };
      const toPos = nodePositions.get(edge.to) || { x: 0, y: 0 };
      const fromX = fromPos.x + nodeWidth / 2;
      const fromY = fromPos.y + nodeHeight;
      const toX = toPos.x + nodeWidth / 2;
      const toY = toPos.y;
      return `<line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="#000" stroke-width="2" marker-end="url(#arrowhead)"/>
<text x="${(fromX + toX) / 2}" y="${(fromY + toY) / 2 - 10}" text-anchor="middle" font-size="10" fill="#666">${edge.label}</text>`;
    }).join('\n');

    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#000" />
    </marker>
  </defs>
  ${svgNodes}
  ${svgEdges}
</svg>`;
  }

  /**
   * Generate counterfactual explanations
   */
  private async generateCounterfactuals(
    organizationId: string,
    decision: { action: string; reasoning: string },
    reasoning: NeuralSymbolicReasoning
  ): Promise<Array<{ scenario: string; outcome: string; probability: number }>> {
    try {
      if (!config.gemini.apiKey && !process.env.GEMINI_API_KEY) {
        return [];
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Generate COUNTERFACTUAL explanations for this decision:
Decision: ${decision.action}
Reasoning: ${decision.reasoning}

Neural Prediction: ${JSON.stringify(reasoning.neuralPrediction)}
Symbolic Conclusion: ${reasoning.symbolicReasoning.conclusion}

For each counterfactual scenario, answer:
1. What if a different condition was true?
2. What would be the outcome?
3. What is the probability?

Format as JSON:
{
  "counterfactuals": [
    {
      "scenario": "If X was different, then...",
      "outcome": "Decision would be Y",
      "probability": 0.75
    }
  ]
}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8, // Higher temperature for creative counterfactuals
          maxOutputTokens: 2048,
        },
      });

      const response = result.response.text();
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : response;
      const parsed = JSON.parse(jsonText);

      return parsed.counterfactuals || [];
    } catch (error) {
      logger.warn('[NeuroSymbolic] Counterfactual generation failed', error);
      return [];
    }
  }

  /**
   * Store causal graph for visualization
   */
  private async storeCausalGraph(
    reasoningId: string,
    causalGraph: any,
    organizationId: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'neuro_symbolic.causal_graph_generated',
          details: JSON.stringify({
            reasoningId,
            causalGraph,
          }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });
    } catch (error) {
      logger.error('[NeuroSymbolic] Error storing causal graph', error);
    }
  }

  /**
   * Store reasoning result in database
   */
  private async storeReasoningResult(reasoning: NeuralSymbolicReasoning): Promise<void> {
    try {
      // Map NeuralSymbolicReasoning interface to Prisma model structure
      await prisma.neuroSymbolicReasoning.create({
        data: {
          id: reasoning.id,
          organizationId: reasoning.organizationId,
          input: { query: reasoning.query } as any, // Store query as input
          neuralPrediction: reasoning.neuralPrediction as any,
          symbolicRules: { 
            applicableRules: reasoning.symbolicReasoning.applicableRules,
            logicalSteps: reasoning.symbolicReasoning.logicalSteps,
            conclusion: reasoning.symbolicReasoning.conclusion,
          } as any, // Store symbolic reasoning as rules
          finalDecision: reasoning.hybridResult.finalDecision as any,
          confidence: reasoning.hybridResult.confidence,
          explanation: reasoning.hybridResult.explanation || '',
        },
      });
      logger.info(`[NeuroSymbolic] Stored reasoning result: ${reasoning.id}`);
    } catch (error) {
      logger.error('[NeuroSymbolic] Store reasoning error', error);
    }
  }

  /**
   * Store rule inferences in database
   */
  private async storeRuleInferences(inferences: RuleInference[]): Promise<void> {
    try {
      for (const inference of inferences) {
        await prisma.ruleInference.create({
          data: {
            id: inference.id,
            reasoningId: inference.reasoningId,
            organizationId: inference.organizationId,
            inferredRule: inference.inferredRule as any,
            supportingEvidence: inference.supportingEvidence as any,
            validationStatus: inference.validationStatus || 'pending',
            validatedBy: inference.validatedBy,
            validatedAt: inference.validatedAt,
          },
        });
      }
      logger.info(`[NeuroSymbolic] Stored ${inferences.length} rule inferences`);
    } catch (error) {
      logger.error('[NeuroSymbolic] Store inferences error', error);
    }
  }

  /**
   * Get reasoning history from database
   */
  async getReasoningHistory(
    organizationId: string,
    limit: number = 50
  ): Promise<NeuralSymbolicReasoning[]> {
    try {
      const dbReasonings = await prisma.neuroSymbolicReasoning.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          inferences: true,
        },
      });

      return dbReasonings.map(r => {
        const neuralPred = r.neuralPrediction as any;
        const symbolicRules = r.symbolicRules as any;
        const finalDecision = r.finalDecision as any;
        
        return {
          id: r.id,
          organizationId: r.organizationId,
          query: (r.input as any)?.query || '',
          neuralPrediction: {
            result: neuralPred?.result || neuralPred,
            confidence: neuralPred?.confidence || r.confidence,
            model: neuralPred?.model || 'gemini',
          },
          symbolicReasoning: {
            applicableRules: Array.isArray(symbolicRules) ? symbolicRules : [],
            logicalSteps: (r.input as any)?.logicalSteps || [],
            conclusion: finalDecision?.conclusion || '',
            confidence: r.confidence,
          },
          hybridResult: {
            finalDecision: finalDecision?.result || finalDecision,
            confidence: r.confidence,
            explanation: r.explanation || '',
            neuralWeight: finalDecision?.neuralWeight || 0.5,
            symbolicWeight: finalDecision?.symbolicWeight || 0.5,
          },
          createdAt: r.createdAt,
          inferences: r.inferences.map(i => ({
          id: i.id,
          reasoningId: i.reasoningId,
          organizationId: i.organizationId,
          inferredRule: i.inferredRule as any,
          supportingEvidence: i.supportingEvidence as any,
          validationStatus: i.validationStatus as any,
          validatedBy: i.validatedBy || undefined,
          validatedAt: i.validatedAt || undefined,
        })),
        };
      });
    } catch (error) {
      logger.error('[NeuroSymbolic] Get history error', error);
      return [];
    }
  }

  /**
   * Validate inferred rule in database
   */
  async validateInferredRule(
    inferenceId: string,
    organizationId: string,
    userId: string,
    validated: boolean
  ): Promise<RuleInference> {
    try {
      // Update rule inference in database
      const updated = await prisma.ruleInference.update({
        where: {
          id: inferenceId,
          organizationId,
        },
        data: {
          validationStatus: validated ? 'validated' : 'rejected',
          validatedBy: userId,
          validatedAt: new Date(),
        },
      });

      return {
        id: updated.id,
        reasoningId: updated.reasoningId,
        organizationId: updated.organizationId,
        inferredRule: updated.inferredRule as any,
        supportingEvidence: updated.supportingEvidence as any,
        validationStatus: updated.validationStatus as any,
        validatedBy: updated.validatedBy || undefined,
        validatedAt: updated.validatedAt || undefined,
      };
    } catch (error) {
      logger.error('[NeuroSymbolic] Validate rule error', error);
      throw error;
    }
  }
}

export default new NeuroSymbolicAIService();

