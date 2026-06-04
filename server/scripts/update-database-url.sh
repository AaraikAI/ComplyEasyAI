#!/bin/bash

# Script to update DATABASE_URL in .env file for AWS RDS migration
# Usage: ./update-database-url.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AWS RDS Database URL Configuration Helper    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at: $ENV_FILE${NC}"
    echo "Creating from .env.example..."

    if [ -f "$SCRIPT_DIR/../.env.example" ]; then
        cp "$SCRIPT_DIR/../.env.example" "$ENV_FILE"
        echo -e "${GREEN}✓ Created .env from template${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Backup existing .env. The .env contains plaintext secrets, so restrict the
# backup's permissions to the owner immediately.
BACKUP_FILE="$ENV_FILE.backup-$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"
echo -e "${GREEN}✓ Backed up .env to: $BACKUP_FILE${NC}"
echo ""

# Prompt for RDS details
echo -e "${YELLOW}Enter your AWS RDS connection details:${NC}"
echo ""

read -p "RDS Endpoint (e.g., complyeasyai-db.xxx.us-east-1.rds.amazonaws.com): " RDS_ENDPOINT
read -p "Database Name [complyeasy]: " DB_NAME
DB_NAME=${DB_NAME:-complyeasy}
read -p "Master Username [complyeasy_admin]: " DB_USERNAME
DB_USERNAME=${DB_USERNAME:-complyeasy_admin}
read -sp "Master Password: " DB_PASSWORD
echo ""
read -p "Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}
read -p "Enable SSL? (yes/no) [yes]: " SSL_ENABLED
SSL_ENABLED=${SSL_ENABLED:-yes}

# Validate inputs
if [ -z "$RDS_ENDPOINT" ]; then
    echo -e "${RED}Error: RDS endpoint is required${NC}"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Password is required${NC}"
    exit 1
fi

# Build connection string
if [ "$SSL_ENABLED" = "yes" ] || [ "$SSL_ENABLED" = "y" ]; then
    NEW_DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${RDS_ENDPOINT}:${DB_PORT}/${DB_NAME}?schema=public&sslmode=require"
else
    NEW_DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${RDS_ENDPOINT}:${DB_PORT}/${DB_NAME}?schema=public"
fi

echo ""
echo -e "${YELLOW}New DATABASE_URL:${NC}"
echo -e "${BLUE}${NEW_DATABASE_URL}${NC}"
echo ""

# Test connection before updating.
# Connection arguments exclude the password; the password is supplied to psql
# via the PGPASSWORD environment variable so it never appears in the process
# argument list (visible to other users via ps/proc).
DB_CONN_ARGS=(
    -h "$RDS_ENDPOINT"
    -p "$DB_PORT"
    -U "$DB_USERNAME"
    -d "$DB_NAME"
)
echo -e "${YELLOW}Testing connection to AWS RDS...${NC}"

if command -v psql &> /dev/null; then
    if PGPASSWORD="$DB_PASSWORD" psql "${DB_CONN_ARGS[@]}" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓ Connection successful!${NC}"
    else
        echo -e "${RED}✗ Connection failed!${NC}"
        echo -e "${YELLOW}Possible issues:${NC}"
        echo "  1. Check security group allows your IP on port $DB_PORT"
        echo "  2. Verify username and password are correct"
        echo "  3. Ensure database '$DB_NAME' exists"
        echo ""
        read -p "Update .env anyway? (yes/no): " FORCE_UPDATE
        if [ "$FORCE_UPDATE" != "yes" ] && [ "$FORCE_UPDATE" != "y" ]; then
            echo "Aborted. Backup preserved at: $BACKUP_FILE"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠ psql not found - skipping connection test${NC}"
fi

# Update .env file
echo ""
echo -e "${YELLOW}Updating .env file...${NC}"

# Check if DATABASE_URL exists
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    # Update existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"${NEW_DATABASE_URL}\"|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${NEW_DATABASE_URL}\"|" "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Updated existing DATABASE_URL${NC}"
else
    # Add new line
    echo "" >> "$ENV_FILE"
    echo "# Database (AWS RDS)" >> "$ENV_FILE"
    echo "DATABASE_URL=\"${NEW_DATABASE_URL}\"" >> "$ENV_FILE"
    echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
fi

# Verify update
echo ""
echo -e "${YELLOW}Verifying .env update...${NC}"
if grep -q "$RDS_ENDPOINT" "$ENV_FILE"; then
    echo -e "${GREEN}✓ Verification successful${NC}"
else
    echo -e "${RED}✗ Verification failed - DATABASE_URL may not be updated${NC}"
    exit 1
fi

# Show current DATABASE_URL (hide password)
MASKED_URL=$(echo "$NEW_DATABASE_URL" | sed -E 's/:([^@]+)@/:****@/')
echo ""
echo -e "${GREEN}Current DATABASE_URL (masked):${NC}"
echo -e "${BLUE}$MASKED_URL${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Database URL Updated Successfully! ✓          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Regenerate Prisma client:"
echo -e "   ${BLUE}cd $(dirname $SCRIPT_DIR) && npx prisma generate${NC}"
echo ""
echo "2. Test the connection:"
echo -e "   ${BLUE}npx prisma db pull${NC}"
echo ""
echo "3. Start the server:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo -e "${YELLOW}Backup location:${NC} $BACKUP_FILE"
echo ""
echo -e "${YELLOW}To rollback:${NC}"
echo -e "   ${BLUE}cp $BACKUP_FILE $ENV_FILE${NC}"
echo ""
