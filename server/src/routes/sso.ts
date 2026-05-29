/**
 * SSO (Single Sign-On) Configuration Routes
 *
 * Endpoints for configuring SAML/OIDC SSO, generating SP metadata,
 * testing configurations, and handling IdP callbacks (ACS).
 * The ACS callback and login initiation routes are unauthenticated.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { upsertSSOConfigSchema } from '../validators/ssoSchemas';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import config from '../config';
import crypto from 'crypto';
import { SignedXml } from 'xml-crypto';
import { XMLParser } from 'fast-xml-parser';
import { encryptField, decryptField } from '../utils/credentialEncryption';

const router = Router();

/**
 * Validate that a redirect URL is safe (same origin as our app).
 * Prevents open redirect attacks via the RelayState parameter.
 */
function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    const clientUrl = config.server?.clientUrl || '';
    const apiUrl = config.server?.apiUrl || '';

    // Only allow redirects to our own app URLs
    const allowedOrigins = [clientUrl, apiUrl]
      .filter(Boolean)
      .map((u) => {
        try { return new URL(u).origin; } catch { return ''; }
      })
      .filter(Boolean);

    return allowedOrigins.includes(parsed.origin);
  } catch {
    return false;
  }
}

/**
 * Verify the XML signature on a SAML response using the IdP's X.509 certificate.
 * Uses xml-crypto for cryptographic verification (not just structural checks).
 * Returns true if valid, throws on invalid or missing signature.
 */
function verifySamlSignature(xml: string, certificate: string): boolean {
  // Normalize the certificate to PEM format
  let pemCert = certificate.trim();
  if (!pemCert.startsWith('-----BEGIN CERTIFICATE-----')) {
    pemCert = `-----BEGIN CERTIFICATE-----\n${pemCert}\n-----END CERTIFICATE-----`;
  }

  // Find the Signature element in the XML
  const sigMatch = xml.match(/<(?:ds:)?Signature[\s>]/);
  if (!sigMatch) {
    throw new Error('SAML response does not contain a Signature element');
  }

  // Use xml-crypto for full cryptographic verification
  const sig = new SignedXml();

  // Set the key info provider to use our IdP certificate
  sig.publicCert = pemCert;

  // Load the signature from the XML
  const signatureNode = xml.match(/<(?:ds:)?Signature[^]*?<\/(?:ds:)?Signature>/);
  if (!signatureNode) {
    throw new Error('Could not extract Signature element from SAML response');
  }
  sig.loadSignature(signatureNode[0]);

  // Cryptographically verify the signature against the XML document
  const isValid = sig.checkSignature(xml);
  if (!isValid) {
    const errors = (sig as any).validationErrors || [];
    throw new Error(`SAML signature cryptographic verification failed: ${errors.join('; ')}`);
  }

  logger.info('SAML signature cryptographic verification passed');
  return true;
}

/**
 * XML parser instance for SAML response parsing.
 * Replaces regex-based extraction with proper XML parsing to prevent injection attacks.
 */
const samlXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name: string) => ['Attribute', 'AttributeValue'].includes(name),
});

/**
 * Extract SAML claims from a parsed XML response using proper XML parsing.
 */
function extractSamlClaims(samlResponseXml: string): {
  issuer: string | null;
  nameId: string | null;
  attributes: Record<string, string>;
} {
  const parsed = samlXmlParser.parse(samlResponseXml);

  // Navigate the SAML response structure (handles both saml: and saml2: prefixes via removeNSPrefix)
  const response = parsed.Response || parsed.SAMLResponse || parsed;
  const assertion = response?.Assertion;

  // Extract Issuer
  const issuer = response?.Issuer || assertion?.Issuer || null;
  const issuerText = typeof issuer === 'string' ? issuer.trim() : (issuer?.['#text'] || '').trim() || null;

  // Extract NameID from Subject
  const subject = assertion?.Subject;
  const nameIdElement = subject?.NameID;
  const nameId = typeof nameIdElement === 'string'
    ? nameIdElement.trim()
    : (nameIdElement?.['#text'] || '').trim() || null;

  // Extract Attributes from AttributeStatement
  const attrStatement = assertion?.AttributeStatement;
  const attributes: Record<string, string> = {};
  if (attrStatement?.Attribute) {
    const attrs = Array.isArray(attrStatement.Attribute) ? attrStatement.Attribute : [attrStatement.Attribute];
    for (const attr of attrs) {
      const name = attr['@_Name'];
      if (name && attr.AttributeValue) {
        const values = Array.isArray(attr.AttributeValue) ? attr.AttributeValue : [attr.AttributeValue];
        const value = typeof values[0] === 'string' ? values[0] : (values[0]?.['#text'] || '');
        if (value) attributes[name] = value;
      }
    }
  }

  return { issuer: issuerText, nameId, attributes };
}

