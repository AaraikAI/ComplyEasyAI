-- EvidenceAttestation: first-class storage for multi-party signatures over evidence
CREATE TABLE "EvidenceAttestation" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'SHA256-RSA',
    "signedPayload" TEXT NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceAttestation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvidenceAttestation_evidenceId_organizationId_idx"
    ON "EvidenceAttestation"("evidenceId", "organizationId");
CREATE INDEX "EvidenceAttestation_userId_idx"
    ON "EvidenceAttestation"("userId");
CREATE INDEX "EvidenceAttestation_organizationId_idx"
    ON "EvidenceAttestation"("organizationId");

ALTER TABLE "EvidenceAttestation"
    ADD CONSTRAINT "EvidenceAttestation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceAttestation"
    ADD CONSTRAINT "EvidenceAttestation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- UserSigningKey: per-user RSA keys for individual non-repudiation.
-- Private key is AES-256-GCM encrypted at rest with ENCRYPTION_KEY.
CREATE TABLE "UserSigningKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'SHA256-RSA',
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "UserSigningKey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserSigningKey_userId_organizationId_active_idx"
    ON "UserSigningKey"("userId", "organizationId", "active");
CREATE INDEX "UserSigningKey_organizationId_idx"
    ON "UserSigningKey"("organizationId");

ALTER TABLE "UserSigningKey"
    ADD CONSTRAINT "UserSigningKey_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSigningKey"
    ADD CONSTRAINT "UserSigningKey_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
