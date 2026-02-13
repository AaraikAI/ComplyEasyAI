---
name: dtc-ad-strategy
description: Generate complete Meta/TikTok ad campaign strategies for DTC/ecommerce products with full-funnel structure, UGC-optimized creative testing roadmaps, and systematic performance frameworks. Integrates with positioning-marketing for angles, direct-response for offers, and lead-magnet-cro for retargeting assets.
---

# DTC Ad Strategy Skill

## When to Use This Skill

**Trigger this skill when users request:**
- "Create a Meta/TikTok ad strategy for [product]"
- "Generate UGC ad scripts and hooks for [brand]"
- "Build a full-funnel creative testing roadmap"
- "Design a paid social campaign for [DTC product]"
- "Optimize our ad account structure for [ecommerce brand]"
- Any request involving DTC advertising, paid social strategy, or performance creative

**Do NOT use this skill for:**
- Organic social content (use positioning-marketing or direct-response instead)
- SEO content (use local-seo-keywords skill)
- Landing page copy alone (use lead-magnet-cro or direct-response)
- Brand strategy without media execution

---

## Skill Integration Architecture

This skill is designed to work seamlessly with your existing growth skills:

### Input Dependencies
1. **positioning-marketing**: Pull brand positioning, target audience insights, and strategic angles
2. **direct-response**: Leverage offer frameworks, CTA structures, and conversion tactics
3. **lead-magnet-cro**: Connect lead magnets as retargeting hooks and mid-funnel assets

### Workflow Sequence
```
User Request → Check for existing positioning/offers
            ↓
    Read positioning-marketing outputs (if available)
            ↓
    Read direct-response frameworks (if available)
            ↓
    Read lead-magnet outputs (if available)
            ↓
    Generate DTC Ad Strategy Document
            ↓
    Output: Complete campaign strategy with creative assets
```

---

## Core Execution Workflow

### Step 1: Discovery & Context Gathering

**Ask the user to provide OR locate from previous work:**
- Product name and category
- Current revenue stage (pre-$1M, $1M-$10M, $10M+)
- Target audience and positioning (check positioning-marketing skill outputs first)
- Existing offer/discount strategy (check direct-response outputs first)
- Lead magnets or mid-funnel assets (check lead-magnet-cro outputs first)
- Platform priorities (Meta, TikTok, both?)
- Budget range and CAC targets (if known)

**If positioning or offers exist from previous skills:**
- Read those files/outputs FIRST
- Extract positioning angles, audience segments, and unique value props
- Build on existing offer frameworks rather than creating from scratch

**If no previous work exists:**
- Conduct brief positioning interview (who, what, why now?)
- Define 2-3 core angles based on product benefits
- Establish baseline offer structure (trial, discount, bundle?)

---

### Step 2: Strategic Foundation

#### 2.1 Full-Funnel Campaign Architecture

Structure the account into three tiers:

**PROSPECTING (Cold Audiences)**
- Objective: Net new customer acquisition
- Targeting: Broad interest/behavioral or advantage+ with strong creative
- Creative focus: Scroll-stopping hooks, pattern interrupts, bold claims
- Success metric: Blended CAC vs. LTV targets

**RETARGETING (Warm Audiences)**
- Objective: Convert engaged users to customers
- Targeting: Website visitors, video viewers, ad engagers, cart abandoners
- Creative focus: Social proof, offer reinforcement, objection handling
- Success metric: Cart recovery rate, conversion rate

**RETENTION (Past Purchasers)**
- Objective: Repeat purchases and LTV expansion
- Targeting: Customer lists segmented by product, AOV, recency
- Creative focus: Upsells, bundles, VIP messaging, exclusive offers
- Success metric: Repeat purchase rate, AOV increase

#### 2.2 Platform Strategy Matrix

| Platform | Best For | Creative Format | Funnel Stage |
|----------|----------|----------------|--------------|
| Meta (Feed) | Product demos, social proof | UGC videos (15-30s), carousels | Mid-funnel, retargeting |
| Meta (Stories/Reels) | Scroll-stopping creative | Vertical UGC (9:16), fast cuts | Prospecting |
| TikTok (FYP) | Trend-jacking, authentic UGC | Native-looking content (60s max) | Prospecting |
| TikTok (Spark Ads) | Creator whitelisting | User-generated brand content | All funnel stages |
| Pinterest | Visual discovery, inspiration | High-quality product images | Top-of-funnel awareness |
| YouTube (Pre-roll) | Long-form demos, testimonials | 15-30s skippable ads | Mid-funnel education |

---

### Step 3: Creative Development Framework

