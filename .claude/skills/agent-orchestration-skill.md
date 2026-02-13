---
name: agent-orchestration
description: Design optimal agent-based execution strategies for complex tasks. Analyzes requirements, recommends orchestration patterns (workflows vs agents), and generates complete architecture specifications with executable code scaffolding.
---

# Agent Orchestration Skill

## Purpose
This skill helps Claude Code analyze tasks and design optimal agent-based execution strategies. It provides task decomposition, orchestration pattern recommendations, architecture specifications, and executable scaffolding for multi-agent systems.

## When to Use This Skill

**Primary triggers:**
- "Design an agent system for [task]"
- "How should I orchestrate [complex workflow]"
- "Break this down into agents"
- "Create a multi-agent architecture for [project]"
- User presents a complex task that would benefit from decomposition
- Claude Code needs to determine workflow vs agent approach for a task

**Domain coverage:**
- Software development (code generation, refactoring, testing, deployment)
- Business/marketing automation (funnels, lead flows, content generation)
- Data processing and analysis pipelines
- General-purpose task orchestration
- Any complex workflow that could benefit from agent decomposition

## Core Principles

### 1. Workflows vs. Agents (Anthropic Framework)

**Workflows:** LLMs and tools orchestrated via predefined code paths
- Predictable and deterministic
- Ideal for repeatable, well-defined tasks
- Lower cost and latency
- Easier to debug and maintain

**Agents:** LLMs dynamically directing their own tool usage based on environment feedback
- Flexible and adaptive
- Handle unpredictable or novel scenarios
- Higher cost and complexity
- Best for tasks requiring real-time decision-making

**Default recommendation:** Start with workflow-style orchestration; introduce agentic autonomy only where it clearly improves performance or reduces manual integration work.

### 2. Orchestration Patterns

**Simple Workflow Patterns:**
- **Prompt chaining**: Sequential steps where each LLM call transforms previous output (outline → draft → edit)
- **Routing**: Classify input and send to specialized branches (refund vs troubleshooting vs sales)
- **Parallelization**: Split work into independent subtasks or run multiple variants and aggregate results
- **Orchestrator-workers**: Central LLM creates subtasks and delegates to worker LLMs dynamically
- **Evaluator-optimizer**: One LLM produces output, another evaluates and requests improvements in a loop

**Multi-Agent Patterns:**
- **Sequential orchestration**: Fixed pipeline where each agent builds on previous step (generate → review → finalize)
- **Concurrent orchestration**: Agents run in parallel; collector aggregates or selects results (multiple analysis perspectives)
- **Group chat orchestration**: Agents collaborate in shared thread (ideation, quality review, human-in-loop)
- **Handoff orchestration**: Dynamic delegation when agents hit capability limits (triage → specialist → escalation)
- **Magentic orchestration**: Manager agent maintains task ledger of goals/subgoals, invoking specialized agents with tools

### 3. Design Considerations

**Specialization vs. Complexity:**
- Use multiple agents only when specialization improves outcomes
- Each additional agent adds latency and operational overhead
- Default to fewer, more capable agents over many narrow specialists

**Reliability and Resilience:**
- Build in timeouts, retries, and circuit breakers
- Clear error propagation to avoid cascading failures
- Graceful degradation when agents fail

**Security and Least Privilege:**
- Scope each agent's access to data and tools
- Respect identity and permissions across agent boundaries
- Audit trails for all agent actions

**Observability and Debugging:**
- Instrument all agent operations and handoffs
- Log context, tool calls, decisions for analysis
- Enable tracing across entire orchestration flow

## Skill Workflow

### Step 1: Task Analysis

**Analyze the user's task along these dimensions:**

1. **Complexity assessment:**
   - Is this a single-step task or multi-step workflow?
   - Are steps sequential, parallel, or conditional?
   - Does it require dynamic decision-making or follow fixed logic?

