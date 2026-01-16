# Early Warnings System - Complete Documentation

## Overview
The Early Warnings system in the aCOS Dashboard is a predictive monitoring feature that identifies potential compliance risks, control failures, and regulatory changes before they occur. It uses Temporal Graph Network (TGN) technology to analyze historical patterns and predict future issues.

---

## 🔗 **Where It's Connected To**

### 1. **Backend Service Layer**
- **Primary Service**: `server/src/services/advanced/temporalGraphNetworkService.ts`
  - Core service that generates early warnings
  - Implements prediction algorithms and warning logic

### 2. **API Endpoints**
- **Route**: `GET /api/acos/tgn/early-warnings`
- **Controller**: `server/src/controllers/acosController.ts` → `getEarlyWarnings()`
- **Route File**: `server/src/routes/acos.ts` (line 67)

### 3. **Frontend Integration**
- **Component**: `components/ACOSDashboard.tsx`
  - Displays warnings in the Overview tab
  - Shows top 5 warnings with severity badges
  - API Call: `api.acos.getEarlyWarnings(3)` - fetches warnings for 3 months horizon

### 4. **Data Sources (What It Monitors)**
The system connects to and analyzes data from:

#### a) **Risk Predictions**
- **Source**: `predictFutureRisks()` method
- **Data**: Historical risk items from `RiskItem` table
- **Analysis**: Last 100 risks, temporal patterns, ML predictions
- **Threshold**: Warnings generated for risks with:
  - Probability > 60%
  - Severity = 'Critical' or 'High'

#### b) **Compliance Trajectories**
- **Source**: `predictComplianceTrajectory()` method
- **Data**: All compliance frameworks for the organization
- **Analysis**: Framework score trends (improving/stable/declining)
- **Warning Trigger**: When trajectory trend = 'declining'

#### c) **Control Failures**
- **Source**: `FrameworkControl` table
- **Data**: Controls with status 'Pending' or 'Not_Implemented'
- **Analysis**: Historical risk patterns related to controls
- **Warning Trigger**: When controls have associated risks indicating potential failure

#### d) **Regulatory Changes**
- **Source**: `RegulatoryChange` table
- **Data**: Upcoming regulations with effective dates
- **Analysis**: Regulations effective within the time horizon
- **Warning Trigger**: Regulations with status 'pending' and effective date within horizon

### 5. **Notification Channels**
- **Email**: Via `notificationService.sendNotification()`
- **Slack**: If Slack integration is connected
- **Webhooks**: Via `webhookService.dispatchEvent()` with event type `'tgn.early_warning'`
- **WebSocket**: Real-time notifications to connected clients

### 6. **Database Tables**
- `RiskItem` - Historical risk data for predictions
- `ComplianceFramework` - Framework data for trajectory analysis
- `FrameworkControl` - Control status for failure predictions
- `RegulatoryChange` - Upcoming regulatory changes
- `AuditLog` - Warning acknowledgments and history
- `Integration` - Slack/webhook integrations for notifications
- `User` - Admin/editor users who receive notifications

---

## ⏰ **When It Monitors**

### **Monitoring Trigger: On-Demand (Not Scheduled)**
⚠️ **Important**: The Early Warnings system does NOT run automatically on a schedule. It is triggered:

1. **When Dashboard Loads**
   - Frontend calls `api.acos.getEarlyWarnings(3)` on component mount
   - Location: `components/ACOSDashboard.tsx` line 123
   - Default time horizon: 3 months

2. **When User Requests Warnings**
   - API endpoint: `GET /api/acos/tgn/early-warnings?months=3`
   - Can be called programmatically or via API
   - Supports query parameters:
     - `months` - Time horizon (default: 3)
     - `severity` - Filter by severity level
     - `type` - Filter by warning type
     - `acknowledged` - Filter by acknowledgment status

3. **After Data Updates**
   - Warnings are recalculated when:
     - New risks are detected
     - Compliance scores change
     - Controls are updated
     - Regulatory changes are added
   - However, warnings are only generated when the API is called

### **Real-Time Monitoring (Notifications)**
- Notifications are sent **immediately** when warnings are generated
- Escalation checks happen **on each API call**:
  - Critical warnings: Escalate if unacknowledged > 24 hours
  - High warnings: Escalate if unacknowledged > 72 hours

---

## 🔍 **How It Monitors**

