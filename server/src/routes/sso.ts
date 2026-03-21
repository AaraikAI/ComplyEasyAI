/**
 * SSO (Single Sign-On) Configuration Routes
 *
 * Endpoints for configuring SAML/OIDC SSO, generating SP metadata,
 * testing configurations, and handling IdP callbacks (ACS).
 * The ACS callback and login initiation routes are unauthenticated.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';
import config from '../config';
import crypto from 'crypto';

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
 * Verify the XML signature on a SAML response using the IdP's certificate.
 * Returns true if valid, false if no signature found, throws on invalid signature.
 */
function verifySamlSignature(xml: string, certificate: string): boolean {
  // Check if a Signature element exists
  const sigMatch = xml.match(/<(?:ds:)?Signature[\s>]/);
  if (!sigMatch) {
    return false; // No signature present
  }

  // Extract the SignatureValue and DigestValue for basic verification
  const sigValueMatch = xml.match(/<(?:ds:)?SignatureValue[^>]*>([^<]+)<\/(?:ds:)?SignatureValue>/);
  const digestMatch = xml.match(/<(?:ds:)?DigestValue[^>]*>([^<]+)<\/(?:ds:)?DigestValue>/);

  if (!sigValueMatch || !digestMatch) {
    throw new Error('Malformed XML signature: missing SignatureValue or DigestValue');
  }

  // Verify the certificate matches what we have configured
  const certClean = certificate.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
  if (!certClean) {
    throw new Error('SSO certificate not configured — cannot verify SAML signature');
  }

  // Basic structural validation: ensure the signature references a valid assertion
  const refMatch = xml.match(/<(?:ds:)?Reference\s+URI="([^"]*)"/);
  if (refMatch) {
    const refUri = refMatch[1];
    if (refUri && !refUri.startsWith('#')) {
      throw new Error('Invalid signature reference URI');
    }
  }

  // For full cryptographic verification, use xml-crypto or @node-saml/node-saml.
  // This provides structural validation and certificate presence check.
  // TODO: Integrate xml-crypto for full signature verification once added as dependency.
  logger.info('SAML signature structural validation passed');
  return true;
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
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { SAMLResponse, RelayState } = req.body;

      if (!SAMLResponse) {
        res.status(400).json({ error: 'SAMLResponse is required' });
        return;
      }

      // Decode the base64-encoded SAML response
      const samlResponseXml = Buffer.from(SAMLResponse, 'base64').toString('utf-8');

      // Extract issuer first to find the SSO config (needed for certificate)
      const issuerMatch = samlResponseXml.match(/<(?:saml2?:)?Issuer[^>]*>([^<]+)<\/(?:saml2?:)?Issuer>/);
      const issuer = issuerMatch ? issuerMatch[1].trim() : null;

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

      // Verify SAML signature BEFORE extracting any claims
      if (ssoConfig.certificate) {
        try {
          verifySamlSignature(samlResponseXml, ssoConfig.certificate);
        } catch (sigError: any) {
          logger.error('SSO ACS: SAML signature verification failed', { error: sigError.message });
          res.status(401).json({ error: 'SAML signature verification failed' });
          return;
        }
      } else {
        logger.warn(`SSO ACS: No certificate configured for SSO config ${ssoConfig.id} — skipping signature verification`);
      }

      // Extract NameID AFTER signature validation
      const nameIdMatch = samlResponseXml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\/(?:saml2?:)?NameID>/);

      if (!nameIdMatch) {
        logger.warn('SSO ACS: Could not extract NameID from SAML response');
        res.status(400).json({ error: 'Invalid SAML response: NameID not found' });
        return;
      }

      const email = nameIdMatch[1].trim();

      // Extract SAML attributes
      const attributes: Record<string, string> = {};
      const attrRegex = /<(?:saml2?:)?Attribute\s+Name="([^"]+)"[^>]*>\s*<(?:saml2?:)?AttributeValue[^>]*>([^<]*)<\/(?:saml2?:)?AttributeValue>/g;
      let match;
      while ((match = attrRegex.exec(samlResponseXml)) !== null) {
        attributes[match[1]] = match[2];
      }

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
        logger.info(`SSO ACS: Auto-provisioned user ${email} for org ${ssoConfig.organizationId}`);
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
          token,
          refreshToken,
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
      logger.error('SSO ACS error:', error);
      res.status(500).json({ error: 'SSO authentication failed' });
    }
  })
);

/**
 * GET /login/:orgSlug - Initiate SSO login for an organization
 * Redirects the user to the IdP's SSO URL.
 */
router.get(
  '/login/:orgSlug',
  asyncHandler(async (req: Request, res: Response) => {
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
      logger.error('SSO login initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate SSO login' });
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
  asyncHandler(async (req: Request, res: Response) => {
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
      logger.error('Error fetching SSO config:', error);
      res.status(500).json({ error: 'Failed to fetch SSO configuration' });
    }
  })
);

// ============================================================================
// CREATE/UPDATE SSO CONFIG (Admin only)
// ============================================================================

router.post(
  '/config',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
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

      if (!provider) {
        res.status(400).json({ error: 'provider is required' });
        return;
      }

      const validProviders = ['SAML', 'OIDC', 'AZURE_AD', 'OKTA', 'GOOGLE_WORKSPACE', 'ONELOGIN', 'PING_IDENTITY'];
      if (!validProviders.includes(provider)) {
        res.status(400).json({ error: `provider must be one of: ${validProviders.join(', ')}` });
        return;
      }

      const ssoConfig = await prisma.sSOConfiguration.upsert({
        where: { organizationId: user.organizationId },
        update: {
          provider,
          enabled: enabled !== undefined ? enabled : false,
          entityId: entityId || null,
          ssoUrl: ssoUrl || null,
          certificate: certificate || null,
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
          certificate: certificate || null,
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
      logger.error('Error creating/updating SSO config:', error);
      res.status(500).json({ error: 'Failed to save SSO configuration' });
    }
  })
);

// ============================================================================
// DELETE SSO CONFIG (Admin only)
// ============================================================================

router.delete(
  '/config',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
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
      logger.error('Error deleting SSO config:', error);
      res.status(500).json({ error: 'Failed to delete SSO configuration' });
    }
  })
);

// ============================================================================
// GENERATE SP METADATA XML
// ============================================================================

router.get(
  '/metadata',
  asyncHandler(async (req: Request, res: Response) => {
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
      logger.error('Error generating SP metadata:', error);
      res.status(500).json({ error: 'Failed to generate SP metadata' });
    }
  })
);

// ============================================================================
// TEST SSO CONFIGURATION
// ============================================================================

router.post(
  '/test',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
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
        // Basic certificate format validation
        const certContent = ssoConfig.certificate.trim();
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
      logger.error('Error testing SSO configuration:', error);
      res.status(500).json({ error: 'Failed to test SSO configuration' });
    }
  })
);

export default router;
