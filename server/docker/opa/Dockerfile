FROM openpolicyagent/opa:0.71.0

# Copy policies
COPY policies /policies

# Run as non-root user
USER 1001

# Run OPA server
CMD ["run", "--server", "--log-level=info", "--addr=0.0.0.0:8181", "/policies"]

