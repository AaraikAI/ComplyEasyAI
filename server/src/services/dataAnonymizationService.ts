/**
 * Data Anonymization Service (GDPR Recital 26)
 * FIPS 140-2 compliant — uses only HMAC-SHA256 for pseudonymization
 */
import crypto from 'crypto';
import logger from '../config/logger';

interface AnonymizationResult {
  originalField: string;
  anonymizedValue: string;
  method: string;
}

interface AnonymizationConfig {
  method: 'pseudonymization' | 'masking' | 'generalization' | 'suppression' | 'kAnonymity';
  preserveFormat?: boolean;
  kValue?: number; // for k-anonymity
}

class DataAnonymizationService {
  private pseudonymizationKey: string;

  constructor() {
    this.pseudonymizationKey = process.env.ANONYMIZATION_KEY || process.env.ENCRYPTION_KEY || 'default-anonymization-key';
  }

  // Pseudonymize using HMAC-SHA256 (FIPS-approved)
  pseudonymize(value: string, context?: string): string {
    const hmac = crypto.createHmac('sha256', this.pseudonymizationKey);
    hmac.update(context ? `${context}:${value}` : value);
    return `PSEUDO_${hmac.digest('hex').substring(0, 16)}`;
  }

  // Mask email: john.doe@example.com -> j***@e***.com
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***.***';
    const [domainName, tld] = domain.split('.');
    return `${local[0]}***@${domainName[0]}***.${tld || '***'}`;
  }

  // Mask phone: +1-555-123-4567 -> +1-555-***-****
  maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return phone.replace(/\d(?=\d{4})/g, '*').replace(/\*+/, (m) => '*'.repeat(Math.min(m.length, 6)));
  }

  // Mask name: John Doe -> J*** D***
  maskName(name: string): string {
    return name.split(' ').map(part => part.length > 0 ? `${part[0]}${'*'.repeat(Math.min(part.length - 1, 5))}` : '').join(' ');
  }

  // Generalize age into ranges
  generalizeAge(age: number): string {
    if (age < 18) return 'Under 18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }

  // Generalize location to region
  generalizeLocation(city: string, country: string): string {
    return country || 'Unknown Region';
  }

  // Suppress (full removal)
  suppress(): string {
    return '[REDACTED]';
  }

  // Full anonymization pipeline for a data record
  async anonymizeRecord(record: Record<string, any>, fieldConfig: Record<string, AnonymizationConfig>): Promise<Record<string, any>> {
    const result: Record<string, any> = { ...record };

    for (const [field, config] of Object.entries(fieldConfig)) {
      if (!(field in record) || record[field] === null || record[field] === undefined) continue;

      const value = String(record[field]);

      switch (config.method) {
        case 'pseudonymization':
          result[field] = this.pseudonymize(value, field);
          break;
        case 'masking':
          if (field.toLowerCase().includes('email')) result[field] = this.maskEmail(value);
          else if (field.toLowerCase().includes('phone')) result[field] = this.maskPhone(value);
          else if (field.toLowerCase().includes('name')) result[field] = this.maskName(value);
          else result[field] = value.substring(0, 1) + '*'.repeat(Math.min(value.length - 1, 10));
          break;
        case 'generalization':
          if (field.toLowerCase().includes('age')) result[field] = this.generalizeAge(Number(value));
          else result[field] = value;
          break;
        case 'suppression':
          result[field] = this.suppress();
          break;
        default:
          result[field] = value;
      }
    }

    logger.info(`Anonymized record with ${Object.keys(fieldConfig).length} fields`);
    return result;
  }

  // Batch anonymization
  async anonymizeBatch(records: Record<string, any>[], fieldConfig: Record<string, AnonymizationConfig>): Promise<Record<string, any>[]> {
    return Promise.all(records.map(record => this.anonymizeRecord(record, fieldConfig)));
  }
}

export default new DataAnonymizationService();
