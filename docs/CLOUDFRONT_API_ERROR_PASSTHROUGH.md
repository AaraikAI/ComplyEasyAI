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

## Prerequisite: IAM permissions for the operator

The local CLI identity (`arn:aws:iam::267949707729:user/complyeasy-s3-user`) has
no CloudFront rights, so every step below fails with `AccessDenied` until an
administrator attaches this inline policy (or an equivalent managed one). Note
that `cloudfront:ListFunctions` is not resource-scoped and must be granted on
`"*"`; every other action here is scoped to the distribution or to functions.
`CreateFunction` is needed because the live distribution has **no** function
(see below); `DeleteFunction` only for cleanup/rollback of a function that was
never attached.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "DistributionReadWrite", "Effect": "Allow",
      "Action": ["cloudfront:GetDistribution", "cloudfront:GetDistributionConfig",
                 "cloudfront:UpdateDistribution", "cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::267949707729:distribution/E4CUOI17YEQ7E" },
    { "Sid": "FunctionReadWrite", "Effect": "Allow",
      "Action": ["cloudfront:CreateFunction", "cloudfront:DescribeFunction", "cloudfront:GetFunction",
                 "cloudfront:UpdateFunction", "cloudfront:TestFunction", "cloudfront:PublishFunction",
                 "cloudfront:DeleteFunction"],
      "Resource": "arn:aws:cloudfront::267949707729:function/*" },
    { "Sid": "FunctionList", "Effect": "Allow",
      "Action": "cloudfront:ListFunctions", "Resource": "*" }
  ]
}
```

From an administrator session (console or CLI), save the JSON as
`cloudfront-live-fix-policy.json` and run:

```bash
aws iam put-user-policy --user-name complyeasy-s3-user \
  --policy-name CloudFrontLiveFix-E4CUOI17YEQ7E \
  --policy-document file://cloudfront-live-fix-policy.json
```

Verify from the operator machine with
`aws cloudfront get-distribution-config --id E4CUOI17YEQ7E --query ETag`.
Remove the policy again after the change is verified
(`aws iam delete-user-policy --user-name complyeasy-s3-user --policy-name CloudFrontLiveFix-E4CUOI17YEQ7E`).

## Apply to the live distribution (console / CLI)

> The live distribution has drifted from the CDK `FrontendStack` (e.g. the
> `/ws/*` behaviour was added by hand). **Do not** run `cdk deploy
> ComplyEasy-Frontend` to apply this — it would try to reconcile that drift.
> Apply the two changes below directly; the CDK change in this repo keeps the
> IaC honest for a future re-baseline.

Distribution: `E4CUOI17YEQ7E` (www.complyeasyai.com).

> **Live state measured 2026-09-07:** the distribution has **no CloudFront
> function anywhere** (`list-functions` is empty; the default behaviour's
> `FunctionAssociations.Quantity` is 0), `DefaultRootObject` is empty, and the
> S3 origin is a REST endpoint behind OAC. So today *every* extension-less path,
> including `/`, is a 403 from S3 that the error page rewrites into the SPA
> shell, and prerendered pages are never served. Consequence: **the function
> must be created, published, and attached in the same `update-distribution`
> call that deletes the error pages.** Deleting the error pages first would
> serve S3's 403 XML on the home page.

1. **Create and publish the function.** Regenerate the rendered source first
   (`npm run sitemap`) so the route set is current.

   ```bash
   FN=complyeasy-production-route-rewrite
   SRC=infrastructure/cloudfront/route-rewrite.rendered.js
   aws cloudfront create-function --name "$FN" --runtime cloudfront-js-2.0 \
     --function-config "Comment=Serve prerendered public routes and the SPA shell; pass /api and files through,Runtime=cloudfront-js-2.0" \
     --function-code "fileb://$SRC"
   ETAG=$(aws cloudfront describe-function --name "$FN" --stage DEVELOPMENT --query ETag --output text)
   # Test on the DEVELOPMENT stage with the URIs from the table above, e.g.:
   printf '%s' '{"version":"1.0","context":{"eventType":"viewer-request"},"viewer":{"ip":"1.2.3.4"},"request":{"method":"GET","uri":"/soc2-compliance","querystring":{},"headers":{"host":{"value":"www.complyeasyai.com"}},"cookies":{}}}' > event.json
   aws cloudfront test-function --name "$FN" --if-match "$ETAG" --stage DEVELOPMENT \
     --event-object fileb://event.json --query 'TestResult.FunctionOutput' --output text
   aws cloudfront publish-function --name "$FN" --if-match "$ETAG"
   FN_ARN=$(aws cloudfront describe-function --name "$FN" --stage LIVE --query FunctionSummary.FunctionMetadata.FunctionARN --output text)
   ```

   If a function already exists (a future re-run), use `update-function` on it
   instead of `create-function`; the rest is identical.

2. **Attach the function and delete the custom error responses in ONE update.**

   ```bash
   aws cloudfront get-distribution-config --id E4CUOI17YEQ7E > dist.json
   ETAG=$(jq -r .ETag dist.json)
   jq --arg arn "$FN_ARN" '.DistributionConfig
       | .DefaultCacheBehavior.FunctionAssociations = {"Quantity":1,"Items":[{"FunctionARN":$arn,"EventType":"viewer-request"}]}
       | .CustomErrorResponses = {"Quantity":0}' dist.json > dist-config.json
   aws cloudfront update-distribution --id E4CUOI17YEQ7E --if-match "$ETAG" \
     --distribution-config file://dist-config.json
   ```

   Only the default (S3) behaviour gets the function; `/api/*`, `/health` and
   `/ws/*` keep routing to the Express origin untouched.

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

**Rollback.** `update-distribution` with the saved `dist.json` config (it
re-adds the two error responses and drops the association in one step); the
function is backwards compatible with the error responses, so leaving it
attached is also safe.

**Ordering with the frontend deploy.** The function and the S3 objects are
independent: a new prerendered route serves the SPA shell until the function is
republished (still works, just not prerendered); a route removed from the list
before its object is deleted keeps serving its static HTML. Neither is a
breakage.
