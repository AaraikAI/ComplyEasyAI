import { describe, it, expect } from '@jest/globals';
import { submitDemoRequestSchema } from '../../../validators/demoSchemas';

describe('submitDemoRequestSchema', () => {
  // Exactly the payload components/DemoBookingForm.tsx sends via api.demo.submitRequest.
  const formPayload = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    company: 'Analytical Engines',
    jobTitle: 'CTO',
    phone: '+1 555 0100',
    companySize: '11-50',
    industry: 'SaaS / Software',
    country: 'US',
    interestedTier: 'growth',
    currentChallenge: 'SOC 2 by Q4',
    howDidYouHear: 'Search',
    message: 'Hello',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'soc2',
  };

  it('accepts every field the demo booking form sends', () => {
    const { error } = submitDemoRequestSchema.validate(formPayload);
    expect(error).toBeUndefined();
  });

  it('still rejects fields the controller does not persist', () => {
    const { error } = submitDemoRequestSchema.validate({ ...formPayload, isAdmin: true });
    expect(error?.message).toMatch(/isAdmin/);
  });

  it('still requires the identity fields', () => {
    const { error } = submitDemoRequestSchema.validate({ email: 'ada@example.com' });
    expect(error?.message).toMatch(/firstName/);
  });
});
