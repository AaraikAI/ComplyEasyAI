---
name: positioning-marketing
description: Generate positioning statements, angles, and complete marketing assets (landing pages, email sequences, ad copy) for AI agent services and products. Reads project context, prompts for missing details, and creates tailored messaging for B2B decision-makers, startups, and enterprise audiences.
---

# Positioning & Marketing Asset Generator

This skill helps solopreneurs and consultants position their AI agent services and generate complete marketing assets based on strategic positioning frameworks.

## Core Workflow

1. **Analyze Project Context** - Read all available project files (PRDs, documentation, code, features)
2. **Gather Missing Details** - Prompt user for information not found in project files
3. **Generate Positioning Angles** - Create 3-5 strategic positioning options
4. **Create Marketing Assets** - Produce landing page copy, email sequences, and ad copy
5. **Tailor for Audiences** - Adapt messaging for B2B decision-makers, startups, and enterprise

## Step 1: Analyze Project Context

**Read all project files systematically:**

```bash
# Start from current directory
view .

# Read key files that describe the product/service:
# - PRD documents (PRODUCT.md, PRD.md, README.md)
# - Feature documentation
# - Technical documentation
# - Any business or marketing docs
```

**Extract critical information:**
- **What it does**: Core functionality, features, capabilities
- **How it works**: Technical approach, architecture, unique methods
- **Value delivered**: Problems solved, outcomes achieved
- **Target users**: Who benefits, current audience assumptions
- **Differentiators**: Unique aspects, technical advantages

**Create initial summary:**

Document what you found:
```
Product/Service: [name and brief description]
Core Features: [list key capabilities]
Technical Approach: [how it works]
Value Proposition: [outcomes/benefits mentioned]
Current Positioning: [any existing messaging found]
Gaps: [information needed from user]
```

## Step 2: Gather Missing Details

**Use ask_user_input_v0 tool to systematically collect positioning inputs.**

Gather information in structured rounds to build comprehensive positioning foundation.

### Round 1: Competitive Landscape Analysis

**CRITICAL**: Understanding competition is essential for differentiation. Ask users to identify:

Use ask_user_input_v0 with these questions:

**Question 1: "Who are your top 3 direct competitors?"**
- Type: multi_select or text input
- Options: Provide common competitors if known, or ask for names
- Purpose: Identify who you're positioning against

**Question 2: "What do prospects currently use instead of your solution?"**
- Type: multi_select
- Options: ["Competitor products", "Manual processes", "In-house tools", "Consulting services", "Nothing (unmet need)"]
- Purpose: Understand alternative solutions and status quo

**Question 3: "What do your competitors emphasize in their positioning?"**
- Type: multi_select
- Options: ["Speed/efficiency", "Cost savings", "Ease of use", "Enterprise features", "Technical depth", "Integration breadth", "Customer support"]
- Purpose: Find whitespace and differentiation opportunities

After gathering this, create a **Competitive Positioning Matrix**:

```
COMPETITOR ANALYSIS MATRIX

| Competitor | Their Key Message | Their Strength | Their Weakness | Your Advantage |
|------------|-------------------|----------------|----------------|----------------|
| [Name 1]   | [What they say]   | [What they do well] | [Gap/weakness] | [How you're better] |
| [Name 2]   | [What they say]   | [What they do well] | [Gap/weakness] | [How you're better] |
| Manual     | N/A              | Flexible, no cost | Slow, error-prone | [Your automation value] |
```

### Round 2: Customer Validation & Proof Points

**Ask for real customer data to make positioning credible:**

**Question 1: "Do you have any customer success stories or testimonials?"**
- Type: single_select
- Options: ["Yes, I have testimonials to share", "Yes, but need to get permission to use", "Have customers but no testimonials yet", "Pre-launch, no customers yet"]
- Purpose: Determine availability of social proof

**If user has testimonials/stories, ask:**
"Can you share 1-2 customer testimonials or success metrics? (e.g., 'Reduced X by 50%', 'Saved 10 hours per week')"

**Question 2: "What measurable outcomes have customers achieved?"**
- Type: multi_select
- Options: ["Time savings", "Cost reduction", "Revenue increase", "Error reduction", "Faster time-to-value", "Higher completion rates"]
- Purpose: Identify quantifiable benefits for positioning

**Question 3: "Why do customers choose you over alternatives?"**
- Ask for actual win/loss insights if available
- Purpose: Discover real differentiation, not assumed