2. **Predictability:**
   - Are inputs and outputs well-defined?
   - Is the process repeatable with same steps each time?
   - How much variability exists in execution paths?

3. **Specialization needs:**
   - Would different parts benefit from specialized expertise?
   - Are there distinct roles (generator, reviewer, optimizer)?
   - Do tools/data access requirements differ by step?

4. **Scale and performance:**
   - Is this a one-time task or recurring workflow?
   - What are latency requirements?
   - Does cost optimization matter?

### Step 2: Architecture Recommendation

Based on analysis, provide **2-3 architecture options** with trade-offs:

**For each option, specify:**
- Recommended pattern(s) (workflow vs agent, specific orchestration type)
- Number and roles of agents/components
- Execution flow (sequential, parallel, conditional)
- When this approach excels vs. limitations
- Estimated complexity and cost

**Example format:**

```
OPTION A: Simple Sequential Workflow
- Pattern: Prompt chaining with routing
- Components: Input router → 3 specialized handlers → aggregator
- Execution: Linear pipeline with conditional branching
- Best for: Predictable inputs, well-defined outputs, cost-sensitive
- Limitations: Less flexible for edge cases, requires manual updates for new scenarios

OPTION B: Orchestrator-Workers Agent System
- Pattern: Central orchestrator with dynamic worker delegation
- Components: Orchestrator agent + 4 specialist worker agents + evaluator
- Execution: Orchestrator analyzes task → spawns workers → evaluator reviews → iterate
- Best for: Variable inputs, quality-critical outputs, handles novel scenarios
- Limitations: Higher latency and cost, more complex debugging

OPTION C: Concurrent + Handoff Hybrid
- Pattern: Parallel processing with intelligent routing
- Components: Input analyzer → 3 parallel processors → conflict resolver → handoff specialist
- Execution: Analyze → parallel processing → aggregate → route edge cases to specialist
- Best for: Throughput-critical, some predictability with occasional complexity
- Limitations: More infrastructure to manage, potential for resource contention
```

### Step 3: Architecture Specification

For the **chosen or recommended** option, generate comprehensive specification:

#### 3A. Visual Architecture Diagram

Create ASCII/text diagram showing:
- Agent/component nodes
- Data/control flow edges
- Tool integrations
- Decision points
- Feedback loops

**Example:**
```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR AGENT                       │
│  Role: Analyze task, create plan, delegate to specialists   │
│  Tools: Task decomposer, Progress tracker                   │
└─────────────┬───────────────────────────────────────────────┘
              │
        ┌─────┴─────┬──────────┬──────────┐
        │           │          │          │
┌───────▼──────┐ ┌──▼──────┐ ┌▼────────┐ ┌▼─────────┐
│CODE GENERATOR│ │REVIEWER │ │TESTER   │ │DOCUMENTER│
│Tools: IDE,   │ │Tools:   │ │Tools:   │ │Tools:    │
│Git, Package  │ │Linter,  │ │Test     │ │Markdown, │
│managers      │ │Security │ │runners  │ │Diagrams  │
└──────┬───────┘ └──┬──────┘ └┬────────┘ └┬─────────┘
       │            │          │           │
       └────────────┴──────────┴───────────┘
                    │
              ┌─────▼──────┐
              │ EVALUATOR  │
              │Checks:     │
              │Quality,    │
              │Completeness│
              └────────────┘
```

#### 3B. Agent Role Definitions

For each agent/component, specify:

**Agent Name:** [Descriptive name]
**Primary Role:** [One-sentence purpose]
**Responsibilities:**
- [Specific task 1]
- [Specific task 2]
- [Specific task 3]

