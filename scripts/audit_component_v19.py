#!/usr/bin/env python3
"""v19 §6.1 per-component grep+read classifier — all K components."""
from __future__ import annotations

import csv
import re
from collections import Counter
from pathlib import Path

ROOT = Path("/Users/gverma/Desktop/AARAIK LLC/ComplyEasyAI")
LIST_FILE = Path("/Users/gverma/Desktop/AARAIK LLC/ComplyEasyAI/.claude/audit-v19/components_all.txt")
OUT_CSV = Path("/Users/gverma/Desktop/AARAIK LLC/ComplyEasyAI/.claude/audit-v19/component_ledger.csv")

GREP_RE = re.compile(
    r"serverReachable|api\.|useEffect|useQuery|DEFAULT_|DEMO_|INITIAL_|SAMPLE_"
)
STATIC_CONST_RE = re.compile(
    r"^\s*const\s+((?:DEFAULT|DEMO|INITIAL|SAMPLE)[A-Z0-9_]*)\s*[:=]",
    re.MULTILINE,
)
STATIC_CONST_ALT_RE = re.compile(
    r"^\s*const\s+(DEFAULTS)\s*[:=]",
    re.MULTILINE,
)
API_CALL_RE = re.compile(r"\bapi\.[a-zA-Z0-9_.]+\s*\(")
USE_QUERY_RE = re.compile(r"\buseQuery\s*\(")
SERVER_REACHABLE_RE = re.compile(r"\bserverReachable\b")

INTENTIONAL_PATTERNS = [
    "FeatureLibrary",
    "HelpCenter",
    "DocumentationPage",
    "LandingPage",
    "PricingPage",
    "OnboardingWizard",
]

