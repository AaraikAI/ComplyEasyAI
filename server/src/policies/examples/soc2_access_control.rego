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
