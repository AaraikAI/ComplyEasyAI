---
name: cross-channel-adaptation
description: Reverse-engineer winning content from any channel and intelligently adapt it across all relevant marketing channels (ads, SEO, email, landing pages, social, lead magnets) while preserving the core insight. Generates complete ready-to-use content and coordinates with specialized skills for full execution.
---

# Cross-Channel Adaptation

Transform winning content from one channel into high-performing assets across all relevant channels. This skill reverse-engineers what made content successful, then intelligently adapts it while preserving core insights and optimizing for each channel's unique constraints.

## Core Value Proposition

When you discover a winner—a high-performing SEO article, a converting email sequence, or breakthrough product messaging—this skill ensures that insight propagates across your entire marketing system. Instead of letting wins stay siloed, systematically adapt them to:

- **Paid ads** (Meta, TikTok, Google, LinkedIn)
- **SEO content** (pages, blog posts, topic clusters)
- **Email** (subject lines, sequences, nurture flows)
- **Landing pages** (hero sections, benefits, social proof)
- **Social media** (LinkedIn, Twitter posts)
- **Lead magnets** (titles, hooks, positioning)

## When to Use This Skill

Trigger this skill when:
- "This SEO article is crushing it—turn it into ads"
- "Our email sequence converts at 18%—adapt it for landing pages and social"
- "Take this product messaging and roll it out across all channels"
- "We found a winning angle in ads—create SEO content around it"
- "Repurpose our best content for [channel]"
- User provides high-performing content + wants it adapted elsewhere

## Input Formats (Flexible)

This skill accepts TWO input formats—choose based on what the user provides:

### Format 1: Raw Content + Performance Data

**What to collect:**
- Source content (URL, file, or paste)
- Channel of origin (SEO, email, ads, landing page, etc.)
- Performance metrics (CTR, conversion rate, engagement, ranking)
- Optional: Screenshots, creative assets, full campaign context

**Example:**
```
Source: Blog post "10x Compliance Speed Without Hiring"
Channel: SEO (organic)
Metrics: #1 ranking, 4.2% CTR, 380 conversions/month
URL: example.com/blog/compliance-speed
```

### Format 2: Structured Brief

**What to collect:**
- Core angle/insight (the "why it works")
- Proof points (stats, testimonials, case studies)
- Target audience
- Emotional triggers (fear, aspiration, urgency)
- CTAs and desired outcomes

**Example:**
```
Angle: Speed to compliance as competitive advantage
Proof: "Reduce compliance review from 6 weeks to 3 days"
Audience: Compliance officers at mid-market SaaS
Emotion: Fear of audit failures + aspiration for efficiency
CTA: Book compliance audit
```

### Ask clarifying questions if input is incomplete

If the user provides partial information, ask for:
1. What channel is this from originally?
2. What made this perform well? (metrics, feedback, observations)
3. Which target channels matter most? (or default to "all relevant")

## Core Analysis Process

Before adapting, reverse-engineer the winning formula:

### Step 1: Extract the Core Insight

What ONE thing made this content work?
- **Angle:** The unique perspective or framing (e.g., "compliance as growth enabler not cost center")
- **Promise:** The specific outcome or transformation (e.g., "6 weeks → 3 days")
- **Proof:** The credibility mechanism (case study, data, authority)
- **Emotion:** The primary psychological trigger (fear, aspiration, urgency, belonging)

### Step 2: Identify Structural Patterns

Map the content architecture:
- **Hook:** What grabbed attention first?
- **Problem:** How was pain amplified?
- **Solution:** How was the offering positioned?
- **Proof:** Where did credibility appear? (stats, testimonials, logos)
- **CTA:** What action was requested and how?

### Step 3: Note Performance Indicators

What metrics suggest success?
- High CTR → Strong hook and relevance
- High conversion → Effective proof and CTA
- High engagement → Compelling narrative and value
- High ranking → Search intent match and authority

### Step 4: Determine Target Channels

Based on content type and user goals, auto-select relevant channels:

**If source is SEO content:**
- Meta/TikTok ads (hooks from high-engagement sections)
- Google/LinkedIn ads (title + value prop)
- Email (topic expansion into nurture)
- Social posts (key insights as standalone content)
- Lead magnets (deep-dive on subtopics)

