# Open Policy Agent (OPA) Server Setup

This directory contains policies and setup instructions for the Compliance-as-Code service using Open Policy Agent (OPA).

## Status: OPTIONAL (Production Guard Enabled)

The Compliance-as-Code service has production guards:
- **Development**: Falls back to database-only policy storage if OPA unavailable
- **Production**: Requires OPA server running OR will throw error when policy evaluation is attempted

## What is OPA?

Open Policy Agent (OPA) is an open-source policy engine that enables policy-based control across the cloud-native stack. For ComplyEasyAI, OPA provides:

- **Policy-as-Code**: Write compliance policies in Rego language
- **Real-time Evaluation**: Evaluate policies against infrastructure/configuration changes
- **CI/CD Integration**: Automated compliance checks in deployment pipelines
- **Centralized Policy Management**: Single source of truth for compliance rules
- **Audit Trail**: Track all policy evaluations

## Quick Start (Development)

### Option 1: Docker (Recommended)

```bash
# Run OPA server
docker run -d \
  --name opa \
  -p 8181:8181 \
  openpolicyagent/opa:latest \
  run --server --log-level debug

# Verify it's running
curl http://localhost:8181/health
```

### Option 2: Binary

```bash
# Download OPA binary
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa

# Run OPA server
./opa run --server --log-level debug
```

### Configure Environment

Add to `.env`:

```bash
OPA_ENDPOINT=http://localhost:8181
```

## Production Deployment

### Option 1: Docker Compose (Simple)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  opa:
    image: openpolicyagent/opa:latest
    container_name: opa-server
    ports:
      - "8181:8181"
    command:
      - run
      - --server
      - --log-level=info
      - --log-format=json
    volumes:
      - ./policies:/policies
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8181/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Start:

```bash
docker-compose up -d opa
```

### Option 2: Kubernetes (Production)

Create `k8s/opa-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opa
  namespace: compliance
spec:
  replicas: 2
  selector:
    matchLabels:
      app: opa
  template:
    metadata:
      labels:
        app: opa
    spec:
      containers:
      - name: opa
        image: openpolicyagent/opa:latest
        ports:
        - containerPort: 8181
        args:
        - run
        - --server
        - --log-level=info
        - --log-format=json
        livenessProbe:
          httpGet:
            path: /health
            port: 8181
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8181
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: opa
  namespace: compliance
spec:
  selector:
    app: opa
  ports:
  - port: 8181
    targetPort: 8181
  type: ClusterIP
```

Deploy:

```bash
kubectl apply -f k8s/opa-deployment.yaml
```

### Option 3: Managed OPA (Styra DAS)

