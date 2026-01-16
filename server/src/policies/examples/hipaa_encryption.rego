package hipaa.encryption

# Rule: PHI must be encrypted at rest
deny[msg] {
  input.data_type == "PHI"
  input.encryption_at_rest == false
  msg := "HIPAA violation: PHI must be encrypted at rest"
}

# Rule: PHI must be encrypted in transit
deny[msg] {
  input.data_type == "PHI"
  input.encryption_in_transit == false
  msg := "HIPAA violation: PHI must be encrypted in transit"
}

# Allow if no violations
allow {
  count(deny) == 0
}