**If source is email sequence:**
- Landing pages (sequence arc → hero/benefits/proof)
- Social posts (each email → standalone insight)
- Ads (subject lines → ad hooks)
- Lead magnets (sequence topic → downloadable)

**If source is product messaging:**
- ALL channels (consistent rollout)

**If source is paid ads:**
- SEO content (expand winning hooks into full articles)
- Landing pages (ad copy → hero section)
- Email (ad narrative → sequence)
- Lead magnets (ad offer → download)

## Channel Adaptation Rules

For each target channel, apply these adaptation principles:

### Meta/TikTok Ads (Hooks, Scripts, Creative Briefs)

**Adaptation strategy:**
- **Hook (first 3 seconds):** Extract the most attention-grabbing insight from source
- **Script (30-60 seconds):** Compress narrative into problem → solution → proof → CTA
- **Creative brief:** Specify visual hook (screenshot, testimonial, founder face-to-camera)

**Character limits:**
- Primary text: 125 characters (visible before "see more")
- Headline: 40 characters
- Description: 30 characters

**Coordinate with DTC-ad-strategy skill:**
When adapting to Meta/TikTok ads, hand off to the `dtc-ad-strategy` skill for:
- Full campaign structure (awareness/consideration/conversion)
- UGC-optimized creative testing roadmap
- Audience targeting and budget allocation

**Output format:**
```
### Meta/TikTok Ad Adaptation

**Hook (3 sec):**
[Attention-grabbing statement or question derived from source]

**Script (45 sec):**
[Problem → Solution → Proof → CTA in conversational tone]

**Creative Brief:**
- Visual: [Screenshot/testimonial/founder speaking]
- Text overlay: [Key stat or quote]
- CTA: [Button text + destination]

**Handoff to dtc-ad-strategy:**
- Core angle: [extracted angle]
- Proof points: [stats, testimonials]
- Target audience: [segment]
```

### Google/LinkedIn Ads (Headlines, Descriptions)

**Adaptation strategy:**
- **Headlines:** Extract value proposition and promise from source
- **Descriptions:** Add proof and CTA within character limits
- **Extensions:** Callouts, sitelinks from supporting points

**Character limits:**
- Headlines: 30 characters (3-15 variations)
- Descriptions: 90 characters (2-4 variations)

**Output format:**
```
### Google/LinkedIn Ad Adaptation

**Headlines (30 chars):**
1. [Value prop from source]
2. [Promise/outcome from source]
3. [Urgency or differentiation]

**Descriptions (90 chars):**
1. [Proof point + CTA]
2. [Social proof + benefit]

**Extensions:**
- Callouts: [Key benefits from source]
- Sitelinks: [Related resources]
```

### SEO Pages (H1s, Intros, CTAs)

**Adaptation strategy:**
- **H1:** Transform core insight into keyword-rich, compelling headline
- **Intro:** Expand hook into problem/promise setup (150-200 words)
- **CTAs:** Adapt original CTAs to SEO context (download, contact, demo)

**Coordinate with SEO content skill:**
When expanding into full SEO pages, this skill provides the strategic foundation, but can hand off to specialized SEO generation if needed.

**Output format:**
```
### SEO Page Adaptation

**H1 (60 chars):**
[Keyword-rich headline preserving core angle]

**Meta Description (155 chars):**
[Promise + proof + keyword inclusion]

**Intro (150-200 words):**
[Problem amplification → solution tease → proof preview → CTA]

**Section Headers (H2/H3):**
1. [Key point 1 from source]
2. [Key point 2 from source]
3. [Proof section header]
4. [CTA section header]

**CTA:**
[Download/contact/demo adapted from source]
```

### Email (Subject Lines, Bodies, Sequences)

**Adaptation strategy:**
- **Subject lines:** Extract curiosity gaps and promises from source
- **Email body:** Adapt narrative arc to email-friendly format (scannable, personal)
- **Sequences:** Break multi-section content into nurture flow

**Coordinate with direct-response skill:**
For complex email sequences with multiple touchpoints, hand off to `direct-response` skill for full funnel optimization.

