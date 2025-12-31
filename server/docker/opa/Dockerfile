FROM openpolicyagent/opa:latest

# Copy policies
COPY policies /policies

# Run OPA server
CMD ["run", "--server", "--log-level=info", "--addr=0.0.0.0:8181", "/policies"]

