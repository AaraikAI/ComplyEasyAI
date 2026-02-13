---
name: local-seo-keywords
description: Generate programmatic SEO keyword strategies for local markets. Builds keyword universes, validates SERP intent, and creates landing page templates for AI/SaaS businesses targeting geographic markets.
---

# Local SEO Keyword Strategy Generator

Automates programmatic SEO keyword research and landing page creation for local markets. Designed for AI/SaaS businesses expanding into geographic markets at scale.

## What This Skill Does

1. **Reads business context** from project documentation (PRD, features, functionality lists)
2. **Generates keyword universes** combining services × locations × intent modifiers
3. **Researches competitors** to validate keyword opportunities and SERP intent
4. **Creates structured data** (CSV) with keyword clusters, volumes, and priorities
5. **Builds landing page templates** with dynamic placeholders for programmatic generation
6. **Delivers strategic recommendations** for implementation and optimization

## Workflow

### Phase 1: Context Discovery
- Use `view` to read project documentation from main branch
- Extract: core products/services, problems solved, target industries/verticals
- Identify unique value propositions and differentiators
- Note any existing geographic presence or target markets

### Phase 2: Keyword Universe Generation
Generate comprehensive keyword combinations across dimensions:

**Service Dimension**: Extract from PRD/features
- Core products (e.g., "AI chatbot", "LLM consulting", "compliance automation")
- Problems solved (e.g., "reduce manual data entry", "automate compliance")
- Verticals served (e.g., "for healthcare", "for finance", "for dentists")

**Location Dimension**: Ask user for geographic scope if not in docs
- Countries, states, metro areas, cities, neighborhoods
- Start with top 20-50 priority locations

**Intent Dimension**: Standard modifiers
- Commercial: "best", "top", "pricing", "cost", "near me"
- Informational: "how to", "guide", "examples", "templates"
- Transactional: "demo", "trial", "book", "hire", "get started"

**Combination Pattern**:
```
[service] + [location] + [modifier]
"AI chatbot for dentists in Austin"
"LLM consulting New York pricing"
"compliance automation software Chicago demo"
```

Generate 200-500 seed keywords initially.

### Phase 3: Competitor Research & SERP Validation

For each keyword cluster (group by pattern):

1. **Search top competitors**: Use `web_search` to find who ranks for these patterns
   ```
   "AI chatbot [city]"
   "best [service] in [city]"
   ```

2. **Analyze SERP intent**: Check what page types rank
   - Are they local service pages?
   - Comparison/listicle pages?
   - Directories?
   - Product pages?

3. **Identify opportunities**: Look for patterns where:
   - Generic pages rank (opportunity to create better local content)
   - Few competitors have dedicated local pages
   - Search results show demand but poor supply

4. **Validate with 5-10 sample searches** per major pattern before scaling

### Phase 4: Keyword Clustering & Prioritization

Organize keywords into template-ready clusters:

**Cluster Types**:
- **Location Pages**: "[Service] in [City]" - core service offered in specific location
- **Comparison Pages**: "Best [Service] in [City]" - listicle/comparison format
- **Vertical Pages**: "[Service] for [Industry] in [City]" - industry-specific
- **Integration Pages**: "[Service] + [Tool] in [City]" - integration/compatibility focus
- **FAQ/Guide Pages**: "How to choose [Service] in [City]" - informational

**Priority Scoring** (track in CSV):
- Search volume (from research or estimate: high/medium/low)
- Competition level (based on SERP analysis: low/medium/high)
- Business value (how well it matches core offering: 1-5)
- Template fit (how well standardized template can satisfy intent: 1-5)

### Phase 5: Structured Data Output

Create CSV with these columns:
```
keyword,service,location,intent_modifier,cluster_type,search_volume,competition,business_value,template_fit,priority_score,serp_notes
```

**Priority Score Calculation**:
```
priority_score = (business_value + template_fit) × volume_factor ÷ competition_factor
Where:
- volume_factor: high=3, medium=2, low=1
- competition_factor: low=1, medium=2, high=3
```

Sort by priority_score descending.

### Phase 6: Landing Page Templates

Create 3-5 reusable templates for top cluster types:

#### Template 1: Location Service Page
```markdown
# {{service}} in {{city}}, {{state}}

{{intro_paragraph_with_local_context}}

## Why Choose {{service}} in {{city}}

{{value_props_with_local_stats}}

## How {{service}} Works in {{city}}

{{process_steps}}

## {{service}} Pricing in {{city}}

{{pricing_table_or_bands}}

## Local {{industry}} Companies Using {{service}}

{{testimonials_or_case_studies}}

## Frequently Asked Questions

{{local_faqs}}

## Get Started with {{service}} in {{city}}

{{cta_section}}
```

