/**
 * EU AI Act External Registration Client
 *
 * This service encapsulates calls to an external EU AI system registration API.
 * It is driven entirely by environment variables and is designed to fail
 * gracefully: if configuration is missing or the external service is unavailable,
 * the rest of the EU AI Act workflow continues and the system remains in a
 * "Registration ID Pending" state.
 */

import axios from 'axios';
import config from '../../config';
import logger from '../../config/logger';
import { isUrlSafe } from '../../utils/urlValidator';
import { AppError } from '../../middleware/errorHandler';

interface EUAIRegistrationPayload {
  organizationId: string;
  systemName: string;
  riskLevel: string;
  highRiskCategory?: string;
  isGeneralPurpose: boolean;
  isGenerative: boolean;
}

interface EUAIRegistrationResponse {
  registrationId: string;
}

class EUAiDatabaseClient {
  private isEnabled(): boolean {
    const { euAiDb } = config;
    return Boolean(
      euAiDb &&
        euAiDb.apiBaseUrl &&
        euAiDb.clientId &&
        euAiDb.clientSecret &&
        euAiDb.orgId,
    );
  }

  /**
   * Register a high‑risk AI system in the external EU database.
   *
   * Returns the registration ID on success, or null if registration
   * could not be completed (e.g. configuration missing or network error).
   */
  async registerSystem(
    payload: EUAIRegistrationPayload,
  ): Promise<string | null> {
    if (!this.isEnabled()) {
      logger.warn(
        'EU AI DB registration skipped: EU_AI_DB_* configuration is incomplete',
      );
      return null;
    }

    const { euAiDb } = config;

    try {
      const url = `${euAiDb.apiBaseUrl.replace(/\/+$/, '')}/systems`;
      if (!isUrlSafe(url)) {
        throw new AppError('EU AI database URL is unsafe', 400);
      }

      const response = await axios.post<EUAIRegistrationResponse>(
        url,
        {
          organizationId: euAiDb.orgId,
          systemName: payload.systemName,
          riskLevel: payload.riskLevel,
          highRiskCategory: payload.highRiskCategory,
          isGeneralPurpose: payload.isGeneralPurpose,
          isGenerative: payload.isGenerative,
        },
        {
          timeout: 10000,
          auth: {
            username: euAiDb.clientId,
            password: euAiDb.clientSecret,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data?.registrationId) {
        logger.warn(
          'EU AI DB registration completed but response did not include registrationId',
        );
        return null;
      }

      logger.info('EU AI DB registration successful', {
        registrationId: response.data.registrationId,
        riskLevel: payload.riskLevel,
        highRiskCategory: payload.highRiskCategory,
      });

      return response.data.registrationId;
    } catch (error: any) {
      logger.error('EU AI DB registration failed', {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });
      return null;
    }
  }
}

export default new EUAiDatabaseClient();

