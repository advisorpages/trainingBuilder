import { Injectable, Logger } from '@nestjs/common';
import { Session } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';

export interface TrainerKitEmailData {
  session: Session;
  trainer: Trainer;
  coachingTipsCount?: number;
  dashboardUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendTrainerKitNotification(emailData: TrainerKitEmailData): Promise<boolean> {
    try {
      // In a real implementation, you would use a service like:
      // - SendGrid
      // - AWS SES
      // - NodeMailer with SMTP
      // - Mailgun

      this.logger.log(`Sending trainer kit email to ${emailData.trainer.email} for session: ${emailData.session.title}`);

      // Mock email sending - replace with actual implementation
      const emailContent = this.generateTrainerKitEmail(emailData);

      // Simulate email sending
      await this.mockSendEmail({
        to: emailData.trainer.email,
        subject: `Trainer Kit: ${emailData.session.title}`,
        html: emailContent.html,
        text: emailContent.text,
      });

      this.logger.log(`Trainer kit email sent successfully to ${emailData.trainer.email}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to send trainer kit email: ${error.message}`, error.stack);
      return false;
    }
  }

  private generateTrainerKitEmail(data: TrainerKitEmailData): { html: string; text: string } {
    const { session, trainer, coachingTipsCount, dashboardUrl } = data;

    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trainer Kit: ${session.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .session-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #28a745; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .info-item { background: white; padding: 10px; border-radius: 4px; }
        .cta-button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .tips-section { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Trainer Kit</h1>
        <p>Your session materials and preparation guide</p>
    </div>

    <div class="content">
        <h2>Hello ${trainer.name}!</h2>
        <p>You have been assigned to lead an upcoming training session. Here are your session details and preparation materials.</p>

        <div class="session-info">
            <h3>${session.title}</h3>
            <p>${session.description || 'No description provided'}</p>

            <div class="info-grid">
                <div class="info-item">
                    <strong>📅 Date:</strong><br>
                    ${formatDate(startDate)}
                </div>
                <div class="info-item">
                    <strong>⏰ Time:</strong><br>
                    ${formatTime(startDate)} - ${formatTime(endDate)}
                </div>
                <div class="info-item">
                    <strong>📍 Location:</strong><br>
                    ${session.location?.name || 'TBD'}
                </div>
                <div class="info-item">
                    <strong>👥 Status:</strong><br>
                    ${session.status}
                </div>
            </div>
        </div>

        ${session.audience || session.tone || session.category ? `
        <div class="info-item" style="margin: 15px 0;">
            <h4>Session Attributes</h4>
            ${session.audience ? `<p><strong>Audience:</strong> ${session.audience.name}</p>` : ''}
            ${session.tone ? `<p><strong>Tone:</strong> ${session.tone.name}</p>` : ''}
            ${session.category ? `<p><strong>Category:</strong> ${session.category.name}</p>` : ''}
        </div>
        ` : ''}

        ${coachingTipsCount && coachingTipsCount > 0 ? `
        <div class="tips-section">
            <h4>💡 AI Coaching Tips Available</h4>
            <p>We've generated ${coachingTipsCount} personalized coaching tips for this session to help you deliver outstanding content.</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="cta-button">
                🎯 Access Your Trainer Dashboard
            </a>
        </div>

        <div class="info-item">
            <h4>📋 What's Available in Your Dashboard:</h4>
            <ul>
                <li>Complete session details and timing</li>
                <li>Promotional content and key messaging</li>
                <li>AI-generated coaching tips and preparation advice</li>
                <li>Location information and logistics</li>
                <li>Participant registration count</li>
            </ul>
        </div>

        <div class="info-item">
            <h4>💡 Preparation Tips:</h4>
            <ul>
                <li>Review the session materials at least 24 hours in advance</li>
                <li>Check the AI coaching tips for personalized advice</li>
                <li>Confirm location details and any technical requirements</li>
                <li>Prepare backup activities in case of timing variations</li>
            </ul>
        </div>

        <div class="info-item">
            <h4>📞 Need Help?</h4>
            <p>Contact your content developer: <strong>${session.author.email}</strong></p>
            <p>They can provide additional materials or answer questions about the session content.</p>
        </div>
    </div>

    <div class="footer">
        <p>This email was automatically generated by the Leadership Training App.</p>
        <p>Access your dashboard anytime at: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    </div>
</body>
</html>
    `;

    const text = `
Trainer Kit: ${session.title}

Hello ${trainer.name}!

You have been assigned to lead an upcoming training session.

SESSION DETAILS:
- Title: ${session.title}
- Description: ${session.description || 'No description provided'}
- Date: ${formatDate(startDate)}
- Time: ${formatTime(startDate)} - ${formatTime(endDate)}
- Location: ${session.location?.name || 'TBD'}
- Status: ${session.status}

${session.audience ? `Audience: ${session.audience.name}\n` : ''}${session.tone ? `Tone: ${session.tone.name}\n` : ''}${session.category ? `Category: ${session.category.name}\n` : ''}

${coachingTipsCount && coachingTipsCount > 0 ? `AI Coaching Tips: ${coachingTipsCount} personalized tips available\n` : ''}

ACCESS YOUR DASHBOARD:
${dashboardUrl}

WHAT'S AVAILABLE:
- Complete session details and timing
- Promotional content and key messaging
- AI-generated coaching tips and preparation advice
- Location information and logistics
- Participant registration count

PREPARATION TIPS:
- Review materials at least 24 hours in advance
- Check AI coaching tips for personalized advice
- Confirm location details and technical requirements
- Prepare backup activities for timing variations

NEED HELP?
Contact your content developer: ${session.author.email}

This email was automatically generated by the Leadership Training App.
    `;

    return { html, text };
  }

  private async mockSendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Mock implementation - replace with actual email service
    // Example integrations:

    // SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ from: 'noreply@yourapp.com', ...emailData });

    // AWS SES:
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: 'us-east-1' });
    // await ses.sendEmail({ ... }).promise();

    // NodeMailer:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter({ ... });
    // await transporter.sendMail({ from: 'noreply@yourapp.com', ...emailData });

    this.logger.log(`[MOCK EMAIL] To: ${emailData.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${emailData.subject}`);
    this.logger.log(`[MOCK EMAIL] Content length: ${emailData.html.length} chars`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async sendSessionAssignmentNotification(session: Session, trainer: Trainer): Promise<boolean> {
    if (!trainer.email) {
      this.logger.warn(`Cannot send email to trainer ${trainer.name} - no email address`);
      return false;
    }

    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trainer/dashboard`;

    return this.sendTrainerKitNotification({
      session,
      trainer,
      dashboardUrl,
    });
  }
}