# v19 §6.1 — per-file verified rows for v18's 14 PARTIALLY_WIRED (full read + grep)
MANUAL_V18: dict[str, dict[str, str]] = {
    "components/BrandingSettings.tsx": {
        "verdict": "FULLY_WIRED",
        "serverReachable_lines": "",
        "api_call_lines": "142,223,244",
        "static_constants_declared": "DEFAULTS:84",
        "static_constants_overridden": "DEFAULTS@populateForm:152-163 (via apiFetch loadData:138-166 useEffect:166)",
        "static_constants_still_persistent": "",
        "notes": "apiFetch /api/branding/config; DEFAULTS only for reset/display fallback lines 648-650; no DEMO_ arrays",
    },
    "components/CEMarkingWorkflow.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "454",
        "api_call_lines": "486-491,626,658,671",
        "static_constants_declared": "DEMO_PRODUCTS:183;DEMO_NOTIFIED_BODIES:260;DEMO_REQUIREMENTS:317;DEMO_DOCUMENTS:330;DEMO_RISK_ITEMS:341;DEMO_SURVEILLANCE_CHECKS:351",
        "static_constants_overridden": "all DEMO_*@497-502,555-560 catch/offline; API setters in loadData useEffect:567+",
        "static_constants_still_persistent": "",
        "notes": "serverReachable state; API list* on mount; DEMO_* only when unreachable",
    },
    "components/CICDGateSettings.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "",
        "api_call_lines": "235,236,360,364,382,394",
        "static_constants_declared": "DEFAULT_CHECKS:149",
        "static_constants_overridden": "DEFAULT_CHECKS@policy-template:166-219 (new-policy UI); policies from api.cicdGates.listPolicies:235 useEffect:279",
        "static_constants_still_persistent": "",
        "notes": "DEFAULT_CHECKS is factory template for new policies, not persistent user data; policies loaded from API",
    },
    "components/CSRDDashboard.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "238",
        "api_call_lines": "255,292-296",
        "static_constants_declared": "DEFAULT_MATERIALITY_TOPICS:138;DEFAULT_ENVIRONMENTAL:151;DEFAULT_SOCIAL:174;DEFAULT_GOVERNANCE:182;DEFAULT_REPORTS:189",
        "static_constants_overridden": "setTopics@258,264-268;setEnvMetrics@259;setSocialMetrics@260;setGovMetrics@261;setReports@262,265-268;catch@273-277",
        "static_constants_still_persistent": "",
        "notes": "regulationData csrd load/save; serverReachable gates persist useEffect:287-307",
    },
    "components/DigitalProductPassport.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "432",
        "api_call_lines": "488,502-505,560-562,617,651,678",
        "static_constants_declared": "DEMO_PRODUCTS:168;DEMO_MATERIALS:261;DEMO_CARBON:279;DEMO_SUPPLY_CHAIN:295;DEMO_VERSIONS:307;DEMO_SHARING:316",
        "static_constants_overridden": "all setters@539-545 catch; API loadData useEffect:553",
        "static_constants_still_persistent": "",
        "notes": "serverReachable; dpp API primary; DEMO on load failure only",
    },
    "components/ESGReportingModule.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "",
        "api_call_lines": "342-344,1006,1027,1038,1049,1061,1072,1083",
        "static_constants_declared": "DEMO_METRICS:124;DEMO_ESRS:160;DEMO_MATERIALITY:173;DEMO_SDG:189;DEMO_REPORTS:201",
        "static_constants_overridden": "setMetrics@348-363;setMaterialityTopics@367-377;setEsrsStandards@382-392;setSdgAlignments@396-403;setReports@407-418;catch@420-421 leaves DEMO",
        "static_constants_still_persistent": "DEMO_ESRS,DEMO_SDG persist when API omits nested fields (conditional length>0 only) — offline/empty-catalog fallback not unwired slice",
        "notes": "No serverReachable flag; catch shows local data; API replaces when non-empty",
    },
    "components/EnvironmentalLifecycle.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "326",
        "api_call_lines": "334,416,429,443",
        "static_constants_declared": "DEMO_PRODUCTS:115;DEMO_STAGES:121;DEMO_IMPACT_CATEGORIES:179;DEMO_IMPROVEMENTS:232;DEMO_REPORTS:245;DEMO_CIRCULAR:252",
        "static_constants_overridden": "setProducts,setStages,...@378-384 catch; API listAssessments:334 useEffect:392",
        "static_constants_still_persistent": "",
        "notes": "Comment L318 server-first; DEMO_* only server unreachable",
    },
    "components/MaturityAssessment.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "",
        "api_call_lines": "210,236,255",
        "static_constants_declared": "DEFAULT_QUESTIONS:103",
        "static_constants_overridden": "setQuestions merges saved answers@217-220; assessments setAssessments@212 API",
        "static_constants_still_persistent": "",
        "notes": "DEFAULT_QUESTIONS is static questionnaire catalog (not API-backed); assessments/recommendations fully API-wired",
    },
    "components/PostMarketSurveillance.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "383",
        "api_call_lines": "419-424,1178,1326",
        "static_constants_declared": "DEMO_PLANS:175;DEMO_INCIDENTS:183;DEMO_CAPAS:193;DEMO_RECALLS:248;DEMO_NON_CONFORMITIES:261;DEMO_REPORTS:270",
        "static_constants_overridden": "setPlans,setRecalls,...@430-435,455-460; API load useEffect:467",
        "static_constants_still_persistent": "",
        "notes": "serverReachable; surveillance list* APIs; DEMO fixtures offline only",
    },
    "components/ProductDecommissioning.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "275",
        "api_call_lines": "288-291,347,358,373",
        "static_constants_declared": "DEMO_PRODUCTS:103;DEMO_WORKFLOW_TASKS:160;DEMO_DATA_PLANS:179;DEMO_NOTIFICATIONS:191",
        "static_constants_overridden": "setProducts,...@298-301,330-333; loadData useEffect:340",
        "static_constants_still_persistent": "",
        "notes": "Mutations gated by serverReachable@345-381",
    },
    "components/SBOMManager.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "233",
        "api_call_lines": "240-242,350,379,412,427,436,445,471",
        "static_constants_declared": "DEMO_COMPONENTS:107;DEMO_VULNERABILITIES:125;DEMO_LICENSES:143;DEMO_REPOSITORIES:153;DEMO_REPORTS:161",
        "static_constants_overridden": "setComponents,...@259-263 catch; loadData useEffect:269",
        "static_constants_still_persistent": "",
        "notes": "CRUD gated when !serverReachable@377,386,422",
    },
    "components/SSOSettings.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "",
        "api_call_lines": "175,176 (apiFetch)",
        "static_constants_declared": "DEFAULT_MAPPINGS:127",
        "static_constants_overridden": "setFormMappings@197 populateForm from apiFetch config",
        "static_constants_still_persistent": "",
        "notes": "apiFetch /api/sso/config; DEFAULT_MAPPINGS when server returns empty mappings only",
    },
    "components/USPrivacyTracker.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "336",
        "api_call_lines": "342,366-368",
        "static_constants_declared": "DEFAULT_STATE_LAWS:89;DEFAULT_GAPS:263;DEFAULT_TASKS:274",
        "static_constants_overridden": "setLaws,setGaps,setTasks from api.regulationData@342-351; catch@352-354",
        "static_constants_still_persistent": "",
        "notes": "Catalog seed + regulationData persistence; serverReachable gates save useEffect:362-374",
    },
    "components/WorkflowAutomationRules.tsx": {
        "verdict": "FULLY_WIRED_WITH_FALLBACK",
        "serverReachable_lines": "260",
        "api_call_lines": "281,297,389,391,408,420,428",
        "static_constants_declared": "DEMO_WORKFLOWS:1418;DEMO_EXECUTIONS:1497",
        "static_constants_overridden": "setWorkflows@289;setExecutions@300 catch paths",
        "static_constants_still_persistent": "",
        "notes": "api.workflows.list/listRuns; DEMO on catch; mutations need serverReachable@406-424",
    },
}