### Round 3: Target Audience Deep-Dive

**Question 1: "Who is your primary target buyer?"**
- Type: single_select
- Options: ["Technical decision-maker (CTO, VP Eng)", "Business decision-maker (CEO, CFO, COO)", "Department leader (VP Sales, VP Marketing)", "Individual contributor/practitioner", "Multiple stakeholders (committee buy)"]
- Purpose: Tailor messaging to decision-maker type

**Question 2: "What company size/stage are you targeting?"**
- Type: multi_select
- Options: ["Startups (1-50 employees)", "Growth stage (50-500)", "Mid-market (500-2000)", "Enterprise (2000+)"]
- Purpose: Adjust sophistication and scale messaging

**Question 3: "What are the top 3 pain points your target experiences?"**
- Ask user to rank these
- Purpose: Prioritize benefit messaging

### Round 4: Brand Voice & Style

**Question 1: "How would you describe your brand voice?"**
- Type: multi_select (max 3)
- Options: ["Professional/Corporate", "Casual/Conversational", "Technical/Expert", "Bold/Disruptive", "Friendly/Approachable", "Premium/Sophisticated"]
- Purpose: Calibrate copy tone

**Question 2: "Any messaging to avoid or constraints?"**
- Type: multi_select
- Options: ["Avoid overpromising", "No aggressive competitor comparisons", "Keep it simple (avoid jargon)", "Enterprise-appropriate only", "Must emphasize security/compliance", "Stay humble (no hype)"]
- Purpose: Set guardrails for messaging

### Round 5: Business Context

**Question 1: "What's your pricing strategy?"**
- Type: single_select
- Options: ["Premium (high-value, high-price)", "Value (competitive pricing)", "Freemium (free tier + paid)", "Usage-based (pay as you go)", "Enterprise (custom pricing)"]
- Purpose: Align positioning with pricing

**Question 2: "What's your go-to-market approach?"**
- Type: single_select
- Options: ["Self-serve (product-led)", "Sales-led (demo/trial to close)", "Hybrid (PLG with sales assist)", "Channel/partner-driven"]
- Purpose: Optimize CTAs and funnel messaging

### Synthesize Gathered Information

After all rounds, create a structured summary:

```
POSITIONING INPUTS SUMMARY

COMPETITIVE LANDSCAPE:
- Direct Competitors: [list]
- Alternative Solutions: [list]
- Competitor Positioning: [key themes]
- Whitespace Opportunity: [your differentiation angle]

CUSTOMER VALIDATION:
- Testimonials Available: [yes/no/pending]
- Proven Outcomes: [list with metrics]
- Win Reasons: [why customers choose you]

TARGET AUDIENCE:
- Primary Buyer: [role/title]
- Company Size: [stage/employee count]
- Top Pain Points: [ranked list]

BRAND & STYLE:
- Voice: [selected attributes]
- Constraints: [must-avoid elements]

BUSINESS CONTEXT:
- Pricing: [strategy]
- GTM: [approach]
- Must-Emphasize: [key themes]
```

**Important**: If user cannot provide competitive analysis or customer validation, document assumptions clearly and flag for validation in final output.

## Step 3: Generate Positioning Angles

**Create 3-5 distinct positioning angles using proven frameworks.**

### Positioning Framework Reference

A strong positioning statement answers:
- **For whom?** Clearly defined target segment
- **What problem?** Specific pain or outcome
- **What solution?** Category and approach
- **Why better?** Unique differentiation vs. alternatives

### Positioning Angle Types

**1. Benefit-Based (Most Durable)**
Focus on the outcome or experience delivered.
- Example: "Halve your compliance workload without hiring additional staff"
- Best when: Outcome is measurable and emotionally resonant

**2. Attribute-Based**
Emphasize specific technical features or capabilities.
- Example: "AI agents with 10x faster deployment than traditional automation"
- Best when: Technical advantage is significant and defensible

**3. Challenger/Head-to-Head**
Directly contrast dominant competitors or status quo.
- Example: "Enterprise-grade AI orchestration at startup prices"
- Best when: Clear incumbent exists and you have proof of superiority

**4. Job-to-Be-Done**
Position around the underlying task users hire the product to accomplish.
- Example: "Turn messy SOPs and APIs into an always-on ops agent in a weekend"
- Best when: Users struggle with a specific workflow transformation