**Output format:**
```
### Email Adaptation

**Subject Lines (5 variations):**
1. [Curiosity-driven from source insight]
2. [Benefit-driven from source promise]
3. [Urgency-driven from source CTA]
4. [Question-driven from source problem]
5. [Proof-driven from source credibility]

**Email Body:**
[Personal greeting]
[Problem (1-2 sentences from source)]
[Solution (1 paragraph adapted from source)]
[Proof (1 stat or testimonial)]
[CTA (adapted from source)]

**Sequence Structure (if applicable):**
Email 1: [Problem introduction from source]
Email 2: [Solution reveal from source]
Email 3: [Proof and social evidence from source]
Email 4: [CTA and urgency from source]
```

### Landing Pages (Hero, Benefits, Social Proof)

**Adaptation strategy:**
- **Hero:** Transform hook into above-the-fold value prop + visual
- **Benefits:** Extract key points into scannable sections with icons
- **Social Proof:** Adapt testimonials, stats, logos from source

**Coordinate with direct-response and lead-magnet-cro skills:**
For lead magnet landing pages, integrate with `lead-magnet-cro` skill. For conversion-optimized pages, leverage `direct-response` skill's frameworks (AIDA, PAS).

**Output format:**
```
### Landing Page Adaptation

**Hero Section:**
- Headline: [H1 from source angle]
- Subheadline: [Promise from source]
- CTA button: [Primary action from source]
- Hero image: [Visual concept from source]

**Benefits Section:**
1. [Key benefit 1 from source] → Icon: [suggestion]
2. [Key benefit 2 from source] → Icon: [suggestion]
3. [Key benefit 3 from source] → Icon: [suggestion]

**Social Proof:**
- Stat: [Pulled from source]
- Testimonial: [Adapted from source]
- Logos: [If mentioned in source]

**Final CTA:**
[Adapted from source with urgency/scarcity if present]
```

### Social Posts (LinkedIn, Twitter)

**Adaptation strategy:**
- **LinkedIn:** Professional tone, expand insights into thought leadership (1300 chars)
- **Twitter:** Punchy, extract quotable insights (280 chars), thread for depth
- Extract 3-5 standalone insights from source content

**Output format:**
```
### Social Media Adaptation

**LinkedIn Post (1300 chars):**
[Hook from source]
[Key insight expanded with context]
[Proof point or example]
[CTA or question for engagement]

**Twitter Thread:**
Tweet 1: [Hook from source - attention-grabbing]
Tweet 2: [Problem from source]
Tweet 3: [Solution from source]
Tweet 4: [Proof from source]
Tweet 5: [CTA from source]

**Standalone Tweets (280 chars):**
1. [Insight 1 from source]
2. [Insight 2 from source]
3. [Insight 3 from source]
```

### Lead Magnets (Titles, Positioning, Hooks)

**Adaptation strategy:**
- **Title:** Transform core topic into high-value downloadable asset
- **Positioning:** Adapt promise to "get this resource" framing
- **Hook:** Use source proof to build credibility and urgency

**Coordinate with lead-magnet-cro skill:**
For full lead magnet creation (tool, template, guide, calculator), hand off to `lead-magnet-cro` skill with the strategic foundation from this adaptation.

**Output format:**
```
### Lead Magnet Adaptation

**Title:**
[Source topic → "The [Outcome] Playbook/Template/Calculator"]

**Positioning:**
[Value prop from source adapted to downloadable format]

**Landing Page Hook:**
[Proof from source + promise of what's inside]

**Format Recommendation:**
[Interactive tool / Template / Guide / Checklist based on source content type]

**Handoff to lead-magnet-cro:**
- Core topic: [from source]
- Promised outcome: [from source]
- Proof points: [from source]
- Target audience: [from source]
```

## Integration with Existing Skills

This skill acts as a **strategic coordinator** that:
1. Reverse-engineers the winning formula
2. Generates foundational adaptations for all relevant channels
3. Hands off to specialized skills for deep execution

### When to Delegate

**To dtc-ad-strategy:**
- Full Meta/TikTok campaign structure (awareness/consideration/conversion)
- Creative testing roadmaps
- Audience segmentation and budget allocation

**To direct-response:**
- Complex email sequences with psychological frameworks
- Landing page copy with AIDA/PAS optimization
- CRO-focused messaging and A/B test suggestions

