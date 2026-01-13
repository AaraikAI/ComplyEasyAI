# Remaining Features Implementation Guide

This document outlines the implementation for all remaining features.

## 1. Framework Notes ✅

### Database Schema
- Added `notes` field to `ComplianceFramework` model (Text field)
- Added `version`, `lastModifiedBy`, `lastModifiedAt` for concurrent edit tracking

### Implementation Steps:
1. ✅ Updated Prisma schema
2. ⏳ Update create/update endpoints to handle notes
3. ⏳ Add notes display/edit UI in FrameworkDetails
4. ⏳ Add notes field to framework creation form

## 2. Concurrent Edit Conflict Resolution ✅

### Implementation:
- Added `version` field to track edits
- Added conflict detection in update endpoint (409 status)
- Frontend should check version before saving

### Code Added:
```typescript
// In update method
if (updateData.version !== undefined && updateData.version !== existingFramework.version) {
  throw new AppError('Framework was modified by another user. Please refresh and try again.', 409);
}
```

## 3. Unicode Framework Names ✅

### Implementation:
- Prisma/PostgreSQL supports Unicode by default
- Added input sanitization that preserves Unicode
- No special handling needed - should work out of the box

## 4. Control Mappings

### Database Schema Needed:
```sql
CREATE TABLE "ControlMapping" (
  id TEXT PRIMARY KEY,
  sourceControlId TEXT REFERENCES "FrameworkControl"(id),
  targetControlId TEXT REFERENCES "FrameworkControl"(id),
  mappingType TEXT, -- 'equivalent', 'related', 'superset', 'subset'
  confidence FLOAT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## 5. Evidence Versioning

### Database Schema Needed:
```sql
CREATE TABLE "EvidenceVersion" (
  id TEXT PRIMARY KEY,
  controlId TEXT REFERENCES "FrameworkControl"(id),
  versionNumber INT,
  fileUrl TEXT,
  fileName TEXT,
  uploadedBy TEXT REFERENCES "User"(id),
  uploadedAt TIMESTAMP,
  fileSize BIGINT,
  mimeType TEXT
);
```

## 6. Smart Upload Confidence Scores

### Implementation:
- AI classification already returns confidence
- Need to store and display in UI
- Add confidence field to control creation response

## 7. Control Search ✅

### Implementation:
- Added search parameter to getById endpoint
- Frontend needs search input field
- Backend filters controls by name/description/category

## 8. Control Pagination ✅

### Implementation:
- Added pagination to getById endpoint
- Returns pagination metadata
- Frontend needs pagination controls

## 9. XSS Protection ✅

### Implementation:
- Added `sanitizeInput` method
- Removes script tags, event handlers, javascript: URLs
- Applied to all user inputs (name, description, category, notes)