**5. Audience/Identity-Based**
Target specific personas or industries.
- Example: "Compliance automation built specifically for fintech companies"
- Best when: Segment has unique needs and high willingness to pay

**6. Price/Value**
Lead with cost-efficiency or premium quality.
- Example: "The most accurate AI compliance system, trusted by Fortune 500"
- Best when: Price is a primary decision factor or quality commands premium

### Generate Multiple Angles

**Create 3-5 positioning statements, each using a different angle.**

Format each as:

```
ANGLE: [Type - e.g., Benefit-Based]

POSITIONING STATEMENT:
For [target customer]
Who [problem/need]
Our [product/service] is a [category]
That [key benefit]
Unlike [alternatives]
We [unique differentiation]

WHY THIS WORKS:
[Explain the strategic reasoning]

WHAT IT PRIORITIZES:
[What this angle emphasizes]

TRADE-OFFS:
[What this angle downplays or sacrifices]

BEST FOR:
[When to use this positioning]
```

**Example:**

```
ANGLE: Benefit-Based + Job-to-be-Done

POSITIONING STATEMENT:
For B2B SaaS companies with complex compliance requirements
Who spend weeks manually auditing code and documentation
ComplyEasyAI is an autonomous compliance operating system
That reduces audit prep from weeks to hours
Unlike manual processes or generic automation tools
We understand both code-level compliance and regulatory frameworks

WHY THIS WORKS:
- Outcome is concrete and measurable (weeks → hours)
- Addresses specific pain of audit prep
- Implies deep domain expertise

WHAT IT PRIORITIZES:
Time savings, compliance expertise, automation quality

TRADE-OFFS:
Doesn't emphasize pricing, breadth of integrations, or ease of setup

BEST FOR:
Companies facing imminent audits or ongoing compliance burden
```

## Step 4: Create Marketing Assets

**For EACH positioning angle, generate complete marketing assets.**

### Apply Brand Voice & Style

Before writing copy, apply the brand voice attributes gathered in Step 2:

**Voice Calibration Guide:**

**Professional/Corporate:**
- Tone: Authoritative, credible, measured
- Language: Industry-standard terminology, clear structure
- Avoid: Slang, excessive enthusiasm, casual phrases
- Example: "Reduce audit preparation time by 95% through automated compliance analysis"

**Casual/Conversational:**
- Tone: Friendly, approachable, relatable
- Language: Simple words, contractions, second-person ("you")
- Avoid: Jargon, overly formal structure
- Example: "Stop wasting weeks on audit prep. We'll do it in hours."

**Technical/Expert:**
- Tone: Precise, detail-oriented, sophisticated
- Language: Technical accuracy, specific terminology, methodology focus
- Avoid: Oversimplification, vague benefits
- Example: "Forensic codebase analysis using AST parsing and data lineage tracking"

**Bold/Disruptive:**
- Tone: Confident, provocative, challenger mindset
- Language: Strong claims, direct comparisons, "old way vs. new way"
- Avoid: Timid language, hedging, corporate-speak
- Example: "Compliance tools lie to you. We tell the truth about your code."

**Friendly/Approachable:**
- Tone: Warm, helpful, empathetic
- Language: Acknowledge pain, offer support, collaborative framing
- Avoid: Corporate distance, aggressive selling
- Example: "We know audit season is stressful. Let us handle the heavy lifting."

**Premium/Sophisticated:**
- Tone: Refined, exclusive, high-standards
- Language: Quality emphasis, discerning buyer focus, craftsmanship
- Avoid: Commodity positioning, price focus, mass market appeal
- Example: "The most accurate compliance intelligence for discerning engineering leaders"

**Apply Selected Voice:**
- Reference the brand voice attributes from Step 2 (Round 4)
- Adjust headline style, word choice, and tone across all copy
- Maintain consistency while adapting to each channel's norms
- Balance brand voice with channel best practices (e.g., LinkedIn slightly more professional)

**Respect Messaging Constraints:**
- Review the "must-avoid" items from Step 2
- Check each piece of copy against constraints before finalizing
- Flag any areas where positioning conflicts with constraints

### Asset Types to Create

1. **Landing Page Copy**
   - Hero headline and subheadline
   - Value proposition section
   - Feature/benefit bullets (3-5)
   - Social proof section
   - Call-to-action

2. **Email Sequence (3 emails)**
   - Email 1: Cold outreach / problem awareness
   - Email 2: Solution introduction / value demonstration
   - Email 3: Call to action / next steps

