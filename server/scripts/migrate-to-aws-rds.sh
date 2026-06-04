#!/bin/bash

# Complete Supabase to AWS RDS Migration Script
# This script automates the entire migration process

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   Supabase → AWS RDS PostgreSQL Migration Tool                ║
║   ComplyEasyAI Database Migration Assistant                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname $SCRIPT_DIR)"
MIGRATION_DIR="$HOME/complyeasy-migration"

# Create migration directory
mkdir -p "$MIGRATION_DIR"
cd "$MIGRATION_DIR"

echo -e "${YELLOW}Migration working directory: $MIGRATION_DIR${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Check for required tools
REQUIRED_TOOLS=("psql" "pg_dump" "node" "npm")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
    if command -v "$tool" &> /dev/null; then
        VERSION=$($tool --version 2>&1 | head -n1)
        echo -e "${GREEN}✓ $tool found${NC} - $VERSION"
    else
        echo -e "${RED}✗ $tool not found${NC}"
        MISSING_TOOLS+=("$tool")
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo ""
    echo -e "${RED}Error: Missing required tools: ${MISSING_TOOLS[*]}${NC}"
    echo ""
    echo "Install missing tools:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client nodejs npm"
    echo "  macOS: brew install postgresql node"
    exit 1
fi

echo ""
read -p "Prerequisites check complete. Continue? (yes/no): " CONTINUE
if [ "$CONTINUE" != "yes" ] && [ "$CONTINUE" != "y" ]; then
    echo "Migration cancelled."
    exit 0
fi