[Styra DAS](https://www.styra.com/) provides managed OPA:
- Hosted OPA servers
- Policy management UI
- Built-in compliance frameworks
- Enterprise support

Configuration:

```bash
# .env
OPA_ENDPOINT=https://your-org.styra.com/v1/systems/your-system-id
STYRA_TOKEN=your_styra_token
```

## Environment Variables

```bash
# OPA Server URL
OPA_ENDPOINT=http://localhost:8181

# Optional: Authentication (if OPA is secured)
OPA_AUTH_TOKEN=your_bearer_token

# Optional: TLS certificates (for production)
OPA_TLS_CA_CERT=/path/to/ca.crt
OPA_TLS_CLIENT_CERT=/path/to/client.crt
OPA_TLS_CLIENT_KEY=/path/to/client.key
```

## Sample Policies

### SOC 2 - Access Control Policy

Create `policies/soc2_access_control.rego`:

```rego
package soc2.access_control

# Rule: All access must be authenticated
deny[msg] {
  input.access_type == "unauthenticated"
  msg := "SOC 2 violation: Unauthenticated access not allowed"
}

# Rule: MFA required for admin access
deny[msg] {
  input.role == "admin"
  not input.mfa_enabled
  msg := "SOC 2 violation: MFA required for admin access"
}

# Rule: Access must be logged
deny[msg] {
  not input.audit_logged
  msg := "SOC 2 violation: All access must be logged"
}

# Allow if no violations
allow {
  count(deny) == 0
}
```

### HIPAA - Data Encryption Policy

Create `policies/hipaa_encryption.rego`:

```rego
package hipaa.encryption

# Rule: PHI must be encrypted at rest
deny[msg] {
  input.data_type == "PHI"
  input.encryption_at_rest == false
  msg := "HIPAA violation: PHI must be encrypted at rest"
}

# Rule: PHI must be encrypted in transit
deny[msg] {
  input.data_type == "PHI"
  input.encryption_in_transit == false
  msg := "HIPAA violation: PHI must be encrypted in transit"
}

# Rule: Minimum encryption standard
deny[msg] {
  input.encryption_algorithm == "DES"
  msg := "HIPAA violation: DES is not acceptable, use AES-256"
}

# Allow if no violations
allow {
  count(deny) == 0
}
```

### ISO 27001 - Password Policy

Create `policies/iso27001_password.rego`:

```rego
package iso27001.password

# Rule: Minimum password length
deny[msg] {
  input.password_length < 12
  msg := "ISO 27001 violation: Password must be at least 12 characters"
}

# Rule: Password complexity
deny[msg] {
  not has_uppercase(input.password)
  msg := "ISO 27001 violation: Password must contain uppercase letters"
}

deny[msg] {
  not has_lowercase(input.password)
  msg := "ISO 27001 violation: Password must contain lowercase letters"
}

deny[msg] {
  not has_number(input.password)
  msg := "ISO 27001 violation: Password must contain numbers"
}

deny[msg] {
  not has_special(input.password)
  msg := "ISO 27001 violation: Password must contain special characters"
}

# Rule: Password rotation
deny[msg] {
  input.days_since_change > 90
  msg := "ISO 27001 violation: Password must be changed every 90 days"
}

# Helper functions
has_uppercase(password) {
  regex.match(`[A-Z]`, password)
}

has_lowercase(password) {
  regex.match(`[a-z]`, password)
}

has_number(password) {
  regex.match(`[0-9]`, password)
}

has_special(password) {
  regex.match(`[!@#$%^&*(),.?":{}|<>]`, password)
}

# Allow if no violations
allow {
  count(deny) == 0
}
```

## Loading Policies to OPA

### Via API (Programmatic)

The Compliance-as-Code service automatically uploads policies to OPA when you create them:

```typescript
const policy = await complianceAsCodeService.createPolicy({
  organizationId: 'org_123',
  name: 'SOC 2 Access Control',
  framework: 'SOC2',
  rego: `<rego code>`,
  severity: 'high',
  tags: ['access-control', 'authentication']
});
```

### Via CLI (Manual)

```bash
# Upload a single policy
curl -X PUT http://localhost:8181/v1/policies/soc2_access_control \
  --data-binary @policies/soc2_access_control.rego

# Verify policy is loaded
curl http://localhost:8181/v1/policies/soc2_access_control
```

## Testing Policies Locally

### Using OPA CLI

```bash
# Evaluate policy with test data
opa eval --data policies/soc2_access_control.rego \
  --input test_data.json \
  'data.soc2.access_control.allow'

# Run OPA tests
opa test policies/
```

### Using Compliance-as-Code Service

```typescript
const result = await complianceAsCodeService.evaluatePolicy({
  policyId: 'policy_123',
  input: {
    access_type: 'authenticated',
    role: 'admin',
    mfa_enabled: true,
    audit_logged: true
  }
});

console.log('Allowed:', result.allowed);
console.log('Violations:', result.violations);
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/compliance-check.yml`:

```yaml
name: Compliance Check

on:
  pull_request:
    branches: [main]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa

      - name: Run Compliance Checks
        run: |
          ./opa eval --data policies/ \
            --input config.json \
            'data.compliance.allow'

      - name: Notify ComplyEasyAI
        run: |
          curl -X POST https://api.complyeasyai.com/api/compliance/ci-webhook \
            -H "Authorization: Bearer ${{ secrets.COMPLIANCE_TOKEN }}" \
            -d '{"result": "passed", "commit": "${{ github.sha }}"}'
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
compliance-check:
  image: openpolicyagent/opa:latest
  stage: test
  script:
    - opa eval --data policies/ --input config.json 'data.compliance.allow'
  only:
    - merge_requests
```

## Monitoring & Observability

### Health Check

```bash
curl http://localhost:8181/health
```

Response:
```json
{"status": "ok"}
```

### Policy Coverage

```bash
# List all loaded policies
curl http://localhost:8181/v1/policies

# Get specific policy
curl http://localhost:8181/v1/policies/soc2_access_control
```

### Decision Logs

Enable decision logging in production:

```bash
docker run -d \
  --name opa \
  -p 8181:8181 \
  -v $(pwd)/logs:/logs \
  openpolicyagent/opa:latest \
  run --server \
  --log-level info \
  --decision-logs-console
```

## Security Considerations

1. **Network Security**:
   - Use TLS in production
   - Restrict OPA access to trusted networks
   - Use authentication tokens

2. **Policy Security**:
   - Review all policies before deployment
   - Use version control for policies
   - Implement policy approval workflow

3. **Data Privacy**:
   - Don't send sensitive data to OPA in plain text
   - Use hashes or encrypted values where possible
   - Sanitize decision logs

## Troubleshooting

### OPA Server Not Responding

```bash
# Check if OPA is running
docker ps | grep opa

# Check OPA logs
docker logs opa

# Test connectivity
curl -v http://localhost:8181/health
```

### Policy Upload Failed

```bash
# Validate Rego syntax
opa check policies/your_policy.rego

# Test policy compilation
opa build policies/
```

### Policy Evaluation Error

```bash
# Check policy exists
curl http://localhost:8181/v1/policies/your_policy

# Test with sample data
opa eval --data policies/ --input test.json 'data.your_policy.allow'
```

## Alternative: Disable Compliance-as-Code

If you don't need OPA-based policy evaluation:

1. Don't set up OPA server
2. Service will fall back to database-only policy storage in development
3. In production, policy evaluation will throw error (fail-safe behavior)
4. This is a valid configuration if you use other compliance validation methods

## Resources

- OPA Documentation: https://www.openpolicyagent.org/docs/
- Rego Language: https://www.openpolicyagent.org/docs/latest/policy-language/
- OPA Playground: https://play.openpolicyagent.org/
- Styra Academy: https://academy.styra.com/
- Policy Library: https://github.com/open-policy-agent/library

## Support

For OPA setup and policy development support:
- OPA Slack: https://slack.openpolicyagent.org/
- OPA GitHub: https://github.com/open-policy-agent/opa
- ComplyEasyAI documentation
