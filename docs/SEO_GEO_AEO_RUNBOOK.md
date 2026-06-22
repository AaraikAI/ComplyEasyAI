# SEO / GEO / AEO Runbook — ComplyEasy AI

A practical, repeatable runbook for operating the search, generative-engine (GEO),
and answer-engine (AEO) presence of **https://complyeasyai.com**.

Scope: this covers the operational steps that live *outside* the codebase — search-engine
verification, sitemap submission, AI-crawler access checks, citation tracking, and off-site
listings. The in-repo machinery it relies on:

- `public/robots.txt` — explicitly allows the major AI crawlers (GPTBot, OAI-SearchBot,
  ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-Web, anthropic-ai,
  Google-Extended, CCBot, Amazonbot, cohere-ai, Applebot-Extended) and references the sitemap.
- `public/sitemap.xml` — generated from `scripts/publicRoutes.mjs` by `npm run sitemap`.
- `public/llms.txt` / `public/llms-full.txt` — concise and full context maps for ingesting LLMs.
- `scripts/prerender.mjs` — renders full HTML per public route so crawlers and AI engines get
  complete, content-rich markup (not an empty SPA shell).
- `scripts/validate-jsonld.mjs` (`npm run validate:seo`) — CI gate on structured-data validity.

---

## 1. Search Console + Bing Webmaster verification & sitemap submission

Do this once per property, then re-submit the sitemap whenever routes change.

### Google Search Console
1. Go to https://search.google.com/search-console and add a property.
   Prefer the **Domain** property type (`complyeasyai.com`) so http/https and all subdomains
   are covered in one property.
2. Verify via **DNS TXT record** (Domain property requires this): add the `google-site-verification=...`
   TXT record at the DNS provider for `complyeasyai.com`, then click Verify.
   (Alternative for a URL-prefix property: upload the provided HTML verification file to `public/`
   so it deploys to the site root, or add the `<meta name="google-site-verification">` tag.)
3. Submit the sitemap: **Indexing → Sitemaps → Add a new sitemap → `sitemap.xml`**
   (full URL `https://complyeasyai.com/sitemap.xml`).
4. Use **URL Inspection** on the flagship pillar (`/platform/ai-compliance`) and `/soc2-compliance`
   to confirm Google sees the prerendered HTML and the JSON-LD. Request indexing for new/changed URLs.

### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters and add `https://complyeasyai.com`.
   You can **import from Google Search Console** to skip re-verification, or verify via DNS TXT /
   the XML file / meta tag.
2. Submit the sitemap under **Sitemaps → Submit sitemap → `https://complyeasyai.com/sitemap.xml`**.
3. Bing powers ChatGPT Search and Copilot, so Bing indexing directly feeds AEO — keep it healthy.

> Re-run `npm run sitemap` (or a full `npm run build`, which runs it) after editing
> `scripts/publicRoutes.mjs`, then re-submit / let the engines re-crawl.

---

## 2. IndexNow — push new/changed URLs on deploy

IndexNow notifies Bing (and partners) of new or changed URLs instantly instead of waiting for a crawl.

1. Generate a key (a 32+ hex-char string) and host it at the site root as
   `https://complyeasyai.com/<key>.txt` containing exactly that key (place the file in `public/`).
2. On each production deploy, POST the changed URLs:
   ```bash
   curl -s -X POST "https://api.indexnow.org/IndexNow" \
     -H "Content-Type: application/json" \
     -d '{
       "host": "complyeasyai.com",
       "key": "<your-indexnow-key>",
       "keyLocation": "https://complyeasyai.com/<your-indexnow-key>.txt",
       "urlList": [
         "https://complyeasyai.com/platform/ai-compliance",
         "https://complyeasyai.com/soc2-compliance"
       ]
     }'
   ```
3. Derive the `urlList` from `scripts/publicRoutes.mjs` (`allPublicRoutes()`) so it stays in sync,
   or submit just the URLs that changed in the deploy. A 200/202 response means accepted.

---

## 3. Confirm AI-crawler access (the markup is actually reachable)

AI engines only cite what they can fetch as full HTML. Verify the prerendered content is served to
the named bots and that `robots.txt` permits them.

```bash
# Each of these should return full, content-rich HTML (a populated <main>, the <h1>,
# and the <script type="application/ld+json"> blocks) — NOT an empty SPA shell.
for UA in \
  "GPTBot/1.0 (+https://openai.com/gptbot)" \
  "PerplexityBot/1.0 (+https://perplexity.ai/perplexitybot)" \
  "ClaudeBot/1.0 (+claudebot@anthropic.com)"; do
  echo "===== $UA ====="
  curl -sA "$UA" https://complyeasyai.com/platform/ai-compliance \
    | grep -ciE "<h1|application/ld\+json|AI compliance is the practice"
done

# robots.txt should Allow each of these agents:
curl -s https://complyeasyai.com/robots.txt | grep -iE "GPTBot|PerplexityBot|ClaudeBot"

# llms context files should be reachable:
curl -sI https://complyeasyai.com/llms.txt      | head -1
curl -sI https://complyeasyai.com/llms-full.txt | head -1
```