**To lead-magnet-cro:**
- Interactive tools, templates, calculators
- Lead magnet landing pages with conversion optimization
- Segmentation by funnel stage

**To positioning-marketing:**
- When adapting product messaging across channels
- When core positioning needs refinement before rollout

### Handoff Format

When delegating to another skill, provide:
```
**Handoff to [skill-name]:**
- Source insight: [core angle extracted]
- Proof points: [stats, testimonials, case studies]
- Target audience: [segment]
- Channel context: [where this will be used]
- Performance benchmark: [original metrics to beat]
```

## Output Structure

Always deliver adaptations in this format:

```markdown
# Cross-Channel Adaptation Report

## Source Analysis

**Original Content:**
- Channel: [SEO / Email / Ads / Landing Page / Product Messaging]
- Performance: [Key metrics]
- URL/Reference: [If applicable]

**Core Insight:**
[The ONE thing that made this work]

**Winning Formula:**
- Angle: [Unique perspective]
- Promise: [Specific outcome]
- Proof: [Credibility mechanism]
- Emotion: [Psychological trigger]

---

## Channel Adaptations

### 1. Meta/TikTok Ads
[Full adaptation with hooks, scripts, creative briefs]
[Handoff to dtc-ad-strategy if needed]

### 2. Google/LinkedIn Ads
[Headlines, descriptions, extensions]

### 3. SEO Pages
[H1s, intros, CTAs]

### 4. Email
[Subject lines, bodies, sequence structure]
[Handoff to direct-response if needed]

### 5. Landing Pages
[Hero, benefits, social proof]
[Handoff to lead-magnet-cro if lead magnet page]

### 6. Social Media
[LinkedIn posts, Twitter threads]

### 7. Lead Magnets
[Titles, positioning, hooks]
[Handoff to lead-magnet-cro for full creation]

---

## Preservation Map

**What Stayed Consistent Across Channels:**
- Core angle: [e.g., "compliance as growth enabler"]
- Key proof point: [e.g., "6 weeks → 3 days"]
- Emotional trigger: [e.g., fear of audit failure]

**What Changed Per Channel:**
- Meta/TikTok: [e.g., compressed to 45-second script, added visual hook]
- SEO: [e.g., expanded to 2000-word article, keyword-optimized]
- Email: [e.g., broken into 4-email nurture sequence]
- Landing Page: [e.g., hero-focused, above-the-fold CTA]

---

## Next Steps

1. **Immediate deployment:** [Which channels to launch first based on resources]
2. **Skill handoffs:** [Which specialized skills to engage for deep execution]
3. **Testing plan:** [How to validate adaptations perform as well as source]
4. **Feedback loop:** [How to feed performance data back to other skills]
```

## Best Practices

### Preserve the Core, Adapt the Format

The winning insight must remain intact across all channels:
- Same angle (perspective/framing)
- Same promise (outcome)
- Same proof points (credibility)
- Same emotional trigger

But format changes radically:
- Ads: Ultra-compressed, attention-first
- SEO: Expanded, keyword-rich, comprehensive
- Email: Personal, scannable, action-oriented
- Social: Punchy, thought-leadership, engagement-driven

### Respect Channel Constraints

Each channel has unique rules:
- **Meta ads:** 125 chars visible, hook in first 3 seconds
- **Google ads:** 30-char headlines, 90-char descriptions
- **SEO:** Keyword inclusion, search intent match, depth
- **Email:** Subject line testing, mobile optimization, unsubscribe compliance
- **Landing pages:** Above-the-fold clarity, single CTA focus
- **Social:** Character limits, native voice, engagement optimization

### Smart Batching Logic

Not every channel is relevant for every source:
- **High-engagement SEO content** → Ads, email, social (extract best insights)
- **Converting email sequences** → Landing pages, social (narrative arc)
- **Product messaging** → ALL channels (consistent rollout)
- **Winning ads** → SEO, landing pages (expand compressed hooks)

Auto-select channels based on source type and user goals. If user specifies "just ads" or "everything but email," respect that.

### Performance Benchmarking

Include performance expectations in adaptations:
- If source SEO content has 4.2% CTR, ads should target similar or better engagement
- If source email converts at 18%, landing page should target 15%+ (accounting for cold traffic)
- Set realistic benchmarks based on channel norms