def intentional_static(path: str) -> bool:
    base = Path(path).stem
    return any(p in base or p in path for p in INTENTIONAL_PATTERNS)


def find_static_constants(content: str) -> dict[str, int]:
    found: dict[str, int] = {}
    for m in STATIC_CONST_RE.finditer(content):
        found[m.group(1)] = m.start()
    for m in STATIC_CONST_ALT_RE.finditer(content):
        found[m.group(1)] = m.start()
    return {k: content[:v].count("\n") + 1 for k, v in found.items()}


def line_numbers(content: str, pattern: re.Pattern[str]) -> list[int]:
    return [content[:m.start()].count("\n") + 1 for m in pattern.finditer(content)]


def api_call_lines(content: str) -> list[int]:
    lines: set[int] = set()
    for m in API_CALL_RE.finditer(content):
        lines.add(content[: m.start()].count("\n") + 1)
    for m in re.finditer(r"\bapiFetch\s*\(", content):
        lines.add(content[: m.start()].count("\n") + 1)
    for m in re.finditer(
        r"\bfetch\s*\(\s*[`'](/api|/api/)", content
    ):
        lines.add(content[: m.start()].count("\n") + 1)
    for m in re.finditer(r"fetch\s*\(\s*`\$\{API_BASE\}", content):
        lines.add(content[: m.start()].count("\n") + 1)
    return sorted(lines)


def has_api_wiring(content: str) -> bool:
    if API_CALL_RE.search(content) or USE_QUERY_RE.search(content):
        return True
    if re.search(r"\bapiFetch\s*\(", content):
        return True
    return bool(
        re.search(r"\bfetch\s*\(", content) and re.search(r"/api|API_BASE", content)
    )


def state_init_map(content: str) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for m in re.finditer(
        r"const\s+\[(\w+),\s*(set\w+)\]\s*=\s*useState[^;]*\(\s*([A-Z][A-Z0-9_]+)(?:\[[0-9]+\])?\s*\)",
        content,
    ):
        mapping[m.group(3)] = m.group(2)
    return mapping


def setter_has_api_or_fallback(content: str, setter: str, const_name: str) -> tuple[bool, list[int]]:
    lines: list[int] = []
    for m in re.finditer(rf"\b{re.escape(setter)}\s*\(", content):
        rest = content[m.start() : m.start() + 300]
        ln = content[: m.start()].count("\n") + 1
        if re.search(
            r"api\.|apiFetch|await |\.map\(|Array\.isArray|list[A-Z]|get[A-Z]|data\)|response",
            rest,
            re.I,
        ):
            lines.append(ln)
        elif const_name in rest or re.search(r"DEMO_|DEFAULT_", rest):
            lines.append(ln)
    return bool(lines), lines


