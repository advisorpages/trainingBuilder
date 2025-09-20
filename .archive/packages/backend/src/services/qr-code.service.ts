import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

interface QrCodeCreateRequest {
  name: string;
  type: 'url';
  url: string;
  style?: string;
  foreground_color?: string;
  background_color?: string;
}

interface QrCodeCreateResponse {
  data: {
    id: number;
  };
}

interface QrCodeDetailsResponse {
  data: {
    id: number;
    name: string;
    type: string;
    qr_code: string;
    settings: {
      url: string;
      style: string;
      foreground_color: string;
      background_color: string;
      size: number;
      ecc: string;
    };
    datetime: string;
  };
}

interface QrCodeGenerationResult {
  success: boolean;
  qrCodeUrl?: string;
  qrCodeId?: string;
  error?: string;
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly defaultErrorCorrection: string;
  private readonly defaultSize: string;
  private readonly defaultFormat: string;

  constructor(private configService: ConfigService) {
    this.apiBaseUrl = this.configService.get<string>('QR_CLOUD_API_URL', 'https://qrcodes.at/api');
    this.apiKey = this.configService.get<string>('QR_CLOUD_API_KEY');
    this.defaultErrorCorrection = this.configService.get<string>('QR_CODE_ERROR_CORRECTION', 'M');
    this.defaultSize = this.configService.get<string>('QR_CODE_SIZE', '300x300');
    this.defaultFormat = this.configService.get<string>('QR_CODE_FORMAT', 'PNG');

    if (!this.apiKey) {
      this.logger.warn('QR_CLOUD_API_KEY not configured. QR code generation will be disabled.');
    }
  }

  /**
   * Generate a QR code for a session URL
   */
  async generateQrCodeForSession(
    sessionId: string,
    sessionTitle: string,
    baseUrl: string
  ): Promise<QrCodeGenerationResult> {
    if (!this.apiKey) {
      this.logger.error('QR code generation skipped: API key not configured');
      return {
        success: false,
        error: 'QR code API not configured'
      };
    }

    const targetUrl = `${baseUrl}/sessions/${sessionId}`;
    const qrCodeName = `Session: ${sessionTitle}`;

    try {
      this.logger.log(`Generating QR code for session ${sessionId}: ${targetUrl}`);

      const response = await this.createQrCode({
        name: qrCodeName,
        type: 'url',
        url: targetUrl,
        style: 'round',
        foreground_color: '#000000',
        background_color: '#FFFFFF'
      });

      if (response.success && response.qrCodeUrl) {
        this.logger.log(`QR code generated successfully for session ${sessionId}: ${response.qrCodeUrl}`);
        return response;
      } else {
        this.logger.error(`Failed to generate QR code for session ${sessionId}: ${response.error}`);
        return response;
      }
    } catch (error) {
      this.logger.error(`QR code generation failed for session ${sessionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Regenerate QR code for an existing session
   */
  async regenerateQrCodeForSession(
    sessionId: string,
    sessionTitle: string,
    baseUrl: string,
    existingQrCodeId?: string
  ): Promise<QrCodeGenerationResult> {
    // For regeneration, we'll create a new QR code
    // Note: qrcodes.at API doesn't seem to have explicit regeneration, so we create new ones
    this.logger.log(`Regenerating QR code for session ${sessionId}`);

    const result = await this.generateQrCodeForSession(sessionId, sessionTitle, baseUrl);

    if (result.success) {
      this.logger.log(`QR code regenerated successfully for session ${sessionId}`);
    }

    return result;
  }

  /**
   * Batch generate QR codes for multiple sessions
   */
  async batchGenerateQrCodes(
    sessions: Array<{ id: string; title: string }>,
    baseUrl: string
  ): Promise<Array<{ sessionId: string; result: QrCodeGenerationResult }>> {
    const results: Array<{ sessionId: string; result: QrCodeGenerationResult }> = [];

    this.logger.log(`Starting batch QR code generation for ${sessions.length} sessions`);

    for (const session of sessions) {
      const result = await this.generateQrCodeForSession(session.id, session.title, baseUrl);
      results.push({
        sessionId: session.id,
        result
      });

      // Add small delay between requests to avoid rate limiting
      await this.delay(100);
    }

    const successCount = results.filter(r => r.result.success).length;
    this.logger.log(`Batch QR code generation completed: ${successCount}/${sessions.length} successful`);

    return results;
  }

  /**
   * Create QR code via qrcodes.at API
   */
  private async createQrCode(request: QrCodeCreateRequest): Promise<QrCodeGenerationResult> {
    try {
      const formData = new FormData();
      formData.append('name', request.name);
      formData.append('type', request.type);
      formData.append('url', request.url);

      if (request.style) {
        formData.append('style', request.style);
      }
      if (request.foreground_color) {
        formData.append('foreground_color', request.foreground_color);
      }
      if (request.background_color) {
        formData.append('background_color', request.background_color);
      }

      // Step 1: Create QR code
      const createResponse: AxiosResponse<QrCodeCreateResponse> = await axios.post(
        `${this.apiBaseUrl}/qr-codes`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!createResponse.data?.data?.id) {
        return {
          success: false,
          error: 'Invalid response from QR code creation API'
        };
      }

      const qrCodeId = createResponse.data.data.id;

      // Step 2: Get QR code details to retrieve the image URL
      const detailsResponse: AxiosResponse<QrCodeDetailsResponse> = await axios.get(
        `${this.apiBaseUrl}/qr-codes/${qrCodeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      );

      if (detailsResponse.data?.data?.qr_code) {
        return {
          success: true,
          qrCodeUrl: detailsResponse.data.data.qr_code,
          qrCodeId: qrCodeId.toString()
        };
      } else {
        return {
          success: false,
          error: 'Could not retrieve QR code image URL'
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        this.logger.error(`QR code API error (${error.response?.status}):`, errorMessage);
        return {
          success: false,
          error: `API Error: ${errorMessage}`
        };
      } else {
        this.logger.error('Unexpected error creating QR code:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }

  /**
   * Simple delay utility for batch operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}