#### 3.1 Hook Library (Scroll-Stopping Openers)

Generate 10-15 hooks across these proven categories:

**Pattern Interrupts**
- "Stop scrolling if you [specific pain point]"
- "I tried [product category] for 30 days straight. Here's what happened..."
- "POV: You finally found [solution] that actually works"

**Bold Claims**
- "[X results] in [timeframe] or your money back"
- "Why [celebrity/expert] swears by [product]"
- "The [product] that [big brand] doesn't want you to know about"

**Pain Point Callouts**
- "Still dealing with [common frustration]? Try this instead..."
- "If you've tried [competitor approach] and failed, watch this"
- "Tired of [status quo problem]? Here's the fix"

**Curiosity Gaps**
- "The [product] everyone's talking about on [platform]"
- "How I [achieved outcome] without [traditional method]"
- "This changed everything about [category]"

**Social Proof Hooks**
- "Over [X] customers can't be wrong..."
- "[Number] 5-star reviews. Here's why..."
- "Backed by [authority figure/institution]"

#### 3.2 UGC Script Templates

**Template 1: Problem-Solution-Social Proof (30s)**
```
[Hook - 3s]
"I used to struggle with [pain point] until I found [product]..."

[Problem Agitation - 7s]
"Every morning I'd wake up with [specific symptom]. I tried [failed solution 1], [failed solution 2]... nothing worked."

[Solution Introduction - 10s]
"Then I discovered [product name]. Within [timeframe], I noticed [specific benefit]. Now [transformed state]."

[Social Proof - 5s]
"Don't just take my word for it - [X] thousand others have seen the same results."

[CTA - 5s]
"Try it risk-free. Link in bio. [Offer detail]."
```

**Template 2: Transformation Story (60s)**
```
[Hook - 5s]
"Here's how [product] changed my life in [timeframe]..."

[Before State - 15s]
"I was [before situation]. My [aspect of life] was [negative state]. I felt [emotion]."

[Discovery Moment - 10s]
"One day, [friend/ad/article] told me about [product]. I was skeptical, but [reason to try]."

[Journey & Results - 20s]
"Day 1: [initial experience]
Week 1: [early results]
Week 4: [significant transformation]
Now: [current state and benefits]"

[Objection Handling - 5s]
"You might be thinking '[common objection].' I thought that too. But [counterargument]."

[CTA - 5s]
"If you're ready to [achieve outcome], click the link. [Offer]. [Guarantee]."
```

**Template 3: Expert/Founder POV (45s)**
```
[Authority Hook - 5s]
"As a [credential], I've seen thousands of people struggle with [problem]."

[Industry Insider - 15s]
"Here's what most [category] companies won't tell you: [insider truth]. That's why we created [product] differently."

[Differentiation - 15s]
"Unlike [competitor approach], [product] uses [unique mechanism]. This means [specific benefit] without [common drawback]."

[Proof Points - 5s]
"[Metric 1: clinical study / customer count]
[Metric 2: satisfaction rate / repeat purchase]
[Metric 3: awards / press mentions]"

[CTA - 5s]
"Ready to experience the difference? [Offer]. Shop now."
```

#### 3.3 Angle Matrix (Content Pillars)

Build creative around 5-7 core angles derived from positioning:

**Primary Angles** (from positioning-marketing skill):
1. **Efficacy**: "[Product] delivers [specific results] in [timeframe]"
2. **Convenience**: "Finally, [category] that fits your [lifestyle constraint]"
3. **Value**: "[Quality level] results without [traditional cost/hassle]"
4. **Status/Identity**: "For [aspirational identity] who demand [quality trait]"
5. **Innovation**: "The first [product] to [unique mechanism/benefit]"

**Supporting Angles**:
6. **Safety/Natural**: "Clean, [certification], no [harmful ingredient]"
7. **Community/Movement**: "Join [X] others transforming [area of life]"

**Angle-to-Creative Mapping**:
- Each angle gets 3-5 creative variations
- Test hooks, formats, and talent across each angle
- Measure which angles drive best CAC and LTV

---

### Step 4: Offer Architecture (Integration with direct-response)

#### 4.1 Funnel-Matched Offers

**Prospecting Offers** (Cold Traffic)
- Softer value props: Free shipping, quiz/finder tools, "Learn More"
- Trial offers: "Try for [X days] risk-free"
- Bundle discovery: "Starter kit for [price]"

**Retargeting Offers** (Warm Traffic)
- Stronger incentives: 15-20% off first order
- Cart abandonment: "Complete your order + [bonus]"
- Limited-time urgency: "24-hour flash sale"

