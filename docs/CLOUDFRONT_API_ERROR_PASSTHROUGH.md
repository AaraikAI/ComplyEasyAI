# CloudFront: let API errors reach the browser

**Symptom.** Any 403 or 404 from the API arrives in the browser as the SPA's
`index.html` with HTTP 200. Clients then fail with
`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`. Reproduced on
production (2026-09-05):

```
GET  /api/definitely-not-a-route  -> 200 text/html     (should be 404 JSON)
GET  /api/health                  -> 200 text/html     (should be 404 JSON; the probe is /health)
POST /api/demo/request  (no CSRF) -> 200 text/html     (should be 403 JSON "CSRF token missing")
POST /api/demo/request  (with CSRF, bad email) -> 400 application/json   ← correct
```

**Cause.** The distribution's *custom error responses* rewrite 403 and 404 to
`/index.html` with a 200. They exist to make SPA deep links work for the S3
origin, but custom error responses are distribution-wide: they also apply to
the `/api/*`, `/health` and websocket behaviours.

**Fix.** Make the SPA-fallback decision *per request* in the existing
viewer-request CloudFront Function instead, and delete the two custom error
responses. The function source is
[`infrastructure/cloudfront/route-rewrite.js`](../infrastructure/cloudfront/route-rewrite.js);
`npm run sitemap` renders it with the prerendered route set into
`infrastructure/cloudfront/route-rewrite.rendered.js`, which is what gets pasted
into the console. Logic:

| request | result |
|---|---|
| `/` | `/index.html` |
| prerendered route (`/soc2-compliance`, `/glossary/soc-2`, …), with or without trailing `/` | `/<route>/index.html` |
| any other extension-less path (`/dashboard/risks/123`, unknown paths) | `/index.html` (SPA renders it, or its not-found view) |
| anything with a file extension (`/assets/x.js`, `/sitemap.xml`) | untouched — S3 answers |
| `/api/*`, `/health`, websocket | not affected — separate behaviours, and no error-response rewrite any more |

## Apply to the live distribution (console / CLI)

> The live distribution has drifted from the CDK `FrontendStack` (e.g. the
> `/ws/*` behaviour was added by hand). **Do not** run `cdk deploy
> ComplyEasy-Frontend` to apply this — it would try to reconcile that drift.
> Apply the two changes below directly; the CDK change in this repo keeps the
> IaC honest for a future re-baseline.

Distribution: `E4CUOI17YEQ7E` (www.complyeasyai.com).

1. **Update the function.** CloudFront → Functions → the function associated
   with the default behaviour's *viewer request* event (CDK-named
   `complyeasy-production-route-rewrite`). Replace its code with the contents of
   `infrastructure/cloudfront/route-rewrite.rendered.js` (regenerate first with
   `npm run sitemap` so the route set is current). Use the **Test** tab with the
   URIs from the table above, then **Publish**. Runtime: `cloudfront-js-2.0`.

2. **Delete the custom error responses.** Distribution → *Error pages* → delete
   the entries for **403** and **404**. Save. Via CLI:

   ```bash
   aws cloudfront get-distribution-config --id E4CUOI17YEQ7E > dist.json
   ETAG=$(jq -r .ETag dist.json)
   jq '.DistributionConfig
       | .CustomErrorResponses = {"Quantity":0,"Items":[]}' dist.json > dist-config.json
   aws cloudfront update-distribution --id E4CUOI17YEQ7E --if-match "$ETAG" \
     --distribution-config file://dist-config.json
   ```

3. **Verify** (propagation takes a few minutes):

   ```bash
   B=https://www.complyeasyai.com
   curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $B/api/definitely-not-a-route   # 404 application/json
   curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $B/api/health                   # 404 application/json
   curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -X POST $B/api/demo/request      # 403 application/json
   curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $B/dashboard/anything           # 200 text/html (SPA shell)
   curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $B/soc2-compliance              # 200 text/html (prerendered)
   curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $B/health                       # 200 application/json
   ```

**Rollback.** Re-add the 403 and 404 → `/index.html` (200, TTL 0) error
responses; the function is backwards compatible with them.

**Ordering with the frontend deploy.** The function and the S3 objects are
independent: a new prerendered route serves the SPA shell until the function is
republished (still works, just not prerendered); a route removed from the list
before its object is deleted keeps serving its static HTML. Neither is a
breakage.