### Feedback Loop Integration

After adaptations are deployed, capture performance data:
- Which channels outperformed source?
- Which channels underperformed?
- What new insights emerged from adaptations?

Feed this back to:
- **positioning-marketing** (refine core angles)
- **dtc-ad-strategy** (inform creative testing)
- **local-seo-keywords** (expand keyword targeting)
- **lead-magnet-cro** (optimize offers)

## Example Workflows

### Example 1: High-Performing SEO Content → Paid Ads

**Input:**
```
Blog post: "How to Pass SOC 2 Audit in 90 Days (Not 12 Months)"
Metrics: #2 ranking, 5.1% CTR, 420 conversions/month
```

**Output:**
```
### Meta Ad Adaptation

**Hook:** "Most companies take a year to pass SOC 2. We did it in 90 days."

**Script (45 sec):**
"If you're staring down a SOC 2 audit, you've probably been told it takes 12-18 months. False. We helped 47 SaaS companies pass in 90 days or less. Here's the secret: automated evidence collection. Instead of hunting down screenshots and spreadsheets for months, our platform captures everything in real-time. You spend 3 days on setup, not 3 months on manual work. Book a compliance audit to see how fast you can move."

**Creative Brief:**
- Visual: Split screen—left side shows "12 months (traditional)", right side shows "90 days (automated)"
- Text overlay: "47 companies passed SOC 2 in 90 days"
- CTA: "Book Free Audit"

**Handoff to dtc-ad-strategy:**
- Core angle: Speed to compliance through automation
- Proof: 47 companies, 90-day average
- Target audience: SaaS CTOs/compliance officers facing audits
```

### Example 2: Converting Email Sequence → Landing Page

**Input:**
```
Email sequence: "5-Day GrantPilot Crash Course"
Metrics: 23% open rate, 18% click rate, 12% conversion to paid
```

**Output:**
```
### Landing Page Adaptation

**Hero Section:**
- H1: "Write Winning Grant Proposals in 5 Days, Not 5 Weeks"
- Subheadline: "Join 1,200+ nonprofits using AI to 3x their grant success rate"
- CTA: "Start Free Crash Course"
- Hero image: Before/after comparison (manual vs AI-assisted grant writing)

**Benefits Section:**
1. **Day 1:** Learn the grant research framework → Icon: Magnifying glass
2. **Day 2:** Master the AI proposal builder → Icon: Robot
3. **Day 3:** Optimize your budget narrative → Icon: Chart
4. **Day 4:** Nail the program description → Icon: Document
5. **Day 5:** Submit with confidence → Icon: Checkmark

**Social Proof:**
- Stat: "1,200+ nonprofits funded"
- Testimonial: "We won $480K in grants our first year using GrantPilot" - Sarah Chen, Education Forward
- Logos: [Major foundations funded]

**Final CTA:**
"Start the 5-day crash course and write your first AI-assisted proposal this week."
```

### Example 3: Product Messaging → All Channels

**Input:**
```
Product messaging: "ComplyEasyAI—Compliance that Scales with You"
Context: Launching new autonomous compliance platform
```

**Output:**
```
[Generates adaptations for all 7 channels with consistent angle: "autonomous compliance that scales" but optimized formatting for each—compressed for ads, expanded for SEO, personalized for email, visual for landing pages, thought-leadership for social, downloadable for lead magnets]

**Preservation Map:**
- Angle: "Compliance as a scaling enabler, not bottleneck"
- Promise: "Grow without hiring a compliance team"
- Proof: "Autonomous system handles 90% of compliance work"
- Emotion: Fear of audit failure + aspiration for efficient growth

[Full adaptations follow for each channel...]
```

## Conclusion

Cross-channel adaptation ensures winning insights propagate across your entire marketing system. By reverse-engineering what worked, preserving the core insight, and intelligently adapting format and structure per channel, you multiply the value of every win.

This skill acts as the connective tissue between discovery (finding winners) and systematic rollout (making winners work everywhere), coordinating with specialized skills (dtc-ad-strategy, direct-response, lead-magnet-cro) for deep execution while maintaining strategic coherence across all channels.
