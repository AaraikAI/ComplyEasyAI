# Compliance policy (regenerated minimal default-deny skeleton)
# Framework: GDPR
#
# The package name MUST match the namespace the evaluator queries:
#   data.compliance["3d0571feae3f79ea5d43a78a1a039398"]  (see complianceAsCodeService.evaluatePolicy,
#   which POSTs to /v1/data/compliance/3d0571feae3f79ea5d43a78a1a039398). The bracket-quoted segment
#   is required because the policy id is not a bare Rego identifier.
#
# This is a tenant-agnostic skeleton. Organization scoping is enforced in the
# TypeScript service BEFORE OPA is invoked; "input" must be populated
# server-side from the verified identity and resource state, never from
# unvalidated caller-supplied data.
package compliance["3d0571feae3f79ea5d43a78a1a039398"]

# Deny by default. The resource is only compliant when no violations fire.
default allow := false

allow if {
	count(violation) == 0
}

# Violation skeleton: flags resources that are not explicitly marked compliant.
# Extend with concrete GDPR control checks (encryption, access control, logging).
violation contains msg if {
	input.resource.compliant != true
	msg := "GDPR control not satisfied: resource is not marked compliant"
}
