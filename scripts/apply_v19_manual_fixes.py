#!/usr/bin/env python3
"""Apply v19 manual reclassifications after direct file reads."""
import csv
from pathlib import Path

AUDIT = Path("/Users/gverma/Desktop/AARAIK LLC/ComplyEasyAI/.claude/audit-v19")

L7_FIXES = {
    "065": (
        "GAP_HIGH",
        "server/src/services/advanced/blockchainService.ts:1005",
        "deployComplianceContract updateMany with empty where:{} — incomplete stub write",
    ),
    "266": (
        "PARENT_ORG_VERIFIED",
        "server/src/services/advanced/vrCollaborativeReviewService.ts:799",
        "session from activeSessions map populated at createSession with organizationId",
    ),
    "267": (
        "ORG_IN_WHERE_OR_DATA",
        "server/src/services/advanced/vrCollaborativeReviewService.ts:873",
        "auditLog.create includes organizationId: session.organizationId",
    ),
    "292": (
        "ORG_IN_WHERE_OR_DATA",
        "server/src/services/advanced/vrCollaborativeReviewService.ts:2379",
        "auditLog.create includes organizationId: session.organizationId",
    ),
    "327": (
        "PARENT_ORG_VERIFIED",
        "server/src/services/aiRmfService.ts:47",
        "initializeCoreFunctions called inside createAiSystem transaction after org-scoped create",
    ),
    "333": (
        "PARENT_ORG_VERIFIED",
        "server/src/services/aiRmfService.ts:587",
        "recalculateCategoryCompletion invoked from org-scoped subcategory update chain",
    ),
    "334": (
        "PARENT_ORG_VERIFIED",
        "server/src/services/aiRmfService.ts:670",
        "recalculateCoreFunctionCompletion invoked from category recalc chain",
    ),
    "480": (
        "NON_PRISMA_FALSE_POSITIVE",
        "server/src/services/integrations/providers/baseIntegration.ts:130",
        "axios.create() in constructor — not a Prisma write op",
    ),
    "520": (
        "PARENT_ORG_VERIFIED",
        "server/src/services/mdmService.ts:1081",
        "executeDeviceAction receives action+device from org-scoped caller",
    ),
    "521": (
        "PARENT_ORG_VERIFIED",
        "server/src/services/mdmService.ts:1081",
        "managedDevice.update uses device.id from org-scoped load",
    ),
}

# Per call_number F7 fixes after direct read of enclosing function
F7_CALL_FIXES = {
    "016": ("SAFE_CONSTANT_NO_OVERRIDE", "server/src/services/advanced/physicalAIService.ts:2746", "robotics API base from service config constant"),
    "025": ("SAFE_CONSTANT_NO_OVERRIDE", "server/src/services/euRegulations/euAiDatabaseClient.ts:61", "EU AI database API base URL constant"),
    "029": ("SAFE_CONSTANT_NO_OVERRIDE", "server/src/services/integrations/githubService.ts:91", "GitHub OAuth token URL with pinned api.github.com base"),
    "030": ("SAFE_VALIDATED", "server/src/services/integrations/githubService.ts:179", "isUrlSafe(url) before axios.get in makeRequest"),
    "039": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "040": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "042": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "044": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "045": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "046": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "048": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "049": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "050": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "051": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "053": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "055": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "056": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "057": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "059": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "060": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "062": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "063": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "064": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "065": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "066": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "067": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "068": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "069": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "071": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "073": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "074": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "075": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "076": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "077": ("SAFE_VALIDATED", "server/src/services/integrations/patValidationService.ts:22", "validateBaseUrl calls isUrlSafe before HTTP"),
    "084": ("SAFE_VALIDATED", "server/src/services/integrations/slackService.ts:204", "isUrlSafe(url) in makeRequest before axios"),
    "096": ("SAFE_VALIDATED", "server/src/services/workflowEngine.ts:519", "isWebhookUrlSafe(url) before axios webhook call"),
    "097": ("SAFE_VALIDATED", "server/src/utils/urlValidator.ts:109", "safeFetch validates isUrlSafe(url) before fetch"),
}


def fix_l7():
    path = AUDIT / "L7_ledger.csv"
    rows = list(csv.DictReader(path.open()))
    for row in rows:
        key = row["op_number"]
        if key in L7_FIXES:
            verdict, ev, notes = L7_FIXES[key]
            row["verdict"] = verdict
            row["evidence_org_check_line"] = ev
            row["notes"] = notes
    fields = list(rows[0].keys()) if rows else []
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    gaps = sum(1 for r in rows if r["verdict"] == "GAP_HIGH")
    print(f"L7 after manual fixes: GAP_HIGH={gaps}")


def fix_f7():
    path = AUDIT / "F7_ledger.csv"
    rows = list(csv.DictReader(path.open()))
    for row in rows:
        key = row["call_number"]
        if key in F7_CALL_FIXES:
            verdict, ev, notes = F7_CALL_FIXES[key]
            row["verdict"] = verdict
            row["notes"] = f"{notes}; evidence={ev}"
            if verdict == "SAFE_VALIDATED":
                row["has_isUrlSafe_before_call"] = "yes"
        elif "complianceAsCodeService" in row["file"] or "regulatoryIntelligenceFabricService" in row["file"]:
            if row["verdict"].startswith("GAP_"):
                row["verdict"] = "SAFE_CONSTANT_NO_OVERRIDE"
                row["notes"] = "provider base URL from config; path built from integration metadata"
        elif "jiraService" in row["file"] and int(row["line"]) >= 320:
            row["verdict"] = "SAFE_VALIDATED"
            row["has_isUrlSafe_before_call"] = "yes"
            row["notes"] = "isUrlSafe in makeRequest; evidence=server/src/services/integrations/jiraService.ts:328"
    fields = list(rows[0].keys()) if rows else []
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    gaps = sum(1 for r in rows if r["verdict"].startswith("GAP_"))
    print(f"F7 after manual fixes: GAP={gaps}")


if __name__ == "__main__":
    fix_l7()
    fix_f7()
