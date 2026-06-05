# Compliance policy (regenerated minimal default-deny skeleton)
# Framework: SOC2
#
# The package name MUST match the namespace the evaluator queries:
#   data.compliance["fb9f274c27147fc30274e0e5611315f4"]  (see complianceAsCodeService.evaluatePolicy,
#   which POSTs to /v1/data/compliance/fb9f274c27147fc30274e0e5611315f4). The bracket-quoted segment
#   is required because the policy id is not a bare Rego identifier.
#
# This is a tenant-agnostic skeleton. Organization scoping is enforced in the
# TypeScript service BEFORE OPA is invoked; "input" must be populated
# server-side from the verified identity and resource state, never from
# unvalidated caller-supplied data.
package compliance["fb9f274c27147fc30274e0e5611315f4"]

# Deny by default. The resource is only compliant when no violations fire.
default allow := false

allow if {
	count(violation) == 0
}

# Violation skeleton: flags resources that are not explicitly marked compliant.
# Extend with concrete SOC2 control checks (encryption, access control, logging).
violation contains msg if {
	input.resource.compliant != true
	msg := "SOC2 control not satisfied: resource is not marked compliant"
}