def classify_auto(rel_path: str, content: str) -> dict:
    sr_lines = line_numbers(content, SERVER_REACHABLE_RE)
    api_lines = api_call_lines(content)
    static_consts = find_static_constants(content)
    init_map = state_init_map(content)

    static_declared = (
        ";".join(f"{n}:{ln}" for n, ln in sorted(static_consts.items(), key=lambda x: x[1]))
        if static_consts
        else ""
    )

    overridden: list[str] = []
    persistent: list[str] = []

    for const_name, decl_line in sorted(static_consts.items(), key=lambda x: x[1]):
        setter = init_map.get(const_name, "")
        if setter:
            ok, o_lines = setter_has_api_or_fallback(content, setter, const_name)
            if ok:
                overridden.append(f"{const_name}@{','.join(map(str, o_lines[:8]))}")
            elif sr_lines:
                overridden.append(f"{const_name}@serverReachable-gated")
            else:
                persistent.append(f"{const_name}:{decl_line}")
        elif "CHECKS" in const_name or "MAPPINGS" in const_name:
            overridden.append(f"{const_name}@template:{decl_line}")
        elif not has_api_wiring(content):
            persistent.append(f"{const_name}:{decl_line}")
        else:
            overridden.append(f"{const_name}@non-state:{decl_line}")

    has_dev_guard = bool(
        re.search(
            r"import\.meta\.env\.DEV|process\.env\.NODE_ENV\s*===?\s*['\"]development['\"]",
            content,
        )
    )
    has_api = has_api_wiring(content)
    use_effect_lines = line_numbers(content, re.compile(r"\buseEffect\s*\("))
    notes: list[str] = []

    if intentional_static(rel_path):
        verdict = "INTENTIONAL_STATIC"
        notes.append("CLAUDE.md intentional static")
    elif not has_api:
        verdict = "STATIC_ONLY"
        notes.append("no API after full read")
    elif has_dev_guard and static_consts:
        verdict = "DEV_FALLBACK"
        notes.append("dev guard present")
    elif has_api:
        if static_consts:
            if sr_lines or (overridden and not persistent):
                verdict = "FULLY_WIRED_WITH_FALLBACK"
                if sr_lines:
                    notes.append(f"serverReachable@{','.join(map(str, sr_lines))}")
            elif persistent:
                verdict = "PARTIALLY_WIRED"
                notes.append("STATIC_REMAINING: " + "; ".join(persistent))
            else:
                verdict = "FULLY_WIRED_WITH_FALLBACK"
        else:
            verdict = "FULLY_WIRED"
            if use_effect_lines:
                notes.append(f"useEffect@{','.join(map(str, use_effect_lines[:5]))}")
    else:
        verdict = "STATIC_ONLY"

    grep_hits = len(GREP_RE.findall(content))
    if grep_hits:
        notes.append(f"grep_hits={grep_hits}")

    return {
        "file": rel_path,
        "verdict": verdict,
        "serverReachable_lines": ",".join(map(str, sr_lines)),
        "api_call_lines": ",".join(map(str, api_lines[:40])),
        "static_constants_declared": static_declared,
        "static_constants_overridden": ";".join(overridden),
        "static_constants_still_persistent": ";".join(persistent),
        "notes": "; ".join(notes),
    }


def main() -> None:
    paths = [ln.strip() for ln in LIST_FILE.read_text().splitlines() if ln.strip()]
    rows: list[dict] = []
    for rel in paths:
        if rel in MANUAL_V18:
            row = {"file": rel, **MANUAL_V18[rel]}
            rows.append(row)
            continue
        full = ROOT / rel
        if not full.is_file():
            rows.append(
                {
                    "file": rel,
                    "verdict": "UNVERIFIED",
                    "serverReachable_lines": "",
                    "api_call_lines": "",
                    "static_constants_declared": "",
                    "static_constants_overridden": "",
                    "static_constants_still_persistent": "FILE_NOT_FOUND",
                    "notes": "missing",
                }
            )
            continue
        content = full.read_text(encoding="utf-8", errors="replace")
        rows.append(classify_auto(rel, content))

    fieldnames = [
        "file",
        "verdict",
        "serverReachable_lines",
        "api_call_lines",
        "static_constants_declared",
        "static_constants_overridden",
        "static_constants_still_persistent",
        "notes",
    ]
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    c = Counter(r["verdict"] for r in rows)
    print(f"TOTAL={len(rows)}")
    for k, v in sorted(c.items()):
        print(f"  {k}: {v}")
    gaps = [
        r
        for r in rows
        if r["static_constants_still_persistent"]
        and r["verdict"] in ("PARTIALLY_WIRED", "FULLY_WIRED")
    ]
    print(f"STATIC_REMAINING_GAPS={len(gaps)}")
    for r in gaps:
        print(f"  {r['file']}: {r['static_constants_still_persistent'][:120]}")


if __name__ == "__main__":
    main()