**Retention Offers** (Past Customers)
- Loyalty rewards: "VIP members save [%]"
- Subscription upgrades: "Save [%] with auto-delivery"
- Cross-sell bundles: "Customers who bought X also love Y"

#### 4.2 Offer Testing Framework

Test these variables systematically:
- Discount depth (10% vs. 15% vs. 20%)
- Discount type (% off vs. $ off vs. free product)
- Urgency framing ("24 hours left" vs. "While supplies last")
- Value framing ("Save $50" vs. "Get $150 value for $100")
- Guarantee strength ("30-day" vs. "60-day" vs. "Lifetime")

---

### Step 5: Creative Testing Roadmap

#### 5.1 Testing Structure

**Week 1-2: Baseline Creative Matrix**
- Launch 3 angles × 3 hooks × 2 formats = 18 initial ads
- Allocate 60% budget to prospecting, 30% retargeting, 10% retention
- Identify top 3 performers by CPA and CTR

**Week 3-4: Iteration Sprint**
- Scale winning angles with 5 new hooks each
- Test new UGC talent and creator styles
- Introduce format variations (static vs. video vs. carousel)

**Week 5-6: Optimization & Expansion**
- Promote top performers to "evergreen" campaigns
- Refresh creative every 7-14 days to combat ad fatigue
- Expand to secondary platforms (Pinterest, YouTube)

**Ongoing: Always-On Testing**
- Dedicate 15-20% budget to creative testing campaigns
- Launch 3-5 new ads weekly
- Graduate winners to scaling campaigns monthly

#### 5.2 Testing Metrics Dashboard

Track these metrics per ad/angle:

| Metric | Benchmark | Interpretation |
|--------|-----------|----------------|
| Hook Rate (3s view) | >35% | Creative stops scroll |
| CTR | 1.5-3%+ | Ad drives interest |
| Landing Page CVR | 2-5%+ | Message-match strong |
| CPA | <$[target] | Within acquisition economics |
| ROAS | >2-3x | Profitable at scale |

---

### Step 6: Lead Magnet Integration (Retargeting Fuel)

#### 6.1 Connecting Lead Magnets to Paid Social

If lead-magnet-cro outputs exist:
- Use lead magnets as "soft conversion" retargeting assets
- Create ad campaigns offering lead magnet downloads to warm audiences
- Build custom audiences from lead magnet downloaders → retarget with product offers

**Example Flow**:
```
Prospecting Ad (Awareness)
        ↓
User Clicks → Doesn't Purchase
        ↓
Retargeting Ad: "Download our [lead magnet]"
        ↓
User Downloads (Email Captured)
        ↓
Retargeting Ad: "You downloaded [guide]. Here's [product] to apply it."
        ↓
Conversion
```

#### 6.2 Lead Magnet Ad Creative

**Script Example**:
```
[Hook]
"Want to [achieve outcome] without [buying yet]? Download our free [lead magnet type]."

[Value Prop]
"Inside you'll learn:
- [Benefit 1]
- [Benefit 2]  
- [Benefit 3]"

[Social Proof]
"Join [X] others who've already grabbed this guide."

[CTA]
"Click to download instantly. No purchase needed."
```

---

### Step 7: Platform-Specific Execution Guidelines

#### Meta (Facebook & Instagram)

**Account Structure**:
```
Campaign Level: Objective (Sales, Traffic, Engagement)
  ├─ Ad Set 1: Prospecting - Broad Interest (Age 25-45, Interest: [Category])
  ├─ Ad Set 2: Prospecting - Lookalike 1-3% (Purchasers)
  ├─ Ad Set 3: Retargeting - Website Visitors (Last 30 days)
  ├─ Ad Set 4: Retargeting - Video Viewers 50%+ (Last 14 days)
  ├─ Ad Set 5: Retargeting - Cart Abandoners (Last 7 days)
  └─ Ad Set 6: Retention - Past Purchasers (90+ days ago)
```

**Creative Specs**:
- Feed: 1080×1080 (1:1) or 1080×1350 (4:5)
- Stories/Reels: 1080×1920 (9:16)
- Video: 15-60s, captions ON (80% watch muted)
- File size: <4GB, format: MP4/MOV

**Best Practices**:
- Use Advantage+ Creative for automatic optimization
- Test manual placements vs. Advantage+ placements
- Refresh creative every 10-14 days (ad fatigue threshold)

#### TikTok

**Account Structure**:
```
Campaign Level: Objective (Website Conversions)
  ├─ Ad Group 1: Broad Targeting (No interests, let algorithm optimize)
  ├─ Ad Group 2: Custom Audiences (Website Visitors, Video Views)
  └─ Ad Group 3: Lookalike - Purchasers
```