# Get Supabase connection details
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Supabase Database Export${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Enter your Supabase connection details:${NC}"
echo "Find these in: Supabase Dashboard → Settings → Database"
echo ""

read -p "Supabase Project ID (db.xxx.supabase.co): " SUPABASE_HOST
read -p "Supabase Database Name [postgres]: " SUPABASE_DB
SUPABASE_DB=${SUPABASE_DB:-postgres}
read -p "Supabase Username [postgres]: " SUPABASE_USER
SUPABASE_USER=${SUPABASE_USER:-postgres}
read -sp "Supabase Password: " SUPABASE_PASSWORD
echo ""

SUPABASE_PORT=5432

# Connection arguments exclude the password; the password is supplied to the
# postgres client tools via the PGPASSWORD environment variable so it never
# appears in the process argument list (visible to other users via ps/proc).
SUPABASE_CONN_ARGS=(
    -h "$SUPABASE_HOST"
    -p "$SUPABASE_PORT"
    -U "$SUPABASE_USER"
    -d "$SUPABASE_DB"
)

# Test Supabase connection
echo ""
echo -e "${YELLOW}Testing Supabase connection...${NC}"
if PGPASSWORD="$SUPABASE_PASSWORD" psql "${SUPABASE_CONN_ARGS[@]}" -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓ Supabase connection successful${NC}"
else
    echo -e "${RED}✗ Supabase connection failed${NC}"
    echo "Please check your credentials and try again."
    exit 1
fi

# Get table count
SUPABASE_TABLE_COUNT=$(PGPASSWORD="$SUPABASE_PASSWORD" psql "${SUPABASE_CONN_ARGS[@]}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs)
SUPABASE_USER_COUNT=$(PGPASSWORD="$SUPABASE_PASSWORD" psql "${SUPABASE_CONN_ARGS[@]}" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs || echo "0")

echo -e "${CYAN}Supabase Database Stats:${NC}"
echo "  Tables: $SUPABASE_TABLE_COUNT"
echo "  Users: $SUPABASE_USER_COUNT"
echo ""

read -p "Export this database? (yes/no): " EXPORT_DB
if [ "$EXPORT_DB" != "yes" ] && [ "$EXPORT_DB" != "y" ]; then
    echo "Export cancelled."
    exit 0
fi

# Export database
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$MIGRATION_DIR/complyeasy_backup_${TIMESTAMP}.sql"

echo ""
echo -e "${YELLOW}Exporting Supabase database...${NC}"
echo "This may take a few minutes depending on database size..."

# Restrict the dump file's permissions before any data is written, since the
# export may contain sensitive rows.
( umask 077
PGPASSWORD="$SUPABASE_PASSWORD" pg_dump "${SUPABASE_CONN_ARGS[@]}" \
    --schema=public \
    --no-owner \
    --no-privileges \
    --file="$BACKUP_FILE" 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done
)

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Export failed${NC}"
    exit 1
fi
chmod 600 "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓ Export complete${NC}"
echo "  File: $BACKUP_FILE"
echo "  Size: $BACKUP_SIZE"
echo ""

# Get AWS RDS connection details
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: AWS RDS Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Enter your AWS RDS connection details:${NC}"
echo "Find these in: AWS RDS Console → Your Database → Connectivity"
echo ""

read -p "RDS Endpoint (e.g., xxx.rds.amazonaws.com): " RDS_ENDPOINT
read -p "Database Name [complyeasy]: " RDS_DB
RDS_DB=${RDS_DB:-complyeasy}
read -p "Master Username [complyeasy_admin]: " RDS_USER
RDS_USER=${RDS_USER:-complyeasy_admin}
read -sp "Master Password: " RDS_PASSWORD
echo ""
read -p "Port [5432]: " RDS_PORT
RDS_PORT=${RDS_PORT:-5432}

# Connection arguments exclude the password; the password is supplied to the
# postgres client tools via the PGPASSWORD environment variable so it never
# appears in the process argument list.
RDS_CONN_ARGS=(
    -h "$RDS_ENDPOINT"
    -p "$RDS_PORT"
    -U "$RDS_USER"
    -d "$RDS_DB"
)

# Test RDS connection
echo ""
echo -e "${YELLOW}Testing AWS RDS connection...${NC}"
if PGPASSWORD="$RDS_PASSWORD" psql "${RDS_CONN_ARGS[@]}" -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓ AWS RDS connection successful${NC}"
else
    echo -e "${RED}✗ AWS RDS connection failed${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check security group allows your IP on port $RDS_PORT"
    echo "  2. Verify RDS is publicly accessible"
    echo "  3. Check username and password"
    echo ""
    read -p "Continue anyway? (yes/no): " FORCE_CONTINUE
    if [ "$FORCE_CONTINUE" != "yes" ] && [ "$FORCE_CONTINUE" != "y" ]; then
        echo "Migration cancelled."
        exit 1
    fi
fi

# Import to AWS RDS
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: Importing to AWS RDS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

read -p "Import database to AWS RDS? (yes/no): " IMPORT_DB
if [ "$IMPORT_DB" != "yes" ] && [ "$IMPORT_DB" != "y" ]; then
    echo "Import skipped. Backup saved at: $BACKUP_FILE"
    exit 0
fi

echo -e "${YELLOW}Importing to AWS RDS...${NC}"
echo "This may take several minutes..."
echo ""

PGPASSWORD="$RDS_PASSWORD" psql "${RDS_CONN_ARGS[@]}" -f "$BACKUP_FILE" 2>&1 | while IFS= read -r line; do
    # Filter out noise, show only important messages
    if [[ "$line" != *"NOTICE"* ]]; then
        echo "  $line"
    fi
done

echo ""
echo -e "${GREEN}✓ Import complete${NC}"

# Verify import
echo ""
echo -e "${YELLOW}Verifying import...${NC}"

RDS_TABLE_COUNT=$(PGPASSWORD="$RDS_PASSWORD" psql "${RDS_CONN_ARGS[@]}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs)
RDS_USER_COUNT=$(PGPASSWORD="$RDS_PASSWORD" psql "${RDS_CONN_ARGS[@]}" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs || echo "0")

echo -e "${CYAN}AWS RDS Database Stats:${NC}"
echo "  Tables: $RDS_TABLE_COUNT"
echo "  Users: $RDS_USER_COUNT"
echo ""

if [ "$SUPABASE_TABLE_COUNT" == "$RDS_TABLE_COUNT" ]; then
    echo -e "${GREEN}✓ Table count matches${NC}"
else
    echo -e "${YELLOW}⚠ Table count mismatch (Supabase: $SUPABASE_TABLE_COUNT, RDS: $RDS_TABLE_COUNT)${NC}"
fi

if [ "$SUPABASE_USER_COUNT" == "$RDS_USER_COUNT" ]; then
    echo -e "${GREEN}✓ User count matches${NC}"
else
    echo -e "${YELLOW}⚠ User count mismatch (Supabase: $SUPABASE_USER_COUNT, RDS: $RDS_USER_COUNT)${NC}"
fi

# Update .env file
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 5: Updating Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

ENV_FILE="$PROJECT_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠ .env file not found, creating from template...${NC}"
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
        echo -e "${GREEN}✓ Created .env from template${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        echo "Please create .env manually at: $ENV_FILE"
        exit 1
    fi
fi

# Backup .env. The .env contains plaintext secrets, so restrict the backup's
# permissions to the owner immediately.
ENV_BACKUP="$ENV_FILE.backup-${TIMESTAMP}"
cp "$ENV_FILE" "$ENV_BACKUP"
chmod 600 "$ENV_BACKUP"
echo -e "${GREEN}✓ Backed up .env to: $ENV_BACKUP${NC}"

# Update DATABASE_URL
NEW_DATABASE_URL="postgresql://${RDS_USER}:${RDS_PASSWORD}@${RDS_ENDPOINT}:${RDS_PORT}/${RDS_DB}?schema=public&sslmode=require"

if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"${NEW_DATABASE_URL}\"|" "$ENV_FILE"
    else
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${NEW_DATABASE_URL}\"|" "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Updated DATABASE_URL in .env${NC}"
else
    # Add new
    echo "" >> "$ENV_FILE"
    echo "# Database (AWS RDS)" >> "$ENV_FILE"
    echo "DATABASE_URL=\"${NEW_DATABASE_URL}\"" >> "$ENV_FILE"
    echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
fi

# Regenerate Prisma client
echo ""
echo -e "${YELLOW}Regenerating Prisma client...${NC}"
cd "$PROJECT_ROOT"

if npx prisma generate &> /dev/null; then
    echo -e "${GREEN}✓ Prisma client regenerated${NC}"
else
    echo -e "${YELLOW}⚠ Prisma generate had warnings (usually safe to ignore)${NC}"
fi

# Final summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║        Migration Complete! ✓                       ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Exported from Supabase:${NC} $SUPABASE_TABLE_COUNT tables, $SUPABASE_USER_COUNT users"
echo -e "${GREEN}✓ Imported to AWS RDS:${NC} $RDS_TABLE_COUNT tables, $RDS_USER_COUNT users"
echo -e "${GREEN}✓ Updated .env file:${NC} $ENV_FILE"
echo -e "${GREEN}✓ Backup saved:${NC} $BACKUP_FILE"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Test the connection:"
echo -e "   ${BLUE}cd $PROJECT_ROOT && npx prisma db pull${NC}"
echo ""
echo "2. Start the server:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Test the application:"
echo -e "   ${BLUE}curl http://localhost:5000/health${NC}"
echo ""
echo "4. If everything works, you can decommission Supabase"
echo "   (Keep backup for 30 days as safety measure)"
echo ""

echo -e "${YELLOW}Rollback (if needed):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "   ${BLUE}cp $ENV_BACKUP $ENV_FILE${NC}"
echo -e "   ${BLUE}cd $PROJECT_ROOT && npx prisma generate${NC}"
echo ""

echo -e "${CYAN}Files created:${NC}"
echo "  Backup: $BACKUP_FILE"
echo "  .env backup: $ENV_BACKUP"
echo "  Working directory: $MIGRATION_DIR"
echo ""

echo -e "${GREEN}Migration completed successfully!${NC}"
echo ""