3. **Ad Copy**
   - LinkedIn ad (headline + body)
   - Google Search ad (headline + description)
   - Short-form social (Twitter/X style)

### Landing Page Structure

```
LANDING PAGE - [Angle Name]

=== HERO SECTION ===
Headline: [Outcome-focused, 8-12 words]
Subheadline: [Clarify who it's for and core benefit, 15-25 words]
CTA Button: [Action-oriented, 2-4 words]

=== VALUE PROPOSITION ===
[2-3 paragraphs explaining how life changes for the user]
- Focus on outcomes, not mechanics
- Use specific, concrete language
- Address skepticism or objections

=== KEY BENEFITS ===
Benefit 1: [Headline]
[2-3 sentences explaining the benefit and why it matters]

Benefit 2: [Headline]
[2-3 sentences]

Benefit 3: [Headline]
[2-3 sentences]

=== SOCIAL PROOF ===
[Customer quote or metric]
- "[Testimonial or result]" - [Person, Company]

=== FINAL CTA ===
[Urgency or incentive]
Button: [Action]
```

**Example Landing Page:**

```
LANDING PAGE - Benefit-Based Angle

=== HERO SECTION ===
Headline: Cut Compliance Prep from Weeks to Hours
Subheadline: AI-powered compliance automation that audits your entire codebase, generates documentation, and prepares audit-ready reports—without hiring additional staff.
CTA Button: Get Your Free Audit

=== VALUE PROPOSITION ===
Your engineering team builds fast. Your compliance team can't keep up. Manual code reviews, documentation updates, and audit prep consume weeks of expensive engineering time right when you need to ship.

ComplyEasyAI autonomously audits your codebase against SOC 2, ISO 27001, HIPAA, and other frameworks. It generates forensic-level documentation, identifies gaps before auditors do, and maintains continuous compliance as your code evolves.

Companies using ComplyEasyAI reduce audit prep from 3-4 weeks to 2-3 hours, pass audits on first submission, and free their engineers to focus on product.

=== KEY BENEFITS ===

Forensic-Level Code Analysis
Our AI doesn't just scan for keywords—it understands code architecture, data flows, and security patterns. It catches compliance issues that human reviewers miss and explains violations in plain English.

Automated Documentation Generation
Stop manually maintaining compliance docs that go stale the moment code changes. ComplyEasyAI generates and updates audit-ready documentation automatically as your codebase evolves.

Multi-Framework Coverage
One system handles SOC 2, ISO 27001, HIPAA, GDPR, and custom compliance requirements. No need to juggle multiple tools or vendors.

=== SOCIAL PROOF ===
"We went from dreading audits to passing SOC 2 on first submission. ComplyEasyAI found gaps our manual process missed and cut our prep time by 90%."
- Sarah Chen, CTO, FinanceFlow

=== FINAL CTA ===
See what compliance gaps exist in your codebase today.
Button: Run Free Compliance Audit
```

### Email Sequence Structure

```
EMAIL SEQUENCE - [Angle Name]

=== EMAIL 1: PROBLEM AWARENESS ===
Subject: [Hook about pain point]

[Opening - establish relevance]
[Agitate the problem]
[Ask resonating question]
[Soft CTA - link to resource or reply]

---

=== EMAIL 2: SOLUTION INTRODUCTION ===
Subject: [Promise transformation]

[Acknowledge their situation]
[Introduce solution concept]
[Show how it works / proof points]
[CTA - demo, case study, or trial]

---

=== EMAIL 3: CALL TO ACTION ===
Subject: [Urgency or benefit reminder]

[Recap value]
[Remove objection/friction]
[Clear next step]
[Strong CTA]
```

**Example Email Sequence:**

