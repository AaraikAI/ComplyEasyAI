# Compliance policy (regenerated minimal default-deny skeleton)
# Framework: HIPAA
#
# The package name MUST match the namespace the evaluator queries:
#   data.compliance["90936c8f95742e64a7ee728cc93c4e6d"]  (see complianceAsCodeService.evaluatePolicy,
#   which POSTs to /v1/data/compliance/90936c8f95742e64a7ee728cc93c4e6d). The bracket-quoted segment
#   is required because the policy id is not a bare Rego identifier.
#
# This is a tenant-agnostic skeleton. Organization scoping is enforced in the
# TypeScript service BEFORE OPA is invoked; "input" must be populated
# server-side from the verified identity and resource state, never from
# unvalidated caller-supplied data.
package compliance["90936c8f95742e64a7ee728cc93c4e6d"]

# Deny by default. The resource is only compliant when no violations fire.
default allow := false

allow if {
	count(violation) == 0
}

# Violation skeleton: flags resources that are not explicitly marked compliant.
# Extend with concrete HIPAA control checks (encryption, access control, logging).
violation contains msg if {
	input.resource.compliant != true
	msg := "HIPAA control not satisfied: resource is not marked compliant"
}