A non-zero match count on the first loop confirms the crawler receives the real content.

### Server-log greps (confirm the bots are actually visiting)
Once live, periodically grep the access logs / CDN logs for AI-crawler hits:
```bash
# Example over an nginx/CloudFront access log:
grep -iE "GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|ClaudeBot|anthropic-ai|Google-Extended|CCBot|Amazonbot|Applebot" access.log \
  | awk '{print $1, $7, $12}' | sort | uniq -c | sort -rn | head -30
```
Look for: which bots crawl, how often, which URLs, and any 4xx/5xx served to them (those block citation).

---

## 4. GEO / AEO citation tracking checklist

GEO/AEO success = being **cited** in AI answers. There is no console for this yet, so track it manually
on a regular cadence (e.g. monthly). Log each run in a simple spreadsheet (date, engine, prompt, cited?,
position/context, notes).

### Prompts to run against ChatGPT, Perplexity, and Gemini
- "best AI compliance software"
- "best AI compliance tools / platforms"
- "Vanta alternative" (and "Drata alternative", "Secureframe alternative", "Sprinto alternative",
  "OneTrust alternative")
- "how to automate SOC 2"
- "how to automate SOC 2 with AI"
- "what is AI compliance"
- "EU AI Act compliance checklist"
- "how do I get SOC 2 compliant"
- "continuous compliance platform"

For each: record whether **ComplyEasy AI** is named, how it is described (does the description match
our positioning?), whether it links to the right pillar, and which competitors are cited alongside.
When a description is wrong or stale, fix the source of truth the engines ingest — the pillar copy,
`llms.txt` / `llms-full.txt`, and the Organization schema — then re-check next cycle.

### Search Console signal (the leading indicator)
In Google Search Console, track **impressions and clicks** for target queries on a monthly basis:
- Performance → filter by query: `ai compliance`, `soc 2 compliance software`, `eu ai act`,
  `vanta alternative`, `automate soc 2`, `grc platform`.
- Watch average position and CTR per pillar; rising impressions on a target query usually precedes
  AI engines picking the page up as a citation source.

---

## 5. Off-site GEO levers (third-party signals AI engines weight heavily)

AI answers lean on aggregator and review sites. Establish and maintain consistent listings:

- **G2** (g2.com) — create/claim the ComplyEasy AI listing in the relevant categories
  (GRC, Security Compliance, AI Governance). Genuine customer reviews here are frequently cited.
- **Capterra / GetApp / Software Advice** — claim the listing; keep category, description, and
  feature lists consistent.
- **Product Hunt** — a launch/listing adds a high-authority backlink and discovery surface.
- **"Best AI compliance tools" listicles** — outreach to publishers of roundup articles
  ("best AI compliance software 2026", "Vanta alternatives", "top GRC platforms") to be included
  factually.

**Consistency rule:** every off-site description MUST match the on-site source of truth — the same
factual capabilities, supported frameworks, and security architecture as in `public/llms.txt`,
`public/llms-full.txt`, and the `Organization` schema in `components/seo/siteSchema.ts`. Do not invent
metrics, customer counts, ratings, or certifications anywhere. Frameworks are standards the platform
**helps customers achieve**, not certifications ComplyEasy AI itself holds. When the on-site
positioning changes, update the off-site listings in the same cycle so engines see one coherent story.

---

## Manual follow-up (asset generation — required, tracked separately)

These are referenced by the site but must be produced manually (they are not generated by the build):

1. **Open Graph PNG:** export `public/og/default-og.svg` to a **1200×630 PNG** at
   `public/og/default-og.png`. Several social/AEO scrapers prefer a raster OG image; once the PNG
   exists, switch the default `ogImage` (in `components/seo/Seo.tsx`) or per-page `ogImage` props to it.
   ```bash
   # Example using a local SVG rasterizer (rsvg-convert / Inkscape / sharp):
   rsvg-convert -w 1200 -h 630 public/og/default-og.svg -o public/og/default-og.png
   ```
2. **App icons:** generate the `public/icons/*.png` set referenced by `manifest.json`
   (e.g. 192×192 and 512×512, plus any maskable variants) from the brand mark. Confirm each path in
   `manifest.json` resolves to an existing file after the export.

After producing these assets, re-run `npm run build` and re-validate with `npm run validate:seo`.
