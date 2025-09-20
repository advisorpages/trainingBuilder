import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QrCodeService } from '../../services/qr-code.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Session, SessionStatus } from '../../entities/session.entity';
import { ConfigService } from '@nestjs/config';

interface QrCodeStatusResponse {
  session_id: string;
  title: string;
  status: string;
  qr_code_url?: string;
  has_qr_code: boolean;
  created_at: string;
  updated_at: string;
}

interface QrCodeGenerationResponse {
  success: boolean;
  session_id: string;
  qr_code_url?: string;
  error?: string;
}

interface BatchQrCodeRequest {
  session_ids: string[];
}

interface BatchQrCodeResponse {
  results: Array<{
    session_id: string;
    success: boolean;
    qr_code_url?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
  };
}

@Controller('admin/qr-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BROKER)
export class QrAdminController {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private qrCodeService: QrCodeService,
    private configService: ConfigService,
  ) {}

  /**
   * Get QR code status for all published sessions (AC: 11)
   */
  @Get('status')
  async getQrCodeStatus(): Promise<{ sessions: QrCodeStatusResponse[] }> {
    try {
      const sessions = await this.sessionRepository.find({
        where: {
          status: SessionStatus.PUBLISHED,
          isActive: true
        },
        order: { createdAt: 'DESC' },
      });

      const sessionStatus: QrCodeStatusResponse[] = sessions.map(session => ({
        session_id: session.id,
        title: session.title,
        status: session.status,
        qr_code_url: session.qrCodeUrl,
        has_qr_code: !!session.qrCodeUrl,
        created_at: session.createdAt.toISOString(),
        updated_at: session.updatedAt.toISOString(),
      }));

      return { sessions: sessionStatus };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve QR code status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate QR code for a specific session (AC: 7)
   */
  @Post('sessions/:sessionId/generate')
  async generateQrCode(
    @Param('sessionId') sessionId: string,
  ): Promise<QrCodeGenerationResponse> {
    try {
      // Find the session
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId }
      });

      if (!session) {
        throw new HttpException(
          `Session with ID ${sessionId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Get base URL from configuration
      const baseUrl = this.configService.get<string>('VITE_API_URL', 'http://localhost:3001/api').replace('/api', '');

      // Generate QR code
      const result = await this.qrCodeService.generateQrCodeForSession(
        session.id,
        session.title,
        baseUrl
      );

      if (result.success && result.qrCodeUrl) {
        // Update the session with the QR code URL
        await this.sessionRepository.update(session.id, {
          qrCodeUrl: result.qrCodeUrl
        });

        return {
          success: true,
          session_id: sessionId,
          qr_code_url: result.qrCodeUrl,
        };
      } else {
        return {
          success: false,
          session_id: sessionId,
          error: result.error || 'Unknown error occurred',
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to generate QR code: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Regenerate QR code for a specific session (AC: 7)
   */
  @Post('sessions/:sessionId/regenerate')
  async regenerateQrCode(
    @Param('sessionId') sessionId: string,
  ): Promise<QrCodeGenerationResponse> {
    try {
      // Find the session
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId }
      });

      if (!session) {
        throw new HttpException(
          `Session with ID ${sessionId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Get base URL from configuration
      const baseUrl = this.configService.get<string>('VITE_API_URL', 'http://localhost:3001/api').replace('/api', '');

      // Regenerate QR code
      const result = await this.qrCodeService.regenerateQrCodeForSession(
        session.id,
        session.title,
        baseUrl,
        session.qrCodeUrl // Pass existing QR code URL for reference
      );

      if (result.success && result.qrCodeUrl) {
        // Update the session with the new QR code URL
        await this.sessionRepository.update(session.id, {
          qrCodeUrl: result.qrCodeUrl
        });

        return {
          success: true,
          session_id: sessionId,
          qr_code_url: result.qrCodeUrl,
        };
      } else {
        return {
          success: false,
          session_id: sessionId,
          error: result.error || 'Unknown error occurred',
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to regenerate QR code: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch generate QR codes for multiple sessions (AC: 10)
   */
  @Post('batch-generate')
  async batchGenerateQrCodes(
    @Body() request: BatchQrCodeRequest,
  ): Promise<BatchQrCodeResponse> {
    try {
      if (!request.session_ids || request.session_ids.length === 0) {
        throw new HttpException(
          'No session IDs provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find all sessions
      const sessions = await this.sessionRepository.find({
        where: {
          id: In(request.session_ids),
          isActive: true
        }
      });

      if (sessions.length !== request.session_ids.length) {
        const foundIds = sessions.map(s => s.id);
        const missingIds = request.session_ids.filter(id => !foundIds.includes(id));
        throw new HttpException(
          `Sessions not found: ${missingIds.join(', ')}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Get base URL from configuration
      const baseUrl = this.configService.get<string>('VITE_API_URL', 'http://localhost:3001/api').replace('/api', '');

      // Prepare batch data for QR code service
      const sessionData = sessions.map(session => ({
        id: session.id,
        title: session.title
      }));

      // Generate QR codes in batch
      const results = await this.qrCodeService.batchGenerateQrCodes(sessionData, baseUrl);

      // Update sessions with QR code URLs
      const updatePromises = results
        .filter(result => result.result.success && result.result.qrCodeUrl)
        .map(result =>
          this.sessionRepository.update(result.sessionId, {
            qrCodeUrl: result.result.qrCodeUrl
          })
        );

      await Promise.all(updatePromises);

      // Prepare response
      const responseResults = results.map(result => ({
        session_id: result.sessionId,
        success: result.result.success,
        qr_code_url: result.result.qrCodeUrl,
        error: result.result.error,
      }));

      const successful = results.filter(r => r.result.success).length;
      const failed = results.length - successful;

      return {
        results: responseResults,
        summary: {
          total: results.length,
          successful,
          failed,
          success_rate: successful / results.length,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to batch generate QR codes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get sessions that are missing QR codes
   */
  @Get('missing')
  async getSessionsMissingQrCodes(): Promise<{ sessions: QrCodeStatusResponse[] }> {
    try {
      const sessions = await this.sessionRepository.find({
        where: {
          status: SessionStatus.PUBLISHED,
          qrCodeUrl: null,
          isActive: true
        },
        order: { createdAt: 'DESC' },
      });

      const sessionStatus: QrCodeStatusResponse[] = sessions.map(session => ({
        session_id: session.id,
        title: session.title,
        status: session.status,
        qr_code_url: session.qrCodeUrl,
        has_qr_code: false,
        created_at: session.createdAt.toISOString(),
        updated_at: session.updatedAt.toISOString(),
      }));

      return { sessions: sessionStatus };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve sessions missing QR codes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}