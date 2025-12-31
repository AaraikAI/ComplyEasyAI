# Master Verification Prompt for 100% Production Readiness

Use this prompt to get an accurate, verifiable assessment of production readiness.

---

## THE PROMPT

```
I need a COMPREHENSIVE, 100% ACCURATE production readiness assessment of this codebase.

## CRITICAL INSTRUCTIONS:

1. **DO NOT use Task/Explore agents** - Use ONLY direct file system commands (grep, cat, find, wc, ls)

2. **DO NOT trust compilation status as production readiness** - Code that compiles can still have mock/simulated implementations

3. **SCAN FOR ALL OF THESE PATTERNS** (case-insensitive, in ALL source files excluding tests):

### A. Simulation/Mock Keywords:
```bash
grep -rn "simulate|simulated|simulation" server/src/services --include="*.ts" | grep -v __tests__ | grep -v ".test.ts"
grep -rn "mock|Mock|MOCK" server/src/services --include="*.ts" | grep -v __tests__ | grep -v ".test.ts"
grep -rn "placeholder|Placeholder|PLACEHOLDER" server/src/services --include="*.ts" | grep -v __tests__
grep -rn "stub|Stub|STUB" server/src/services --include="*.ts" | grep -v __tests__
```

### B. Temporary/Incomplete Code:
```bash
grep -rn "For now" server/src/services --include="*.ts"
grep -rn "TODO:|FIXME:|XXX:|HACK:" server/src/services --include="*.ts"
grep -rn "would use|would be|would query|would create|would implement" server/src/services --include="*.ts"
grep -rn "in production" server/src/services --include="*.ts"
```

### C. Placeholder Values:
```bash
grep -rn "return null|return false|return true" server/src/services --include="*.ts" | head -50
grep -rn "throw new Error" server/src/services --include="*.ts" | grep -i "not implemented"
```

4. **CATEGORIZE EACH FINDING:**
   - **INTENTIONAL SIMULATION**: Red Team attacks, Monte Carlo simulations, Digital Twin what-if scenarios (these are FEATURES, not gaps)
   - **DEVELOPMENT FALLBACK**: Code that falls back to simulation but blocks in production (OK if production mode checks exist)
   - **NOT IMPLEMENTED**: Actual gaps where real implementation is needed

5. **VERIFY EACH SERVICE:**
   For each service file in `server/src/services/advanced/`:
   - Does it have simulation/mock code?
   - Is that simulation intentional (feature) or a gap?
   - Does it have "For now" or "TODO" comments?
   - Does it have "would use/would be" comments indicating missing implementation?

6. **BUILD VERIFICATION:**
```bash
cd server && npm run build 2>&1 | grep -c "error TS"  # Must be 0
cd .. && npm run build  # Must succeed
```

7. **TEST VERIFICATION:**
```bash
cd server && npm run test:unit 2>&1 | tail -10  # Check pass rate
cd .. && npm test 2>&1 | tail -10  # Check pass rate
```

8. **OUTPUT FORMAT:**

## SERVICE STATUS TABLE

| Service | File | Sim/Mock Count | Intentional? | Production Ready? |
|---------|------|----------------|--------------|-------------------|
| [name] | [file.ts] | [count] | [Yes/No] | [Yes/Partial/No] |

## PRODUCTION GAPS (Only non-intentional simulation code)

For each gap:
- File: [path]
- Line: [number]
- Code: [snippet]
- Issue: [what's simulated/mocked]
- Fix Required: [what real implementation is needed]

## FINAL SCORE

- Total Services: [N]
- 100% Production Ready: [N] ([%])
- Partially Ready (with intentional simulations): [N] ([%])
- Not Ready (has non-intentional mocks): [N] ([%])

## CRITICAL: DO NOT:
- Count intentional simulations (Red Team, Digital Twin, Monte Carlo) as production gaps
- Mark a service as "ready" just because it compiles
- Mark a service as "not ready" just because it has the word "simulation" (check context)
- Use any agent/task tool - all scans must be direct grep/cat commands
- Trust previous reports without verifying the claims yourself
```

---

## VERIFICATION CHECKLIST

Use this checklist to verify any production readiness claim:

### 1. Build Verification
- [ ] `cd server && npm run build` - 0 TypeScript errors?
- [ ] `npm run build` (frontend) - Builds successfully?

### 2. Mock/Simulation Scan
- [ ] Ran `grep -rn "simulate" server/src/services` excluding tests?
- [ ] Ran `grep -rn "mock" server/src/services` excluding tests?
- [ ] Ran `grep -rn "placeholder" server/src/services`?
- [ ] Ran `grep -rn "For now" server/src/services`?
- [ ] Ran `grep -rn "would use" server/src/services`?
- [ ] Ran `grep -rn "TODO:" server/src/services`?

### 3. Context Classification
For EACH finding, did you verify:
- [ ] Is this an intentional simulation (Red Team, Digital Twin, Monte Carlo)?
- [ ] Is this a development fallback with production guard?
- [ ] Is this an actual production gap?