### **Step-by-Step Monitoring Process**

#### **Step 1: Risk Prediction Analysis**
```typescript
// Location: temporalGraphNetworkService.ts, line 675
const riskPredictions = await this.predictFutureRisks(organizationId, timeHorizonMonths);
```
- Fetches last 100 historical risks
- Builds temporal graph of risk patterns
- Uses ML models to predict future risks
- Filters for high-probability (>60%), high-severity risks

#### **Step 2: Compliance Trajectory Analysis**
```typescript
// Location: temporalGraphNetworkService.ts, line 704
const trajectory = await this.predictComplianceTrajectory(framework.id, organizationId, timeHorizonMonths);
```
- Analyzes each compliance framework
- Predicts score trajectory (improving/stable/declining)
- Generates warnings for declining frameworks
- Includes sensitivity analysis (key factors causing decline)

#### **Step 3: Control Failure Detection**
```typescript
// Location: temporalGraphNetworkService.ts, line 732
const controls = await prisma.frameworkControl.findMany({
  where: { status: { in: ['Pending', 'Not_Implemented'] } }
});
```
- Identifies controls at risk (Pending/Not_Implemented)
- Checks for related historical risks
- Predicts failure within 30 days if risks exist
- Confidence: 70% (based on historical patterns)

#### **Step 4: Regulatory Change Detection**
```typescript
// Location: temporalGraphNetworkService.ts, line 769
const upcomingRegulations = await prisma.regulatoryChange.findMany({
  where: {
    effectiveDate: { gte: new Date(), lte: horizonDate },
    status: 'pending'
  }
});
```
- Finds regulations effective within time horizon
- Calculates lead time (days until effective)
- Severity based on number of affected frameworks
- Confidence: 95% (regulatory dates are usually certain)

#### **Step 5: Warning Filtering & Sorting**
- Applies filters (severity, type, acknowledged status)
- Sorts by:
  1. Severity (Critical > High > Medium > Low)
  2. Lead time (shorter = more urgent)

#### **Step 6: Escalation Logic**
```typescript
// Location: temporalGraphNetworkService.ts, line 845
const escalationThreshold = warning.severity === 'Critical' ? 24 : 72;
escalated = warningAge > escalationThreshold;
```
- Checks if warnings are unacknowledged
- Escalates based on severity and age
- Marks warnings as escalated for priority handling

#### **Step 7: Notification Dispatch**
```typescript
// Location: temporalGraphNetworkService.ts, line 869
await this.sendWarningNotifications(organizationId, unacknowledgedWarnings);
```
- Sends to all admin/editor users in organization
- Channels: Email, WebSocket, Slack (if connected), Webhooks
- Includes warning details, predicted date, lead time, recommended actions

---

## 📊 **Warning Types & Criteria**

### **1. Risk Warnings**
- **Type**: `'risk'`
- **Trigger**: Predicted probability > 60% AND severity = 'Critical' or 'High'
- **Data Source**: Historical risk patterns
- **Lead Time**: Calculated from predicted date
- **Confidence**: From ML model prediction

### **2. Compliance Decline Warnings**
- **Type**: `'compliance_decline'`
- **Trigger**: Framework trajectory trend = 'declining'
- **Data Source**: Compliance framework scores over time
- **Severity**: Always 'High'
- **Confidence**: From trajectory prediction model

### **3. Control Failure Warnings**
- **Type**: `'control_failure'`
- **Trigger**: Control status = 'Pending'/'Not_Implemented' AND related risks exist
- **Data Source**: Control status + historical risks
- **Severity**: 'Critical' if related risk is Critical, else 'High'
- **Predicted Date**: 30 days from detection
- **Confidence**: 70% (fixed)

### **4. Regulatory Change Warnings**
- **Type**: `'regulatory_change'`
- **Trigger**: Regulation effective date within time horizon AND status = 'pending'
- **Data Source**: RegulatoryChange table
- **Severity**: 'High' if affects >2 frameworks, else 'Medium'
- **Confidence**: 95% (fixed - regulatory dates are certain)

---

## 🔔 **Notification System**

### **Recipients**
- All users with role: `'admin'` or `'editor'`
- Organization-scoped (only users in same organization)

### **Channels**
1. **Email**: Standard email notifications
2. **WebSocket**: Real-time browser notifications
3. **Slack**: If Slack integration is connected
4. **Webhooks**: External system integration via `tgn.early_warning` event