**Creative Specs**:
- Video: 9:16 vertical, 21-60s ideal length
- Resolution: 720×1280 minimum, 1080×1920 preferred
- Native feel: Low production value, authentic creator content

**TikTok-Specific Tactics**:
- Use trending sounds and effects (check TikTok Creative Center)
- Leverage Spark Ads to promote organic creator content
- Front-load the hook (first 2 seconds critical)
- End with clear CTA overlay + voiceover

---

### Step 8: Measurement & Optimization Framework

#### 8.1 North Star Metrics

**Primary KPIs**:
- Blended CAC (Customer Acquisition Cost)
- ROAS (Return on Ad Spend) - short-term and 30/60/90-day
- LTV:CAC Ratio (aim for 3:1+)
- Contribution Margin per customer

**Secondary KPIs**:
- CTR (Click-Through Rate) - creative engagement
- Landing Page CVR - message-match and offer strength
- Hook Rate (3-second views) - stopping power
- Ad Frequency - fatigue management

#### 8.2 Attribution & Analytics Setup

**Tracking Requirements**:
- Meta Pixel + Conversions API (CAPI) for iOS14+ accuracy
- TikTok Pixel + Events API
- UTM parameters for cross-platform attribution
- GA4 + server-side GTM for first-party data ownership

**Attribution Windows**:
- Default: 7-day click, 1-day view
- Test: 1-day click (conservative) vs. 28-day click (aggressive)
- Use data-driven attribution when volume allows

#### 8.3 Optimization Cadence

**Daily**:
- Check for learning phase exits (50+ conversions per ad set)
- Pause ads with CPA >2x target after $200+ spend
- Increase budgets 20% on winning ad sets

**Weekly**:
- Analyze creative performance - kill bottom 20%, scale top 20%
- Refresh ad copy and hooks for fatigue
- Review audience saturation (frequency >3-4)

**Monthly**:
- Deep-dive on angle performance across funnel
- Update lookalike seed audiences with fresh conversions
- Reallocate budget based on platform ROAS trends

---

## Output Format: Comprehensive DTC Ad Strategy Document

When executing this skill, generate a complete strategy document with the following structure:

```markdown
# [Product Name] - Paid Social Ad Strategy

## Executive Summary
- Product overview and positioning summary
- Target revenue goals and CAC targets
- Platform priorities and budget allocation
- Key success metrics and benchmarks

## 1. Strategic Foundation
### 1.1 Positioning & Audience (from positioning-marketing)
- Target customer profile
- Core positioning angles
- Competitive differentiation

### 1.2 Offer Strategy (from direct-response)
- Prospecting offers (cold traffic)
- Retargeting offers (warm traffic)
- Retention offers (past customers)
- Testing roadmap for offer optimization

### 1.3 Lead Magnet Integration (from lead-magnet-cro)
- Retargeting funnel using lead magnets
- Ad creative for lead magnet promotion
- Email → paid social remarketing flow

## 2. Account Structure & Campaign Architecture
### Meta Account Structure
[Detailed breakdown of campaigns, ad sets, targeting]

### TikTok Account Structure
[Detailed breakdown of campaigns, ad groups, targeting]

### Budget Allocation
- Prospecting: X%
- Retargeting: Y%
- Retention: Z%
- Creative Testing: W%

## 3. Creative Strategy & Assets

### 3.1 Hook Library (15 hooks across 5 angles)
[List of scroll-stopping hooks with angle tags]

### 3.2 UGC Ad Scripts (5-10 ready-to-film scripts)
[Complete scripts with timestamps and shot directions]

### 3.3 Angle Matrix
[5-7 core angles with creative variations mapped]

### 3.4 Creative Specifications
- Meta specs (feed, stories, reels)
- TikTok specs (FYP, Spark Ads)
- Production guidelines and quality standards

## 4. Full-Funnel Creative Testing Roadmap

### Week 1-2: Baseline Matrix Launch
[Specific ads to launch, targeting, budget]

### Week 3-4: Iteration Sprint
[Winners to scale, new variations to test]

### Week 5-6: Optimization & Expansion
[Evergreen campaigns, secondary platforms]

### Ongoing: Always-On Testing Protocol
[Weekly testing cadence, creative refresh schedule]

## 5. Measurement & Optimization

### 5.1 Success Metrics Dashboard
[KPIs, benchmarks, tracking setup]

### 5.2 Attribution & Analytics
[Pixel setup, UTMs, GA4 configuration]

### 5.3 Optimization Playbook
[Daily, weekly, monthly tasks]

## 6. Platform-Specific Execution Plans

### Meta Execution Plan
[Detailed steps for account setup, campaign launch, optimization]

### TikTok Execution Plan
[Detailed steps for account setup, ad group creation, Spark Ads]

## 7. Creative Production Workflow

### UGC Creator Briefs
[Brief templates for hiring and directing creators]

### Production Timeline
[Week-by-week schedule for shooting, editing, launching new ads]

### Asset Library Management
[Naming conventions, version control, performance tagging]

## 8. Next Steps & Implementation Timeline

### Phase 1: Setup (Week 1)
- [ ] Install pixels and tracking
- [ ] Build account structure
- [ ] Recruit UGC creators
- [ ] Prepare first creative batch

### Phase 2: Launch (Week 2)
- [ ] Launch baseline creative matrix
- [ ] Set up daily monitoring
- [ ] Begin performance tracking

### Phase 3: Optimize (Week 3-6)
- [ ] Scale winners
- [ ] Iterate creative
- [ ] Expand platforms

### Phase 4: Scale (Month 2+)
- [ ] Establish evergreen campaigns
- [ ] Build always-on testing system
- [ ] Optimize for LTV and retention

## Appendix
- Competitor ad research findings
- Platform best practices checklists
- Creative testing tracker template
- Budget pacing calculator
```