// ============================================================================
// UNAUTHENTICATED ROUTES (IdP callbacks and login initiation)
// These must be defined BEFORE router.use(authenticate).
// ============================================================================

/**
 * POST /acs - SAML Assertion Consumer Service callback
 * Called by the Identity Provider after user authenticates.
 * No JWT auth required -- the IdP posts the SAML response here.
 */
router.post(
  '/acs',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { SAMLResponse, RelayState } = req.body;

      if (!SAMLResponse) {
        res.status(400).json({ error: 'SAMLResponse is required' });
        return;
      }

      // Decode the base64-encoded SAML response
      const samlResponseXml = Buffer.from(SAMLResponse, 'base64').toString('utf-8');

      // Parse SAML response using proper XML parser (not regex)
      const samlClaims = extractSamlClaims(samlResponseXml);
      const issuer = samlClaims.issuer;

      // Find SSO config matching the issuer
      const ssoConfig = await prisma.sSOConfiguration.findFirst({
        where: {
          enabled: true,
          ...(issuer ? { entityId: issuer } : {}),
        },
        include: { organization: { select: { id: true, name: true } } },
      });

      if (!ssoConfig) {
        logger.warn(`SSO ACS: No matching SSO configuration found for issuer: ${issuer}`);
        res.status(404).json({ error: 'No matching SSO configuration found' });
        return;
      }

      // Verify SAML signature BEFORE extracting any claims — certificate is REQUIRED
      if (!ssoConfig.certificate) {
        logger.error('SSO ACS: Certificate not configured — rejecting SAML response', {
          organizationId: ssoConfig.organizationId,
          ssoConfigId: ssoConfig.id,
        });
        res.status(401).json({ error: 'SSO configuration incomplete — certificate required for signature verification' });
        return;
      }

      try {
        // Certificate is encrypted at rest — decrypt before passing to signature verifier.
        verifySamlSignature(samlResponseXml, decryptField(ssoConfig.certificate));
      } catch (sigError: any) {
        logger.error('SSO ACS: SAML signature verification failed', {
          err: sigError,
          path: req.path,
          method: req.method,
          ssoConfigId: ssoConfig.id,
          ip: req.ip,
        });
        const wrapped = new AppError('SAML signature verification failed', 400);
        (wrapped as any).cause = sigError;
        return next(wrapped);
      }

      // Extract NameID from parsed SAML claims (already parsed above)
      if (!samlClaims.nameId) {
        logger.warn('SSO ACS: Could not extract NameID from SAML response');
        res.status(400).json({ error: 'Invalid SAML response: NameID not found' });
        return;
      }

      const email = samlClaims.nameId;
      const attributes = samlClaims.attributes;

      // Map attributes using the SSO config's attribute mapping
      const mapping = (ssoConfig.attributeMapping as Record<string, string>) || {};
      const firstName = attributes[mapping.firstName || 'firstName'] ||
                        attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || '';
      const lastName = attributes[mapping.lastName || 'lastName'] ||
                       attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || '';
      const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      // Auto-provision or find user
      let user = await prisma.user.findFirst({
        where: { email, organizationId: ssoConfig.organizationId },
      });

      if (!user && ssoConfig.autoProvision) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash: null, // SSO users do not use password auth
            role: ssoConfig.defaultRole as any,
            organizationId: ssoConfig.organizationId,
            emailVerified: true,
            active: true,
          },
        });
        logger.info(`SSO ACS: Auto-provisioned user ${user.id} for org ${ssoConfig.organizationId}`);
      }

      if (!user) {
        res.status(403).json({ error: 'User not found and auto-provisioning is disabled' });
        return;
      }

      if (!user.active) {
        res.status(403).json({ error: 'User account is disabled' });
        return;
      }

      // Generate JWT tokens (import from auth middleware)
      const { generateToken, generateRefreshToken } = await import('../middleware/auth');
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });
      const refreshToken = generateRefreshToken(user.id);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Set tokens in httpOnly cookies (consistent with rest of auth system)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // If RelayState contains a redirect URL, validate and redirect (no tokens in URL)
      if (RelayState && isSafeRedirect(RelayState)) {
        res.redirect(302, RelayState);
        return;
      } else if (RelayState) {
        logger.warn(`SSO ACS: Blocked unsafe redirect to ${RelayState}`);
      }

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          },
        },
      });
    } catch (error) {
      logger.error('SSO ACS failed', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('SSO authentication failed', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

/**
 * GET /login/:orgSlug - Initiate SSO login for an organization
 * Redirects the user to the IdP's SSO URL.
 */
router.get(
  '/login/:orgSlug',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgSlug } = req.params;

      // Find the organization by name (used as slug)
      const organization = await prisma.organization.findFirst({
        where: { name: orgSlug },
        select: { id: true, name: true },
      });

      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      const ssoConfig = await prisma.sSOConfiguration.findUnique({
        where: { organizationId: organization.id },
      });

      if (!ssoConfig || !ssoConfig.enabled) {
        res.status(404).json({ error: 'SSO is not configured or not enabled for this organization' });
        return;
      }

      if (!ssoConfig.ssoUrl) {
        res.status(400).json({ error: 'SSO URL is not configured' });
        return;
      }

      // Build SAML AuthnRequest redirect
      const callbackUrl = `${config.server?.apiUrl || req.protocol + '://' + req.get('host')}/api/sso/acs`;
      const relayState = req.query.redirect as string || '';

      const samlRequest = Buffer.from(
        `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ` +
        `xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ` +
        `ID="_${Date.now()}" ` +
        `Version="2.0" ` +
        `IssueInstant="${new Date().toISOString()}" ` +
        `AssertionConsumerServiceURL="${callbackUrl}" ` +
        `ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">` +
        `<saml:Issuer>${ssoConfig.entityId || callbackUrl}</saml:Issuer>` +
        `</samlp:AuthnRequest>`
      ).toString('base64');

      const separator = ssoConfig.ssoUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${ssoConfig.ssoUrl}${separator}SAMLRequest=${encodeURIComponent(samlRequest)}` +
        (relayState ? `&RelayState=${encodeURIComponent(relayState)}` : '');

      res.json({
        status: 'success',
        data: {
          redirectUrl,
          provider: ssoConfig.provider,
          organization: { id: organization.id, name: organization.name },
        },
      });
    } catch (error) {
      logger.error('SSO login initiation failed', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to initiate SSO login', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

router.use(authenticate);

// ============================================================================
// GET SSO CONFIG
// ============================================================================

router.get(
  '/config',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user!;

    try {
      const ssoConfig = await prisma.sSOConfiguration.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!ssoConfig) {
        res.json({ status: 'success', data: null });
        return;
      }

      // Redact the certificate for security
      const { certificate, ...safeConfig } = ssoConfig;

      res.json({
        status: 'success',
        data: {
          ...safeConfig,
          hasCertificate: !!certificate,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch SSO config', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to fetch SSO configuration', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// CREATE/UPDATE SSO CONFIG (Admin only)
// ============================================================================

router.post(
  '/config',
  authorize('admin'),
  validateBody(upsertSSOConfigSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user!;

    try {
      const {
        provider,
        enabled,
        entityId,
        ssoUrl,
        certificate,
        metadataUrl,
        attributeMapping,
        defaultRole,
        autoProvision,
        domains,
      } = req.body;

      // Encrypt the SAML/OIDC IdP certificate at rest. Schema annotation: certificate String? // Encrypted
      const encryptedCertificate = certificate ? encryptField(certificate) : null;

      const ssoConfig = await prisma.sSOConfiguration.upsert({
        where: { organizationId: user.organizationId },
        update: {
          provider,
          enabled: enabled !== undefined ? enabled : false,
          entityId: entityId || null,
          ssoUrl: ssoUrl || null,
          certificate: encryptedCertificate,
          metadataUrl: metadataUrl || null,
          attributeMapping: attributeMapping || null,
          defaultRole: defaultRole || 'viewer',
          autoProvision: autoProvision !== undefined ? autoProvision : true,
          domains: domains || [],
        },
        create: {
          organizationId: user.organizationId,
          provider,
          enabled: enabled !== undefined ? enabled : false,
          entityId: entityId || null,
          ssoUrl: ssoUrl || null,
          certificate: encryptedCertificate,
          metadataUrl: metadataUrl || null,
          attributeMapping: attributeMapping || null,
          defaultRole: defaultRole || 'viewer',
          autoProvision: autoProvision !== undefined ? autoProvision : true,
          domains: domains || [],
        },
      });

      // Redact certificate in response
      const { certificate: _cert, ...safeConfig } = ssoConfig;

      res.json({
        status: 'success',
        data: {
          ...safeConfig,
          hasCertificate: !!_cert,
        },
      });
    } catch (error) {
      logger.error('Failed to save SSO config', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to save SSO configuration', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// DELETE SSO CONFIG (Admin only)
// ============================================================================

router.delete(
  '/config',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.sSOConfiguration.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'SSO configuration not found' });
        return;
      }

      await prisma.sSOConfiguration.delete({
        where: { organizationId: user.organizationId },
      });

      res.json({ status: 'success', data: { message: 'SSO configuration deleted' } });
    } catch (error) {
      logger.error('Failed to delete SSO config', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to delete SSO configuration', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// GENERATE SP METADATA XML
// ============================================================================

router.get(
  '/metadata',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user!;

    try {
      const ssoConfig = await prisma.sSOConfiguration.findUnique({
        where: { organizationId: user.organizationId },
      });

      const baseUrl = config.server?.apiUrl || `${req.protocol}://${req.get('host')}`;
      const entityId = ssoConfig?.entityId || `${baseUrl}/api/sso/metadata`;
      const acsUrl = `${baseUrl}/api/sso/acs`;

      const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    entityID="${entityId}">
  <md:SPSSODescriptor
      AuthnRequestsSigned="false"
      WantAssertionsSigned="true"
      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${acsUrl}"
        index="0"
        isDefault="true"/>
  </md:SPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="en">ComplyEasyAI</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">ComplyEasyAI</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">${baseUrl}</md:OrganizationURL>
  </md:Organization>
</md:EntityDescriptor>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(metadata);
    } catch (error) {
      logger.error('Failed to generate SP metadata', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to generate SP metadata', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

// ============================================================================
// TEST SSO CONFIGURATION
// ============================================================================

router.post(
  '/test',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user!;

    try {
      const ssoConfig = await prisma.sSOConfiguration.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (!ssoConfig) {
        res.json({
          status: 'success',
          data: {
            valid: false,
            errors: ['No SSO configuration found for this organization'],
          },
        });
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!ssoConfig.ssoUrl) {
        errors.push('SSO URL is not configured');
      } else {
        try {
          new URL(ssoConfig.ssoUrl);
        } catch {
          errors.push('SSO URL is not a valid URL');
        }
      }

      if (!ssoConfig.entityId) {
        errors.push('Entity ID is not configured');
      }

      if (!ssoConfig.certificate) {
        errors.push('Certificate is not configured');
      } else {
        // Basic certificate format validation (decrypt at-rest stored cert first)
        const certContent = decryptField(ssoConfig.certificate).trim();
        if (!certContent.includes('BEGIN CERTIFICATE') && !certContent.includes('MIIC')) {
          warnings.push('Certificate does not appear to be in PEM or Base64 format');
        }
      }

      if (ssoConfig.domains.length === 0) {
        warnings.push('No email domains configured; all email domains will be accepted');
      }

      if (!ssoConfig.enabled) {
        warnings.push('SSO is currently disabled');
      }

      // Test metadata URL if configured
      if (ssoConfig.metadataUrl) {
        try {
          new URL(ssoConfig.metadataUrl);
        } catch {
          errors.push('Metadata URL is not a valid URL');
        }
      }

      res.json({
        status: 'success',
        data: {
          valid: errors.length === 0,
          provider: ssoConfig.provider,
          enabled: ssoConfig.enabled,
          errors,
          warnings,
        },
      });
    } catch (error) {
      logger.error('Failed to test SSO configuration', {
        err: error,
        path: req.path,
        method: req.method,
        ssoConfigId: req.body?.ssoConfigId ?? req.params?.id,
        ip: req.ip,
      });
      const wrapped = new AppError('Failed to test SSO configuration', 500);
      (wrapped as any).cause = error;
      return next(wrapped);
    }
  })
);

export default router;
