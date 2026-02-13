# Local SEO Keywords Skill

Generates programmatic SEO keyword strategies for local markets, specifically designed for AI/SaaS businesses expanding geographically.

## What It Does

This skill automates the complete programmatic SEO workflow:

1. **Reads your business context** from PRD and feature documentation
2. **Generates keyword universes** (200-500+ keywords) combining:
   - Your services/products
   - Target locations (cities, states, metros)
   - Search intent modifiers (best, pricing, near me, etc.)
3. **Researches competitors** using web search to validate opportunities
4. **Creates structured data** (CSV) with priority scoring
5. **Builds landing page templates** with dynamic placeholders
6. **Delivers implementation strategy** and roadmap

## Quick Start

### Basic Usage

```
Generate a programmatic SEO keyword strategy for my business. 
Target the top 15 US cities. Use the PRD in /path/to/project/PRD.md
```

The skill will automatically:
- Read your PRD and feature docs
- Generate 300+ keywords
- Research competitor SERPs
- Create templates and CSV
- Provide implementation recommendations

### What You Get

5 files ready for implementation:

1. **keyword-universe.csv** - Complete keyword database with priorities
2. **templates/** - 3-5 landing page templates (Markdown/HTML)
3. **seo-strategy.md** - Implementation roadmap
4. **competitor-analysis.md** - SERP research findings
5. **schema-examples.json** - Structured data samples

## Requirements

### Input Requirements

**Must have**:
- Business description (PRD, features list, or marketing copy)
- Geographic scope (which cities/regions to target)

**Nice to have**:
- Existing keyword research
- Competitor examples
- Target industries/verticals

### Expected Outputs

- **Keyword universe**: 200-500 keywords minimum
- **Templates**: 3-5 reusable landing page templates
- **Strategy document**: Implementation phases, technical recommendations
- **Competitor insights**: SERP analysis and opportunities

## Use Cases

### 1. Geographic Expansion

"We're expanding from 5 cities to 50. Generate local landing pages for all markets."

### 2. Multi-Product SEO

"Create programmatic SEO for our 4 product lines across 20 cities."

### 3. Vertical-Specific Campaigns

"Build local keywords for healthcare industry in top 10 cities."

### 4. Competitive Analysis

"Research what competitors rank for in our target markets."

## Customization

The skill supports:

- **Custom geographic scope**: Cities, states, countries, neighborhoods
- **Industry focus**: Healthcare, finance, retail, etc.
- **Framework variations**: Different template types per use case
- **Priority weighting**: Adjust scoring based on business goals

## Testing

Run evals to validate the skill:

```bash
# Test basic keyword generation
claude --skill local-seo-keywords "Generate keywords for sample-prd.md, top 10 cities"

# Test template quality
claude --skill local-seo-keywords "Create healthcare-focused templates from sample-prd.md"

# Test competitor research
claude --skill local-seo-keywords "Research compliance software SEO in SF, Austin, NYC"
```

5 eval cases included covering:
- Basic keyword generation
- Template quality
- Competitor research
- Multi-framework keywords
- Industry vertical focus

## Example Output

### Sample Keywords Generated

```csv
keyword,service,location,intent_modifier,cluster_type,priority_score
"SOC 2 compliance software San Francisco",compliance,San Francisco,none,location,12.0
"best HIPAA compliance automation Austin",compliance,Austin,best,comparison,11.5
"compliance software for healthcare NYC pricing",compliance,New York,pricing,location,10.8
```

### Sample Template

```markdown
# {{service}} in {{city}}, {{state}}

{{intro_with_local_context}}

## Why {{city}} Businesses Choose {{service}}

- Local compliance requirements in {{city}}
- {{business_value_prop_1}}
- {{business_value_prop_2}}

[... dynamic content continues ...]
```

## Integration

Works with:
- **Next.js/Gatsby**: Use templates as page components
- **Content APIs**: Feed CSV into Contentful, Sanity, Strapi
- **Rank tracking**: Import to Ahrefs, Semrush
- **Analytics**: Map clusters to conversion funnels

## Best Practices

1. **Start focused**: Test with 5-10 cities before scaling to 50+
2. **Validate SERP intent**: Review competitor analysis before building all pages
3. **Maintain quality**: Use templates as starting points, add unique local content
4. **Track performance**: Monitor rankings and conversions by template type
5. **Iterate**: Refine templates based on what performs best

## Troubleshooting

**"Not enough keywords generated"**
- Expand geographic scope
- Add more service variations
- Include more intent modifiers

**"Templates too generic"**
- Add more specific {{variable}} placeholders
- Include local stats and data requirements
- Reference specific neighborhoods/landmarks

**"Competitor research incomplete"**
- Check web search is enabled
- Try broader search terms
- Research may be limited by rate limits

## License

MIT License - See LICENSE file for details