---

## Best Practices & Common Pitfalls

### ✅ DO:
- Always start with positioning and offers from existing skills
- Test multiple hooks and angles simultaneously
- Use authentic UGC over polished brand creative (for DTC)
- Implement proper tracking BEFORE launching ads
- Refresh creative every 10-14 days to combat fatigue
- Segment audiences tightly (prospecting vs. retargeting vs. retention)
- Optimize to business outcomes (CAC, LTV) not vanity metrics (impressions)

### ❌ DON'T:
- Launch without product-market fit or positioning clarity
- Over-invest in production quality at the expense of testing volume
- Ignore platform-native formats (e.g., polished ads on TikTok)
- Combine cold and warm audiences in the same ad set
- Scale before achieving learning phase (50+ conversions)
- Neglect retargeting and retention in favor of prospecting only
- Set and forget - DTC ads require active management

---

## Skill Coordination Notes

**When positioning-marketing skill has already run:**
- Extract positioning angles directly from the PRD or strategy doc
- Use the same target audience definitions
- Translate brand messaging into ad copy

**When direct-response skill has already run:**
- Use established offer frameworks
- Maintain consistency in CTA language
- Apply proven conversion tactics to ad creative

**When lead-magnet-cro skill has already run:**
- Reference lead magnets in retargeting flows
- Create ads promoting lead magnet downloads
- Build custom audiences from lead magnet downloaders

**When creating a skill from scratch (no prior work):**
- Conduct brief positioning interview (10 minutes)
- Define 3-5 core angles based on product benefits
- Establish baseline offer structure
- Proceed with ad strategy creation

---

## Example Usage

### User Input:
"Create a Meta and TikTok ad strategy for my DTC skincare brand, CleanGlow. We're doing $3M ARR, targeting women 25-45 with sensitive skin. We have a 30-day supply bundle for $89."

### Skill Execution:
1. **Check for existing positioning/offers** → None found
2. **Conduct brief positioning interview**
   - Q: What makes CleanGlow different?
   - A: Dermatologist-formulated, fragrance-free, gentle enough for eczema-prone skin
3. **Define core angles**:
   - Efficacy: "Clinically proven to reduce irritation in 14 days"
   - Safety: "Hypoallergenic, dermatologist-tested, zero harsh chemicals"
   - Convenience: "Complete 3-step routine in one bundle"
4. **Establish offer structure**:
   - Prospecting: Free shipping + 30-day guarantee
   - Retargeting: 15% off first order + free mini product
   - Retention: Subscribe & save 20%
5. **Generate full DTC ad strategy document** with:
   - 15 hooks across 3 angles
   - 8 UGC scripts (problem-solution, transformation, expert POV)
   - Meta + TikTok account structures
   - 6-week creative testing roadmap
   - Measurement framework and optimization playbook

### Output:
Complete strategy document (8-10 pages) ready for immediate execution by media buyers, creatives, and performance marketers.

---

## Skill Maintenance & Updates

This skill should be updated when:
- Platform ad formats or algorithms change significantly (e.g., Meta Advantage+ updates)
- New creative best practices emerge from DTC case studies
- Integration points with other skills evolve (positioning-marketing v2.0, etc.)
- New platforms become relevant for DTC (e.g., YouTube Shorts, Pinterest Shopping Ads)

---

**End of Skill Definition**
