# Compliance policy (regenerated minimal default-deny skeleton)
# Framework: SOC2
#
# The package name MUST match the namespace the evaluator queries:
#   data.compliance["91abb6b089609521f7f52024fab944ae"]  (see complianceAsCodeService.evaluatePolicy,
#   which POSTs to /v1/data/compliance/91abb6b089609521f7f52024fab944ae). The bracket-quoted segment
#   is required because the policy id is not a bare Rego identifier.
#
# This is a tenant-agnostic skeleton. Organization scoping is enforced in the
# TypeScript service BEFORE OPA is invoked; "input" must be populated
# server-side from the verified identity and resource state, never from
# unvalidated caller-supplied data.
package compliance["91abb6b089609521f7f52024fab944ae"]

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