**Tools/Capabilities:**
- [Tool/API 1]: [How it's used]
- [Tool/API 2]: [How it's used]

**Inputs:**
- [Input type]: [From where]

**Outputs:**
- [Output type]: [To where]

**Decision Points:**
- [Condition]: [Action A] vs [Action B]

**Error Handling:**
- [Error type]: [Recovery strategy]

#### 3C. Execution Plan

Provide step-by-step execution flow:

**Initialization:**
1. [Setup step]
2. [Validation step]
3. [Resource allocation]

**Main Execution:**
1. **[Agent/Component Name]**
   - Input: [Data/context received]
   - Actions: [What it does]
   - Output: [What it produces]
   - Success criteria: [How to know it worked]
   - Failure handling: [What happens if it fails]

2. **[Next Agent/Component]**
   - [Same structure]

**Aggregation/Completion:**
1. [How results are combined]
2. [Final validation]
3. [Delivery/handoff]

**Monitoring and Observability:**
- [Metrics to track]
- [Logs to capture]
- [Health checks]

#### 3D. Code Scaffolding

Generate executable code structure for the chosen orchestration pattern.

**For workflow-style orchestration:**
```python
# Example: Sequential workflow with routing

class WorkflowOrchestrator:
    def __init__(self):
        self.router = InputRouter()
        self.handlers = {
            'type_a': HandlerA(),
            'type_b': HandlerB(),
            'type_c': HandlerC()
        }
        self.aggregator = ResultAggregator()
    
    def execute(self, input_data):
        """Main execution flow"""
        # Step 1: Route input
        route = self.router.classify(input_data)
        
        # Step 2: Handle based on route
        handler = self.handlers[route]
        result = handler.process(input_data)
        
        # Step 3: Aggregate and validate
        final_output = self.aggregator.combine(result)
        
        return final_output

class InputRouter:
    def classify(self, data):
        """Determine which handler to use"""
        # Classification logic
        pass

class HandlerA:
    def process(self, data):
        """Handle type A inputs"""
        # Processing logic
        pass
```

**For agent-based orchestration:**
```python
# Example: Orchestrator-workers pattern

class OrchestratorAgent:
    def __init__(self):
        self.llm = get_llm_client()
        self.workers = {
            'coder': CoderAgent(),
            'reviewer': ReviewerAgent(),
            'tester': TesterAgent()
        }
        self.task_ledger = TaskLedger()
    
    def execute(self, user_request):
        """Analyze request and orchestrate workers"""
        # Step 1: Decompose into subtasks
        plan = self.llm.generate(
            f"Break down this task into subtasks: {user_request}"
        )
        
        # Step 2: Add to task ledger
        task_ids = self.task_ledger.add_tasks(plan.subtasks)
        
        # Step 3: Delegate to workers
        results = []
        for task_id in task_ids:
            task = self.task_ledger.get_task(task_id)
            worker = self.select_worker(task)
            result = worker.execute(task)
            results.append(result)
            self.task_ledger.mark_complete(task_id, result)
        
        # Step 4: Synthesize final output
        final_output = self.synthesize(results)
        return final_output
    
    def select_worker(self, task):
        """Choose appropriate worker for task"""
        # Selection logic based on task characteristics
        pass

class CoderAgent:
    def execute(self, task):
        """Generate code based on task specification"""
        # Implementation
        pass
```

**Framework integration examples:**

Include code snippets for popular frameworks:
- LangGraph (state graphs, conditional edges)
- CrewAI (agent definitions, tasks, crews)
- Azure Agent Framework (agent registration, handoffs)
- Semantic Kernel (planners, functions, memory)

### Step 4: Implementation Guidance

Provide practical next steps:

**Development sequence:**
1. [What to build first]
2. [How to test incrementally]
3. [When to add complexity]

**Testing strategy:**
- Unit tests: [What to test per component]
- Integration tests: [How to test agent interactions]
- End-to-end tests: [Full workflow validation]

**Monitoring and iteration:**
- Start simple (workflow) → measure → add agency where needed
- Instrument everything from day one
- Track: latency, cost per execution, success rate, error types
- A/B test orchestration strategies if possible

**Common pitfalls to avoid:**
- Over-engineering with too many agents upfront
- Insufficient error handling and retry logic
- Poor observability making debugging impossible
- Tight coupling between agents (use event-driven where possible)
- Ignoring cost implications of agentic approaches

## Output Format

**Always provide:**
1. **Task Analysis Summary** (2-3 sentences)
2. **Architecture Options** (2-3 options with trade-offs)
3. **Recommended Approach** (if you have strong opinion, or mark as "User choice")
4. **Detailed Specification** for chosen/recommended option:
   - Visual architecture diagram
   - Agent role definitions
   - Execution plan
   - Code scaffolding
5. **Implementation Guidance**

**Adapt depth based on context:**
- For exploratory questions: Focus on options and trade-offs
- For concrete implementation: Full specification with code
- For learning/understanding: More explanation of patterns and principles

## Examples

### Example 1: Software Development Task

**User Request:** "Design an agent system to refactor a legacy codebase"

**Task Analysis:**
Complex, multi-phase task requiring specialized expertise at each stage. Mix of predictable (linting, formatting) and unpredictable (architectural decisions) elements. Benefits from both workflow structure and agentic flexibility.

**Architecture Options:**

OPTION A: Sequential Workflow with Manual Review Gates
- Pattern: Prompt chaining with human checkpoints
- Agents: Analyzer → Planner → Refactorer → Tester
- Best for: Risk-averse, critical codebases, learning from initial runs
- Limitations: Slower, requires human availability

OPTION B: Magentic Multi-Agent with Human-in-Loop
- Pattern: Manager maintains task ledger, specialist agents execute
- Agents: Manager + Analyzer + Refactorer + Reviewer + Tester + Documenter
- Best for: Large codebases, can run autonomously with oversight
- Limitations: Higher cost, complex error propagation

**Recommended:** Option B for large projects, Option A for smaller or critical systems

[Continues with full specification...]

### Example 2: Marketing Funnel Automation

**User Request:** "Create an automated lead nurture system"

**Task Analysis:**
Highly repeatable workflow with well-defined paths, but benefits from dynamic content adaptation. Mix of scheduled actions (email sends) and reactive behaviors (engagement scoring).

**Architecture Options:**

OPTION A: Simple Routing Workflow
- Pattern: Lead scoring → segment router → pre-built sequences
- Components: Scorer, Router, 3 email sequence handlers
- Best for: Straightforward funnels, budget-conscious, quick to implement
- Limitations: Less personalization, manual sequence updates

OPTION B: Orchestrator-Workers with Dynamic Content
- Pattern: Central orchestrator analyzes behavior → workers generate/send personalized content
- Agents: Orchestrator + Content Generator + Engagement Analyzer + Sequence Optimizer
- Best for: High-value leads, personalization-critical, complex buyer journeys
- Limitations: Requires more data, higher operational complexity

**Recommended:** Start with Option A, evolve to Option B based on performance data

[Continues with full specification...]

## Integration with Claude Code

When Claude Code invokes this skill:

1. **Parse the user's task** to extract requirements and constraints
2. **Run through the analysis framework** to determine complexity and needs
3. **Generate architecture options** with clear trade-offs
4. **Ask user for choice** if no clear winner (or proceed with recommendation if obvious)
5. **Generate full specification** with all components
6. **Provide executable scaffolding** that Claude Code can immediately use
7. **Surface next steps** for implementation

The skill should make it trivial for Claude Code to go from "I need to solve X" to "Here's exactly how to build it with agents."

## Continuous Improvement

As you use this skill:

**Monitor:**
- Which orchestration patterns work best for which task types
- Common failure modes and how to prevent them
- User satisfaction with architecture recommendations

**Evolve:**
- Add new patterns as they emerge
- Refine decision criteria based on outcomes
- Expand framework support and code examples

**Document:**
- Case studies of successful orchestrations
- Anti-patterns and lessons learned
- Performance benchmarks (cost, latency, quality)

---

**Version:** 1.0  
**Last Updated:** 2025-02-13  
**Maintained by:** Aaraik (AARAIK AI)
