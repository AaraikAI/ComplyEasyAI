FROM openpolicyagent/opa:0.71.0

# Copy policies
COPY policies /policies

# Run as non-root user
USER 1001

# The OPA image is distroless and ships neither wget nor curl, so an HTTP-tool
# HEALTHCHECK can never succeed and leaves the container perpetually unhealthy.
# No HEALTHCHECK is declared here; liveness/readiness against the OPA HTTP API
# (GET /health) is performed by the orchestrator that runs this image.

# Run OPA server
CMD ["run", "--server", "--log-level=info", "--addr=0.0.0.0:8181", "/policies"]

