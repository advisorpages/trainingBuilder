import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Registration } from '../../entities/registration.entity';
import { Trainer } from '../../entities/trainer.entity';
import { Topic } from '../../entities/topic.entity';
import { AnalyticsService } from './analytics.service';

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includedMetrics: {
    sessions: boolean;
    registrations: boolean;
    trainers: boolean;
    topics: boolean;
  };
  reportTitle: string;
  reportDescription: string;
  includeCharts: boolean;
  filters?: any;
}

export interface ExportResult {
  filename: string;
  downloadUrl: string;
  fileSize: number;
  recordCount: number;
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    private analyticsService: AnalyticsService,
  ) {}

  async exportData(options: ExportOptions, _userId: number): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analytics-export-${options.format}-${timestamp}`;

    switch (options.format) {
      case 'csv':
        return this.exportCSV(options, filename);
      case 'excel':
        return this.exportExcel(options, filename);
      case 'json':
        return this.exportJSON(options, filename);
      case 'pdf':
        return this.exportPDF(options, filename);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async exportCSV(options: ExportOptions, baseFilename: string): Promise<ExportResult> {
    const data = await this.collectExportData(options);
    const filename = `${baseFilename}.csv`;
    const filePath = path.join(process.cwd(), 'uploads', 'exports', filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let csvContent = `${options.reportTitle}\n`;
    csvContent += `Generated: ${new Date().toISOString()}\n`;
    csvContent += `Date Range: ${options.dateRange.startDate} to ${options.dateRange.endDate}\n\n`;

    if (options.includedMetrics.sessions && data.sessions) {
      csvContent += 'SESSIONS DATA\n';
      csvContent += 'ID,Title,Status,Start Time,End Time,Trainer,Registrations\n';
      data.sessions.forEach(session => {
        csvContent += `${session.id},"${session.title}",${session.status},${session.startTime},${session.endTime},"${session.trainer?.firstName} ${session.trainer?.lastName}",${session.registrations?.length || 0}\n`;
      });
      csvContent += '\n';
    }

    if (options.includedMetrics.registrations && data.registrations) {
      csvContent += 'REGISTRATIONS DATA\n';
      csvContent += 'ID,Session Title,Registration Date,Status\n';
      data.registrations.forEach(reg => {
        csvContent += `${reg.id},"${reg.session?.title}",${reg.createdAt},${reg.syncStatus}\n`;
      });
      csvContent += '\n';
    }

    if (options.includedMetrics.trainers && data.trainers) {
      csvContent += 'TRAINERS DATA\n';
      csvContent += 'ID,Name,Email,Session Count,Total Registrations\n';
      data.trainers.forEach(trainer => {
        csvContent += `${trainer.id},"${trainer.firstName} ${trainer.lastName}",${trainer.email},${trainer.sessions?.length || 0},${trainer.totalRegistrations || 0}\n`;
      });
    }

    fs.writeFileSync(filePath, csvContent);

    const stats = fs.statSync(filePath);
    return {
      filename,
      downloadUrl: `/api/admin/exports/download/${filename}`,
      fileSize: stats.size,
      recordCount: this.calculateRecordCount(data, options)
    };
  }

  private async exportExcel(options: ExportOptions, baseFilename: string): Promise<ExportResult> {
    const data = await this.collectExportData(options);
    const filename = `${baseFilename}.xlsx`;
    const filePath = path.join(process.cwd(), 'uploads', 'exports', filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();

    // Summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow([options.reportTitle]);
    summarySheet.addRow([`Generated: ${new Date().toISOString()}`]);
    summarySheet.addRow([`Date Range: ${options.dateRange.startDate} to ${options.dateRange.endDate}`]);
    summarySheet.addRow([options.reportDescription]);

    // Sessions worksheet
    if (options.includedMetrics.sessions && data.sessions) {
      const sessionsSheet = workbook.addWorksheet('Sessions');
      sessionsSheet.addRow(['ID', 'Title', 'Status', 'Start Time', 'End Time', 'Trainer', 'Registrations']);

      data.sessions.forEach(session => {
        sessionsSheet.addRow([
          session.id,
          session.title,
          session.status,
          session.startTime,
          session.endTime,
          `${session.trainer?.firstName} ${session.trainer?.lastName}`,
          session.registrations?.length || 0
        ]);
      });

      // Format header row
      const headerRow = sessionsSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };
    }

    // Registrations worksheet
    if (options.includedMetrics.registrations && data.registrations) {
      const registrationsSheet = workbook.addWorksheet('Registrations');
      registrationsSheet.addRow(['ID', 'Session Title', 'Registration Date', 'Status']);

      data.registrations.forEach(reg => {
        registrationsSheet.addRow([
          reg.id,
          reg.session?.title,
          reg.createdAt,
          reg.syncStatus
        ]);
      });

      const headerRow = registrationsSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };
    }

    // Trainers worksheet
    if (options.includedMetrics.trainers && data.trainers) {
      const trainersSheet = workbook.addWorksheet('Trainers');
      trainersSheet.addRow(['ID', 'Name', 'Email', 'Session Count', 'Total Registrations']);

      data.trainers.forEach(trainer => {
        trainersSheet.addRow([
          trainer.id,
          `${trainer.firstName} ${trainer.lastName}`,
          trainer.email,
          trainer.sessions?.length || 0,
          trainer.totalRegistrations || 0
        ]);
      });

      const headerRow = trainersSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };
    }

    await workbook.xlsx.writeFile(filePath);

    const stats = fs.statSync(filePath);
    return {
      filename,
      downloadUrl: `/api/admin/exports/download/${filename}`,
      fileSize: stats.size,
      recordCount: this.calculateRecordCount(data, options)
    };
  }

  private async exportJSON(options: ExportOptions, baseFilename: string): Promise<ExportResult> {
    const data = await this.collectExportData(options);
    const filename = `${baseFilename}.json`;
    const filePath = path.join(process.cwd(), 'uploads', 'exports', filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const exportData = {
      metadata: {
        title: options.reportTitle,
        description: options.reportDescription,
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        includedMetrics: options.includedMetrics
      },
      data: {
        sessions: options.includedMetrics.sessions ? data.sessions : undefined,
        registrations: options.includedMetrics.registrations ? data.registrations : undefined,
        trainers: options.includedMetrics.trainers ? data.trainers : undefined,
        topics: options.includedMetrics.topics ? data.topics : undefined
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

    const stats = fs.statSync(filePath);
    return {
      filename,
      downloadUrl: `/api/admin/exports/download/${filename}`,
      fileSize: stats.size,
      recordCount: this.calculateRecordCount(data, options)
    };
  }

  private async exportPDF(options: ExportOptions, baseFilename: string): Promise<ExportResult> {
    // For now, return a simple text-based PDF placeholder
    // In a real implementation, you'd use puppeteer or similar
    const filename = `${baseFilename}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'exports', filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create a simple text file for now (would be actual PDF generation)
    const content = `${options.reportTitle}\n\nGenerated: ${new Date().toISOString()}\nDate Range: ${options.dateRange.startDate} to ${options.dateRange.endDate}\n\n${options.reportDescription}\n\nPDF generation would include charts and formatted tables here.`;

    fs.writeFileSync(filePath, content);

    const stats = fs.statSync(filePath);
    return {
      filename,
      downloadUrl: `/api/admin/exports/download/${filename}`,
      fileSize: stats.size,
      recordCount: 0
    };
  }

  private async collectExportData(options: ExportOptions) {
    const startDate = new Date(options.dateRange.startDate);
    const _endDate = new Date(options.dateRange.endDate);

    const data: any = {};

    if (options.includedMetrics.sessions) {
      data.sessions = await this.sessionRepository.find({
        where: {
          createdAt: MoreThanOrEqual(startDate),
          status: SessionStatus.PUBLISHED
        },
        relations: ['trainer', 'registrations']
      });
    }

    if (options.includedMetrics.registrations) {
      data.registrations = await this.registrationRepository.find({
        where: {
          createdAt: MoreThanOrEqual(startDate)
        },
        relations: ['session']
      });
    }

    if (options.includedMetrics.trainers) {
      data.trainers = await this.trainerRepository.find({
        relations: ['sessions']
      });
    }

    if (options.includedMetrics.topics) {
      data.topics = await this.topicRepository.find({
        relations: ['sessions']
      });
    }

    return data;
  }

  private calculateRecordCount(data: any, options: ExportOptions): number {
    let count = 0;
    if (options.includedMetrics.sessions && data.sessions) count += data.sessions.length;
    if (options.includedMetrics.registrations && data.registrations) count += data.registrations.length;
    if (options.includedMetrics.trainers && data.trainers) count += data.trainers.length;
    if (options.includedMetrics.topics && data.topics) count += data.topics.length;
    return count;
  }
}