### **Notification Content**
- Warning type and severity
- Description of the predicted issue
- Predicted date
- Lead time (days until issue)
- Recommended action
- Link to detailed view

---

## 📈 **Warning Acknowledgment & Tracking**

### **Acknowledgment System**
- **Endpoint**: `POST /api/acos/tgn/early-warnings/:warningId/acknowledge`
- **Stored In**: `AuditLog` table with action `'tgn.warning_acknowledged'`
- **False Positive Tracking**: Can mark warnings as false positives
- **History**: `GET /api/acos/tgn/early-warnings/history` - Get warning history

### **Escalation Rules**
- **Critical Warnings**: Escalate if unacknowledged > 24 hours
- **High Warnings**: Escalate if unacknowledged > 72 hours
- **Escalation Status**: Stored in warning object as `escalated: true`

---

## 🎯 **Configuration & Parameters**

### **Time Horizon**
- **Default**: 3 months
- **Supported**: 1, 3, 6, 12 months
- **Usage**: `GET /api/acos/tgn/early-warnings?months=6`

### **Filters**
- `severity`: Filter by 'Critical', 'High', 'Medium', 'Low'
- `type`: Filter by 'risk', 'compliance_decline', 'control_failure', 'regulatory_change'
- `acknowledged`: Filter by `true` or `false`

### **Thresholds**
- **Risk Probability**: > 60% triggers warning
- **Risk Severity**: Only 'Critical' or 'High' generate warnings
- **Compliance Decline**: Any declining trend triggers warning
- **Control Failure**: Any pending/not_implemented control with risks triggers warning

---

## 🔄 **Data Flow Diagram**

```
User Opens Dashboard
    ↓
Frontend calls getEarlyWarnings(3)
    ↓
API: GET /api/acos/tgn/early-warnings?months=3
    ↓
Controller: getEarlyWarnings()
    ↓
Service: temporalGraphNetworkService.getEarlyWarnings()
    ↓
┌─────────────────────────────────────┐
│ 1. predictFutureRisks()             │ → Risk Warnings
│ 2. predictComplianceTrajectory()    │ → Compliance Decline Warnings
│ 3. Check Control Status + Risks     │ → Control Failure Warnings
│ 4. Check Regulatory Changes         │ → Regulatory Change Warnings
└─────────────────────────────────────┘
    ↓
Filter & Sort Warnings
    ↓
Check Escalation Status
    ↓
Send Notifications (if unacknowledged)
    ↓
Return Warnings to Frontend
    ↓
Display in Dashboard
```

---

## ⚠️ **Important Notes**

1. **Not Scheduled**: The system does NOT run automatically. Warnings are generated on-demand when the API is called.

2. **Real-Time Notifications**: Notifications are sent immediately when warnings are generated during API calls.

3. **Data Freshness**: Warnings reflect the current state of data at the time of API call. For real-time monitoring, the API should be called periodically.

4. **ML Model Dependency**: Risk predictions use ML models. If models fail, fallback algorithms are used.

5. **Performance**: Analysis of all frameworks and controls can be resource-intensive. Consider caching for high-traffic scenarios.

6. **False Positive Rate**: Target is <10% false positives. Users can mark warnings as false positives for learning.

---

## 🚀 **Recommended Implementation for Scheduled Monitoring**

To enable scheduled/background monitoring, you would need to:

1. **Add Scheduled Job** (using node-cron or similar):
```typescript
// Example: Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  const organizations = await prisma.organization.findMany();
  for (const org of organizations) {
    await temporalGraphNetworkService.getEarlyWarnings(org.id, 3);
  }
});
```

2. **Background Worker**: Use a job queue (Bull, BullMQ) to process warnings asynchronously

3. **Cache Results**: Store warnings in database/cache to avoid recalculation on every dashboard load

---

## 📝 **API Reference**

### **Get Early Warnings**
```http
GET /api/acos/tgn/early-warnings?months=3&severity=Critical&type=risk&acknowledged=false
```

### **Acknowledge Warning**
```http
POST /api/acos/tgn/early-warnings/:warningId/acknowledge
Body: { "falsePositive": false }
```

### **Get Warning History**
```http
GET /api/acos/tgn/early-warnings/history
```

---

**Last Updated**: January 2025
**Service Version**: v3.0
**Status**: Production Ready ✅