```
EMAIL SEQUENCE - Benefit-Based Angle

=== EMAIL 1: PROBLEM AWARENESS ===
Subject: Your engineers shouldn't be doing compliance work

Hi [Name],

I noticed [Company] is hiring for [role/funding stage/recent news]. That usually means compliance audits are around the corner.

Most engineering teams lose 3-4 weeks to audit prep right when they need to be shipping. Worse, manual code reviews miss critical compliance gaps that auditors catch—forcing expensive remediation under time pressure.

Does your team dread compliance season?

If so, I built something that might help. Would you be open to a quick overview?

Best,
[Your name]

---

=== EMAIL 2: SOLUTION INTRODUCTION ===
Subject: What if compliance audits took hours, not weeks?

Hi [Name],

Quick context: ComplyEasyAI is an autonomous compliance system that audits codebases at a forensic level.

Instead of engineers manually reviewing thousands of files, our AI:
- Analyzes your entire codebase for SOC 2, ISO 27001, HIPAA compliance
- Generates audit-ready documentation automatically
- Identifies gaps before auditors do

One FinTech CTO reduced their audit prep from 4 weeks to 3 hours. Passed SOC 2 on first submission.

Want to see what compliance gaps exist in your codebase? I can run a free audit this week.

Interested?

Best,
[Your name]

---

=== EMAIL 3: CALL TO ACTION ===
Subject: Last call - free compliance audit for [Company]

Hi [Name],

I'm running free compliance audits this week for companies preparing for SOC 2 or ISO 27001.

Takes about 30 minutes to set up, and you'll get:
✓ Full report of compliance gaps in your codebase
✓ Prioritized remediation recommendations
✓ Estimate of audit prep time (current vs. with automation)

No obligation. If it's useful, great. If not, you still have the audit report.

Have 15 minutes Thursday or Friday?

Best,
[Your name]
```

### Ad Copy Structure

```
AD COPY - [Angle Name]

=== LINKEDIN AD ===
Headline: [8-10 words, benefit-focused]
Body: [2-3 sentences, problem → solution → CTA]
CTA Button: [Action verb]

=== GOOGLE SEARCH AD ===
Headline 1: [30 chars max, include keyword]
Headline 2: [30 chars max, benefit]
Headline 3: [30 chars max, differentiation]
Description: [90 chars max, value prop + CTA]

=== SHORT-FORM SOCIAL (Twitter/X) ===
[280 chars or less, hook → insight → CTA]
```

**Example Ad Copy:**

```
AD COPY - Benefit-Based Angle

=== LINKEDIN AD ===
Headline: Cut Compliance Audit Prep from Weeks to Hours
Body: Engineering teams lose weeks to manual compliance reviews. ComplyEasyAI autonomously audits your codebase, generates documentation, and catches gaps before auditors do. FinTech companies are passing SOC 2 on first submission.
CTA Button: Get Free Audit

=== GOOGLE SEARCH AD ===
Headline 1: SOC 2 Compliance Automation
Headline 2: Audit Prep in Hours, Not Weeks
Headline 3: AI-Powered Code Analysis
Description: Automated compliance audits for SOC 2, ISO 27001, HIPAA. Free codebase scan. Pass audits faster.

=== SHORT-FORM SOCIAL ===
Your engineers shouldn't spend 4 weeks doing compliance work.

ComplyEasyAI audits entire codebases in hours, generates audit-ready docs, and catches gaps human reviewers miss.

One fintech CTO: "Passed SOC 2 on first submission. 90% time savings."

Free audit → [link]
```

## Step 5: Tailor for Multiple Audiences

**Create audience-specific variations of the top 2 positioning angles.**

For each audience segment (B2B decision-makers, startups, enterprise), adjust:

1. **Language & Tone**
   - B2B Decision-makers: ROI-focused, risk mitigation, efficiency
   - Startups: Speed, scrappiness, competitive advantage
   - Enterprise: Security, scalability, vendor reliability

2. **Pain Points Emphasized**
   - B2B: Resource constraints, time-to-value
   - Startups: Speed to market, capital efficiency
   - Enterprise: Compliance risk, audit readiness, vendor management

3. **Proof Points**
   - B2B: Time savings, cost reduction
   - Startups: Fast deployment, lean team enablement
   - Enterprise: Security certifications, enterprise customers

**Format:**

```
AUDIENCE VARIATION: [Audience Type]

ADJUSTED POSITIONING:
[Modified positioning statement]

KEY MESSAGING CHANGES:
- [What changed and why]
- [Emphasis shifts]
- [Different proof points]

HERO HEADLINE VARIATION:
[Audience-specific headline]

VALUE PROP ADJUSTMENT:
[Modified value prop paragraph]
```

## Output Format

**Deliver complete positioning package:**

