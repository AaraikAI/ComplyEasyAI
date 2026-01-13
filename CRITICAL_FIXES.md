# Critical Fixes Required

## Issues Found:
1. **Evidence Required Checkbox 500 Error** - Database columns don't exist
2. **Owner Dropdown Empty** - Team members not loading
3. **Status Update 500 Error** - Database schema mismatch
4. **Evidence Access Denied** - S3 URLs need to be signed
5. **Disconnect Integration** - Not working properly
6. **PAT Validation** - Not being enforced (CRITICAL)
7. **Add Control Missing Fields** - Owner and Category not shown
8. **Framework Notes** - Not displayed
9. **Audit Trail** - Status changes not logged properly

## Immediate Actions Required:

### 1. Run Database Migration
Execute `add_control_fields.sql` in Supabase to add:
- `ownerId` column
- `evidenceRequired` column
- `category` column

### 2. Update Prisma Schema
The schema has been updated. Run:
```bash
cd server
npx prisma db push
```

### 3. Restart Backend
After schema changes, restart the backend server.