### 4. Service-by-Service Review
For EACH service in `server/src/services/advanced/`:
- [ ] Read the first 100 lines to understand purpose
- [ ] Grep for simulation keywords
- [ ] Check if simulations are intentional (security testing, what-if analysis)
- [ ] Verify external API integrations are real (not mocked)

### 5. Infrastructure Requirements
- [ ] Which services need external infrastructure?
- [ ] OPA server for Compliance-as-Code?
- [ ] KMS credentials for BYOK?
- [ ] Whisper API for transcription?
- [ ] Blockchain nodes?

### 6. Test Coverage
- [ ] Backend test pass rate?
- [ ] Frontend test pass rate?
- [ ] Which critical paths are untested?

---

## SERVICES TO VERIFY (Priority Order)

### Tier 1 - Core (Should be 100% ready):
1. `authService.ts`
2. `complianceFrameworkService.ts`
3. `riskService.ts`
4. `auditService.ts`
5. `billingService.ts`

### Tier 2 - Security (Check for real vs mock):
6. `byokService.ts` - Real KMS integration?
7. `zeroTrustService.ts` - Real device verification?
8. `zeroKnowledgeService.ts` - Real proofs or fallback?

### Tier 3 - AI/ML (Highest risk of mocks):
9. `multimodalIntakeService.ts` - Real transcription/OCR?
10. `whisperService.ts` - Real API or placeholder?
11. `mlModelsService.ts` - Real models or simulated?
12. `evidenceTruthLayerService.ts` - Real analysis?

### Tier 4 - Advanced (Check intentional vs unintentional):
13. `redTeamService.ts` - Simulations are intentional
14. `complianceDigitalTwinService.ts` - Simulations are intentional
15. `blockchainService.ts` - Real or simulated?
16. `federatedSwarmService.ts` - Real aggregation?
17. `neuroSymbolicAIService.ts` - Real reasoning?

---

## RED FLAGS TO WATCH FOR

### Definite Production Gaps:
1. `"Return a placeholder"` - Not implemented
2. `"For now, simulate"` - Temporary mock
3. `"would use X in production"` - Not implemented
4. `"TODO: Implement"` - Incomplete
5. `"stub - implement if needed"` - Not done

### May Be Intentional (Verify):
1. `"simulateControlBypass"` - Red team feature
2. `"runSimulation"` - Digital twin feature
3. `"MonteCarloSimulation"` - Risk analysis feature

### Acceptable in Development:
1. `"In development, fallback to..."` - IF production guard exists
2. `if (!isProduction) { simulate... }` - OK if production path exists

---

## EXPECTED FINDINGS FOR THIS CODEBASE

Based on December 31, 2025 scan:

| Service | Expected Status |
|---------|-----------------|
| Core Platform (8) | 100% Ready |
| BYOK Encryption | 100% Ready |
| Zero Trust | 100% Ready |
| Red Team | 100% Ready (intentional simulations) |
| Digital Twin | 100% Ready (intentional simulations) |
| ZKP | 90% Ready (fallback blocked in prod) |
| Compliance-as-Code | 90% Ready (OPA required) |
| Multimodal Intake | 40% Ready (transcription mocked) |
| Whisper | 30% Ready (placeholder) |
| Blockchain | 40% Ready (simulated) |
| ML Models | 50% Ready (simulated) |
| Evidence Truth | 60% Ready (NTP, keys mocked) |
| Agentic AI | 70% Ready (TODOs) |
| VR Review | 70% Ready (mock scenarios) |
| Federated Swarm | 70% Ready (simulated metrics) |
| NeuroSymbolic | 60% Ready (mock reasoning) |
| Physical AI | 80% Ready (simulated network) |

---

## FINAL VERIFICATION COMMAND SEQUENCE

Run these commands in order to verify any claim:

```bash
# 1. Pull latest code
git checkout main && git pull origin main

# 2. Verify builds
cd server && npm install && npx prisma generate && npm run build
cd .. && npm run build

# 3. Count simulation instances (production services only)
echo "=== SIMULATION CODE ==="
grep -rn "simulate\|simulated\|simulation" server/src/services --include="*.ts" | grep -v __tests__ | grep -v "\.test\.ts" | wc -l

# 4. Count mock instances (production services only)
echo "=== MOCK CODE ==="
grep -rn "mock\|Mock\|MOCK" server/src/services --include="*.ts" | grep -v __tests__ | grep -v "\.test\.ts" | wc -l

# 5. Count temporary code
echo "=== TEMPORARY CODE ==="
grep -rn "For now" server/src/services --include="*.ts" | wc -l

# 6. Count not-implemented
echo "=== NOT IMPLEMENTED ==="
grep -rn "would use\|would be\|would query" server/src/services --include="*.ts" | wc -l

# 7. Count TODOs
echo "=== TODOs ==="
grep -rn "TODO:\|FIXME:\|XXX:" server/src/services --include="*.ts" | wc -l

# 8. Run tests
cd server && npm run test:unit 2>&1 | tail -5
cd .. && npm test 2>&1 | tail -5

# 9. Database model count
grep -c "^model " server/prisma/schema.prisma
```

---

**This prompt should give you 100% accurate production readiness assessment when followed exactly.**