```markdown
# Positioning & Marketing Assets for [Product Name]

## Executive Summary
[2-3 sentence overview of recommended positioning and key findings]

## Project Analysis Summary

### What We're Building
[Product name, category, core value proposition from docs]

### Key Features & Capabilities
[Bullet list of main features]

### Current State
- Documentation available: [what exists]
- Existing messaging: [found/not found]
- Customer validation: [testimonials available/pending/none]

## Competitive Intelligence

### Competitive Positioning Matrix

| Competitor | Their Positioning | Strength | Weakness | Our Advantage |
|------------|-------------------|----------|----------|---------------|
| [Name] | [What they claim] | [What they do well] | [Their gap] | [How we win] |
| Manual alternative | N/A | [Why people use it] | [Why it fails] | [Our automation] |

### Market Whitespace
[Opportunities we identified where competitors aren't focused]

### Positioning Strategy Against Competition
[How we'll differentiate based on competitive analysis]

## Customer Validation & Proof Points

### Available Testimonials
[Actual customer quotes if provided, or note "Pending - will need real testimonials"]

### Proven Outcomes
[Measurable results customers have achieved, or projected outcomes based on product capabilities]

### Why Customers Choose Us
[Win reasons from user input or assumptions to validate]

## Brand Voice & Guidelines

### Selected Brand Voice
[Attributes chosen in Step 2]

### Tone Examples
- Do: [Example of on-brand language]
- Don't: [Example of off-brand language]

### Messaging Constraints
[Must-avoid items flagged by user]

## Positioning Angles

### Angle 1: [Type]
[Full positioning statement + rationale]

#### Marketing Assets - Angle 1
[Complete landing page]
[Complete email sequence]
[Complete ad copy set]

---

### Angle 2: [Type]
[Full positioning statement + rationale]

#### Marketing Assets - Angle 2
[Complete landing page]
[Complete email sequence]
[Complete ad copy set]

---

### Angle 3: [Type]
[Full positioning statement + rationale]

#### Marketing Assets - Angle 3
[Complete landing page]
[Complete email sequence]
[Complete ad copy set]

---

## Audience-Specific Variations

### For B2B Decision-Makers
[Adjusted positioning + key message variations for top 2 angles]

### For Startups
[Adjusted positioning + key message variations for top 2 angles]

### For Enterprise
[Adjusted positioning + key message variations for top 2 angles]

---

## Recommended Approach

**Top positioning angle:** [Which one and why]
**Best for:** [Context where this positioning excels]
**Testing suggestion:** [How to validate with real prospects]

## Validation Methodology

**CRITICAL**: This positioning is based on analysis and assumptions. Validate with real market feedback before full rollout.

### Phase 1: Quick Validation (Week 1-2)

**Message Testing:**
1. Share hero headlines with 5-10 target prospects (email or LinkedIn)
2. Ask: "Which of these resonates most with your situation?"
3. Track which angle gets strongest response

**Competitor Validation:**
- Visit competitor websites and confirm positioning analysis
- Review their customer testimonials to understand their proof points
- Verify our differentiation claims are accurate and defensible

**Customer Interview:**
- If you have customers, interview 3-5 about:
  - How they describe your product to colleagues
  - What made them choose you over alternatives
  - What outcomes they've achieved
- Use their language to refine messaging

### Phase 2: Market Testing (Week 3-6)

**A/B Test Landing Pages:**
- Create 2 versions: Angle 1 vs. Angle 2
- Drive 100+ visitors to each
- Measure: Time on page, CTA clicks, conversions

**Email Campaigns:**
- Send different positioning angles to separate prospect segments
- Measure: Open rates, reply rates, meeting booking rates
- Sample size: 50-100 prospects per angle

**LinkedIn Ads:**
- Run small budget campaigns ($500 per angle)
- Test different value propositions
- Measure: CTR, cost per demo, quality of leads

### Phase 3: Sales Validation (Ongoing)

**Demo Call Testing:**
- Lead with different positioning in sales conversations
- Track which positioning creates fastest "aha moment"
- Note which objections each angle triggers

**Close Rate Analysis:**
- Track win rates by positioning approach used
- Analyze win/loss reasons
- Refine positioning based on what actually closes deals

### Validation Checklist

Before committing to positioning, validate:

- [ ] Target prospects confirm pain point is urgent
- [ ] Differentiation claims are accurate vs. competitors
- [ ] Proof points are credible and verifiable
- [ ] Messaging resonates emotionally (not just rationally)
- [ ] Sales team can articulate positioning clearly
- [ ] Positioning aligns with product roadmap
- [ ] Brand voice feels authentic, not forced
- [ ] CTAs generate actual conversions (not just interest)

### Red Flags to Watch For

**If prospects say:**
- "That sounds like [Competitor]" → Differentiation unclear
- "I don't really have that problem" → Pain point mismatch
- "That seems too good to be true" → Overclaiming, need proof
- "This is for companies bigger/smaller than us" → Audience mismatch

**If data shows:**
- High engagement but low conversion → Messaging attracts wrong audience
- Low engagement → Positioning not compelling enough
- High abandonment at pricing → Value not justified
- Lots of questions about basics → Positioning too abstract

### Iteration Plan

**Based on validation results:**

**If Angle 1 wins clearly (>20% better metrics):**
- Double down on winning angle
- Create more variations and assets
- Optimize messaging within that framework

**If results are mixed:**
- Consider audience-specific positioning (different angles for different segments)
- Refine hybrid approach
- Test combinations of elements

**If none resonate:**
- Return to customer interviews
- Challenge core assumptions about pain points and differentiation
- Consider whether product-market fit is the real issue

**Success Criteria:**
- Email open rates >30%
- Demo booking rate >10% of emails
- Landing page conversion >3%
- Sales cycle length stabilizes
- Customer testimonials validate messaging
```

