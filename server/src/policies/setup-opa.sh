#!/bin/bash

# Open Policy Agent (OPA) Server Setup Script
# Sets up OPA for Compliance-as-Code service
#
# Note: this is an interactive local developer convenience script, not a CI/CD
# or production deployment artifact. The openpolicyagent/opa:latest image tag is
# acceptable here; pin to a specific OPA version if reproducibility is required.

set -e

echo "=========================================="
echo "OPA Server Setup - ComplyEasyAI"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo -e "${BLUE}Detected OS: $MACHINE${NC}"
echo ""

# Option selection
echo "Select OPA deployment method:"
echo "  1) Docker (Recommended - fastest and easiest)"
echo "  2) Docker Compose (For production with persistence)"
echo "  3) Binary (Install OPA directly)"
echo ""
read -p "Enter choice [1-3]: " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "Setting up OPA with Docker..."

        # Check Docker
        if ! command_exists docker; then
            echo -e "${RED}Error: Docker is not installed${NC}"
            echo "Please install Docker from https://docs.docker.com/get-docker/"
            exit 1
        fi

        echo -e "${GREEN}✓ Docker found${NC}"

        # Stop existing OPA container
        docker stop opa 2>/dev/null || true
        docker rm opa 2>/dev/null || true

        # Run OPA container
        echo ""
        echo "Starting OPA server..."
        docker run -d \
            --name opa \
            -p 8181:8181 \
            -v "$SCRIPT_DIR:/policies" \
            openpolicyagent/opa:latest \
            run --server --log-level info

        # Wait for OPA to start
        echo "Waiting for OPA to start..."
        sleep 3

        # Check health
        if curl -s http://localhost:8181/health | grep -q "ok"; then
            echo -e "${GREEN}✓ OPA server is running${NC}"
        else
            echo -e "${RED}Error: OPA server failed to start${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo "OPA server is running on http://localhost:8181"
        echo ""
        echo "Add to your .env:"
        echo "  OPA_ENDPOINT=http://localhost:8181"
        echo ""
        echo "Useful commands:"
        echo "  - Check health: curl http://localhost:8181/health"
        echo "  - View logs: docker logs opa"
        echo "  - Stop server: docker stop opa"
        echo "  - Restart server: docker start opa"
        ;;

    2)
        echo ""
        echo "Setting up OPA with Docker Compose..."

        # Check Docker Compose
        if ! command_exists docker-compose && ! docker compose version &>/dev/null; then
            echo -e "${RED}Error: Docker Compose is not installed${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ Docker Compose found${NC}"

        # Create docker-compose.yml
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  opa:
    image: openpolicyagent/opa:latest
    container_name: opa-server
    ports:
      - "8181:8181"
    command:
      - run
      - --server
      - --log-level=info
      - --log-format=json
    volumes:
      - ./policies:/policies
      - opa-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8181/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  opa-data:
EOF

        echo -e "${GREEN}✓ docker-compose.yml created${NC}"

        # Start OPA
        echo ""
        echo "Starting OPA server..."
        docker-compose up -d

        # Wait for OPA
        echo "Waiting for OPA to start..."
        sleep 5

        # Check health
        if curl -s http://localhost:8181/health | grep -q "ok"; then
            echo -e "${GREEN}✓ OPA server is running${NC}"
        else
            echo -e "${RED}Error: OPA server failed to start${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo "OPA server is running on http://localhost:8181"
        echo ""
        echo "Add to your .env:"
        echo "  OPA_ENDPOINT=http://localhost:8181"
        echo ""
        echo "Useful commands:"
        echo "  - View logs: docker-compose logs -f opa"
        echo "  - Stop server: docker-compose down"
        echo "  - Restart server: docker-compose restart"
        echo "  - Remove all: docker-compose down -v"
        ;;

    3)
        echo ""
        echo "Installing OPA binary..."

        # Determine download URL
        case "$MACHINE" in
            Linux)
                OPA_URL="https://openpolicyagent.org/downloads/latest/opa_linux_amd64"
                ;;
            Mac)
                OPA_URL="https://openpolicyagent.org/downloads/latest/opa_darwin_amd64"
                ;;
            *)
                echo -e "${RED}Unsupported OS${NC}"
                exit 1
                ;;
        esac

        # Download OPA
        echo "Downloading OPA..."
        curl -L -o /tmp/opa "$OPA_URL"
        chmod +x /tmp/opa

        # Move to bin
        # Install to local bin directory (no sudo required)
        mkdir -p bin
        mv /tmp/opa bin/opa
        chmod +x bin/opa

        echo -e "${GREEN}✓ OPA installed to $SCRIPT_DIR/bin/opa${NC}"
        echo -e "${YELLOW}Note: Add $SCRIPT_DIR/bin to your PATH or use ./bin/opa${NC}"

        # Create systemd service (Linux only) - optional, requires sudo
        if [ "$MACHINE" = "Linux" ]; then
            echo ""
            echo "Create systemd service? [y/N]"
            read -r CREATE_SERVICE

            if [[ "$CREATE_SERVICE" =~ ^[Yy]$ ]]; then
                cat > /tmp/opa.service << EOF
[Unit]
Description=Open Policy Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/bin/opa run --server --log-level info
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

                sudo mv /tmp/opa.service /etc/systemd/system/opa.service
                sudo systemctl daemon-reload
                sudo systemctl enable opa
                sudo systemctl start opa

                echo -e "${GREEN}✓ OPA service created and started${NC}"
            fi
        fi

        echo ""
        echo "To run OPA manually:"
        echo "  $SCRIPT_DIR/bin/opa run --server --log-level info"
        echo "  Or: cd $SCRIPT_DIR && ./bin/opa run --server --log-level info"
        echo ""
        echo "OPA will run on http://localhost:8181"
        echo ""
        echo "Add to your .env:"
        echo "  OPA_ENDPOINT=http://localhost:8181"
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Create sample policies
echo ""
echo "Creating sample policies..."
mkdir -p examples

# SOC 2 Access Control Policy
cat > examples/soc2_access_control.rego << 'EOF'
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
EOF

# HIPAA Encryption Policy
cat > examples/hipaa_encryption.rego << 'EOF'
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
EOF

echo -e "${GREEN}✓ Sample policies created in examples/${NC}"

# Test OPA
echo ""
echo "Testing OPA server..."

# Upload test policy
curl -s -X PUT \
    http://localhost:8181/v1/policies/test \
    --data-binary @examples/soc2_access_control.rego \
    > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Policy upload successful${NC}"
else
    echo -e "${YELLOW}⚠ Policy upload failed (check OPA logs)${NC}"
fi

# Test policy evaluation
RESULT=$(curl -s -X POST \
    http://localhost:8181/v1/data/soc2/access_control/allow \
    -H 'Content-Type: application/json' \
    -d '{"input": {"access_type": "authenticated", "role": "user", "mfa_enabled": true, "audit_logged": true}}')

if echo "$RESULT" | grep -q "true"; then
    echo -e "${GREEN}✓ Policy evaluation successful${NC}"
else
    echo -e "${YELLOW}⚠ Policy evaluation returned: $RESULT${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}OPA Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Add OPA_ENDPOINT=http://localhost:8181 to your .env"
echo "  2. Create policies in server/src/policies/"
echo "  3. Upload policies via Compliance-as-Code service"
echo "  4. Test with: curl http://localhost:8181/v1/policies"
echo ""
echo "Documentation:"
echo "  - OPA Docs: https://www.openpolicyagent.org/docs/"
echo "  - Rego Language: https://www.openpolicyagent.org/docs/latest/policy-language/"
echo "  - Examples: $SCRIPT_DIR/examples/"
echo ""
