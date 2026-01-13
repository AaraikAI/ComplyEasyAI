# Complete List of SQL Tables in ComplyEasy AI

This document lists all database tables implemented in the system, extracted from the Prisma schema.

## Total Tables: 70

### Core Tables

1. **Organization** - Organization/tenant information, subscription details, billing
2. **User** - User accounts, roles, authentication, 2FA settings
3. **TwoFactorBackupCode** - 2FA backup codes for user recovery
4. **Personnel** - Personnel management, onboarding/offboarding
5. **AccessReview** - Access review records and status

### Vendor Management

6. **Vendor** - Vendor information, risk levels, certifications
7. **VendorAssessment** - Vendor assessment records and scores
8. **VendorReview** - Vendor review history and findings
9. **VendorMonitor** - Vendor monitoring status and checks

### Compliance & Frameworks

10. **ComplianceFramework** - Compliance frameworks (SOC2, ISO27001, etc.)
11. **FrameworkControl** - Individual controls within frameworks
12. **ControlMapping** - Cross-framework control mappings
13. **EvidenceVersion** - Evidence file versioning history
14. **AISuggestion** - AI-suggested controls from smart upload
15. **CompliancePolicy** - Compliance-as-Code policies (OPA Rego)
16. **ComplianceGoal** - Compliance goals and targets
17. **ComplianceDebt** - Accumulated compliance debt tracking
18. **ComplianceTrajectory** - Compliance score predictions over time

### Risk Management

19. **RiskItem** - Risk register entries
20. **RiskAssessment** - Risk assessment records
21. **RiskPrediction** - AI-predicted future risks

### Questionnaires

22. **Questionnaire** - Questionnaire templates and instances
23. **QuestionnaireQuestion** - Individual questions within questionnaires
24. **QuestionnaireResponse** - User responses to questions

### Policies & Certificates

25. **Policy** - Compliance policies and documents
26. **TrustCertificate** - Trust certificates and attestations

### Reporting & Monitoring

27. **CustomReport** - Custom report templates and configurations
28. **ContinuousMonitor** - Continuous monitoring configurations
29. **MonitorResult** - Monitoring execution results

### Issue Management

30. **Issue** - Compliance issues and remediation tracking
31. **IssueComment** - Comments on issues

### Audit & Logging

32. **AuditLog** - Comprehensive audit trail of all actions

### Integrations

33. **Integration** - Connected third-party integrations

### Authentication

34. **MagicLink** - Magic link tokens for passwordless login

### File Management

35. **FileUpload** - File upload metadata and S3 references

### Billing & Subscriptions

36. **StripeEvent** - Stripe webhook event log
37. **SubscriptionHistory** - Subscription change history
38. **UsageTracking** - Usage metrics for tier enforcement

### API & Webhooks

39. **ApiKey** - API keys for external integrations
40. **Webhook** - Webhook configurations
41. **WebhookEvent** - Webhook event delivery log

### Demo & Sales

42. **DemoRequest** - Demo request lead capture

### aCOS (Advanced Compliance Operating System)

43. **ControlLoop** - OODA control loops for automated compliance
44. **ControlLoopHistory** - Control loop execution history
45. **ChangeImpact** - Change impact analysis and forecasting
46. **AgenticAction** - AI agent actions and approvals
47. **EvidenceAnalysis** - Evidence truth layer analysis
48. **RegulatoryChange** - Regulatory change tracking
49. **SimulationScenario** - Compliance simulation scenarios
50. **SimulationResult** - Simulation execution results
51. **RedTeamResult** - Red team exercise results
52. **SwarmInsight** - Federated swarm insights
53. **IoTDevice** - IoT device registration and tracking
54. **EdgeComplianceCheck** - Edge device compliance checks
55. **TranscriptionResult** - Audio/video transcription results

### Zero Trust Security

56. **DeviceTrust** - Device trust scores and verification
57. **ZeroTrustPolicy** - Zero trust security policies
58. **NetworkSegment** - Network segmentation and trust levels

### BYOK (Bring Your Own Key)

59. **KeyUsage** - Key usage tracking and statistics
60. **KeyRotationPolicy** - Key rotation policies and schedules

### VR Training

61. **VRTrainingScenario** - VR training scenario definitions
62. **VRTrainingSession** - VR training session records
63. **VRSessionPerformance** - VR session performance metrics

### NeuroSymbolic AI

64. **NeuroSymbolicReasoning** - Hybrid neural-symbolic reasoning records
65. **RuleInference** - Inferred compliance rules from patterns

### Federated Swarm

66. **FederatedSwarmPeer** - Federated swarm peer nodes
67. **FederatedSwarmAggregation** - Privacy-preserving aggregations

### Notifications

68. **Notification** - User notifications and delivery status
69. **NotificationPreference** - User notification preferences

### Chat

70. **ChatConversation** - Multi-turn chat conversation history

---

## Table Categories Summary

- **Core System**: 5 tables (Organization, User, Personnel, etc.)
- **Compliance**: 9 tables (Frameworks, Controls, Policies, etc.)
- **Risk Management**: 3 tables
- **Vendor Management**: 4 tables
- **aCOS Features**: 13 tables
- **Security Features**: 3 tables (Zero Trust, BYOK)
- **AI & Analytics**: 4 tables (NeuroSymbolic, Swarm, Predictions)
- **Training**: 3 tables (VR Training)
- **Integrations & APIs**: 3 tables
- **Notifications**: 2 tables
- **Other**: 21 tables (Audit, Files, Billing, etc.)

---

**Last Updated**: January 13, 2026
**Schema Version**: Based on Prisma schema in `server/prisma/schema.prisma`

