FROM openpolicyagent/opa:0.71.0

# Copy policies
COPY policies /policies

# Run OPA server
CMD ["run", "--server", "--log-level=info", "--addr=0.0.0.0:8181", "/policies"]

