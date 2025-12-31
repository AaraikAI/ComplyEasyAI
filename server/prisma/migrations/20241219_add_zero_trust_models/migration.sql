-- Ensure uuid extension is enabled (required for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable: DeviceTrust
-- Stores device trust information for Zero Trust Security
CREATE TABLE "DeviceTrust" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ZeroTrustPolicy
-- Stores Zero Trust security policies
CREATE TABLE "ZeroTrustPolicy" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZeroTrustPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NetworkSegment
-- Stores network segmentation rules for Zero Trust
CREATE TABLE "NetworkSegment" (
    "id" TEXT NOT NULL DEFAULT (uuid_generate_v4())::text,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cidr" TEXT,
    "resources" JSONB NOT NULL,
    "trustLevel" TEXT NOT NULL DEFAULT 'medium',
    "policies" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: DeviceTrust unique constraint
CREATE UNIQUE INDEX "DeviceTrust_deviceId_organizationId_key" ON "DeviceTrust"("deviceId", "organizationId");

-- CreateIndex: DeviceTrust indexes
CREATE INDEX "DeviceTrust_organizationId_idx" ON "DeviceTrust"("organizationId");
CREATE INDEX "DeviceTrust_deviceId_idx" ON "DeviceTrust"("deviceId");
CREATE INDEX "DeviceTrust_isTrusted_idx" ON "DeviceTrust"("isTrusted");

-- CreateIndex: ZeroTrustPolicy indexes
CREATE INDEX "ZeroTrustPolicy_organizationId_idx" ON "ZeroTrustPolicy"("organizationId");
CREATE INDEX "ZeroTrustPolicy_enabled_idx" ON "ZeroTrustPolicy"("enabled");

-- CreateIndex: NetworkSegment indexes
CREATE INDEX "NetworkSegment_organizationId_idx" ON "NetworkSegment"("organizationId");
CREATE INDEX "NetworkSegment_trustLevel_idx" ON "NetworkSegment"("trustLevel");

-- AddForeignKey: DeviceTrust -> Organization
ALTER TABLE "DeviceTrust" ADD CONSTRAINT "DeviceTrust_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ZeroTrustPolicy -> Organization
ALTER TABLE "ZeroTrustPolicy" ADD CONSTRAINT "ZeroTrustPolicy_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: NetworkSegment -> Organization
ALTER TABLE "NetworkSegment" ADD CONSTRAINT "NetworkSegment_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