#### Template 2: Comparison/Best-Of Page
```markdown
# Best {{service}} in {{city}}, {{state}} ({{year}})

{{intro_with_selection_criteria}}

## Top {{N}} {{service}} Providers in {{city}}

### 1. {{company_name_1}}
{{rating}} | {{local_address}} | {{key_features}}

{{description_with_local_presence}}

**Best for**: {{use_case}}

### 2-{{N}}. (Repeat pattern)

## How We Evaluated {{service}} in {{city}}

{{methodology}}

## {{service}} Buying Guide for {{city}} Businesses

{{decision_framework}}

## Get Started

{{comparison_cta}}
```

#### Template 3: Vertical-Specific Page
```markdown
# {{service}} for {{industry}} in {{city}}

{{industry_pain_points_in_local_context}}

## Why {{industry}} Companies in {{city}} Need {{service}}

{{local_regulations_or_trends}}
{{industry_specific_benefits}}

## {{service}} Features for {{industry}}

{{feature_mapping_to_industry_needs}}

## {{city}} {{industry}} Case Studies

{{local_success_stories}}

## Get Started

{{industry_specific_cta}}
```

**Template Requirements**:
- Include schema.org markup (LocalBusiness, FAQPage, Product)
- Dynamic placeholders marked with {{variable}}
- SEO metadata templates (title, meta description)
- Structured data for local signals (address, phone, hours)
- Internal linking suggestions

### Phase 7: Strategic Recommendations

Create implementation roadmap document covering:

**Content Production Plan**:
- Phase 1: Top 20 priority keywords (highest priority_score)
- Phase 2: Next 50 keywords (medium priority)
- Phase 3: Long tail (remaining keywords)

**Technical Implementation**:
- Template rendering approach (SSG, SSR, hybrid)
- URL structure: `/[service]/[city]` vs `/locations/[city]/[service]`
- Canonicalization strategy
- Internal linking schema

**Localization Requirements**:
- Local stats/data sources needed
- Geographic-specific content requirements
- NAP (Name, Address, Phone) consistency
- Local schema markup

**Performance Tracking**:
- KPIs per template type
- Ranking tracking by location cluster
- Conversion goals by intent type
- A/B testing recommendations

**Risk Mitigation**:
- Avoiding thin content penalties
- Maintaining content quality at scale
- Duplicate content handling
- User-generated content opportunities

## Output Files

The skill creates these deliverables:

1. **`keyword-universe.csv`** - Complete keyword database with all metadata
2. **`templates/`** - Directory with 3-5 landing page templates (Markdown/HTML)
3. **`seo-strategy.md`** - Strategic recommendations and implementation roadmap
4. **`competitor-analysis.md`** - SERP research findings and opportunities
5. **`schema-examples.json`** - Sample structured data for each template type

## Best Practices

### Research Quality
- Validate SERP intent for each major pattern before scaling
- Document competitor strengths/weaknesses
- Identify content gaps and opportunities
- Note local ranking factors (citations, reviews, proximity)

### Template Design
- Each template supports unique, human-authored intros
- Include modular blocks for dynamic data
- Provide clear variable definitions
- Add content quality guidelines
- Include minimum word count recommendations

### Keyword Selection
- Favor patterns with high template fit (4-5 score)
- Balance volume with competition
- Prioritize keywords where local intent is clear
- Avoid keyword cannibalization (group similar terms)

### Localization Depth
- Include local landmarks, neighborhoods, transit references
- Suggest local stat sources (census, business data)
- Recommend local partnership opportunities
- Note regional terminology variations

## Usage Example

User provides:
```
Project path: /path/to/project
Geographic scope: Top 25 US cities
```

Skill automatically:
1. Reads PRD and feature docs
2. Generates 300+ keyword combinations
3. Researches 20 competitor SERP patterns
4. Creates prioritized CSV with 300 keywords
5. Builds 4 landing page templates
6. Delivers implementation strategy

Total output: 5 files ready for programmatic SEO implementation.

## Error Handling

- If no PRD/features found: Ask user to provide business description
- If web search fails: Generate keywords from principles, note research gap
- If geographic scope unclear: Default to top 20 US metro areas, confirm with user
- If service description too vague: Request clarification on core offering

## Integration Points

This skill works well with:
- **Content automation**: Feed keyword CSV into content generation pipelines
- **Site generators**: Templates integrate with Next.js, Gatsby, 11ty
- **Rank tracking**: Import keywords into Ahrefs, Semrush, or custom trackers
- **Analytics**: Map keyword clusters to conversion funnels