## Best Practices

### Writing Effective Positioning

1. **Be specific, not generic**
   - Bad: "We help companies with AI"
   - Good: "AI compliance automation that cuts SOC 2 prep from weeks to hours"

2. **Focus on outcomes, not features**
   - Bad: "Advanced code analysis algorithms"
   - Good: "Catch compliance gaps before auditors do"

3. **Use concrete language**
   - Bad: "Leverage synergies"
   - Good: "Reduce audit prep by 90%"

4. **Address real pain**
   - Bad: "Innovative compliance solution"
   - Good: "Stop losing engineering weeks to manual compliance reviews"

### Creating Compelling Marketing Copy

1. **Hero headlines should promise transformation**
   - Use numbers when possible: "3 weeks → 3 hours"
   - Lead with outcome: "Pass SOC 2 on First Submission"
   - Avoid jargon: Say "compliance" not "regulatory adherence mechanisms"

2. **Value props should show how life changes**
   - Before/after contrast
   - Specific examples
   - Remove skepticism

3. **CTAs should reduce friction**
   - "Get Free Audit" > "Contact Sales"
   - "See Your Compliance Gaps" > "Request Demo"
   - "Run Analysis Now" > "Learn More"

4. **Social proof should be specific**
   - Bad: "Our customers love us"
   - Good: "Passed SOC 2 on first submission. Cut prep time by 90%."

### Multi-Audience Messaging

1. **Understand buying triggers differ**
   - Startups: Speed, capital efficiency, competitive edge
   - Mid-market: ROI, time savings, risk reduction
   - Enterprise: Security, compliance, vendor reliability

2. **Adjust proof points**
   - Startups want lean team enablement
   - Enterprise wants security certifications

3. **Maintain core positioning**
   - Same differentiation, different emphasis
   - Same category, different language

## Common Pitfalls to Avoid

1. **Don't try to be everything to everyone**
   - Pick 1-2 primary positions
   - Create variations, not entirely different stories

2. **Don't lead with features**
   - Start with outcome
   - Features support the benefit claim

3. **Don't ignore alternatives**
   - Positioning requires understanding "vs. what?"
   - Address competitive context explicitly

4. **Don't write in corporate speak**
   - Avoid: "Leverage best-in-class solutions"
   - Use: "Cut audit prep from weeks to hours"

5. **Don't forget the human**
   - B2B buyers are humans with frustrations
   - Acknowledge pain, show empathy, offer relief

## Final Deliverable Checklist

Before presenting to user, ensure you've created:

- ✓ 3-5 distinct positioning angles with full rationale
- ✓ Complete landing page copy for each angle
- ✓ 3-email sequence for each angle
- ✓ LinkedIn, Google, and social ad copy for each angle
- ✓ Audience-specific variations (B2B, startup, enterprise) for top 2 angles
- ✓ Clear recommendation on which positioning to lead with
- ✓ Testing/validation suggestions

---

## Usage Notes

This skill is designed to be called from within a project directory. It will:
1. Read all available documentation and code
2. Prompt for missing strategic details
3. Generate comprehensive positioning and marketing assets
4. Deliver production-ready copy you can deploy immediately

The output should require minimal editing—you approve and deploy.
