import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  attachments: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
  read: boolean;
}

// Email transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// IMAP client for reading emails
const imapClient = new ImapFlow({
  host: process.env.IMAP_HOST || '',
  port: Number(process.env.IMAP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD,
  },
  logger: false
});

export const emailService = {
  // Send email
  async sendEmail(to: string[], subject: string, text: string, html?: string, cc?: string[], bcc?: string[]) {
    try {
      const mailOptions = {
        from: `"Real Estate CRM" <${process.env.EMAIL_USER}>`,
        to: to.join(', '),
        cc: cc?.join(', '),
        bcc: bcc?.join(', '),
        subject,
        text,
        html: html || text,
      };

      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Send email error:', error);
      throw error;
    }
  },

  // Read latest emails
  async getLatestEmails(limit = 10) {
    try {
      await imapClient.connect();
      
      const lock = await imapClient.getMailboxLock('INBOX');
      
      try {
        const messages = [];
        for await (const message of imapClient.fetch({ seq: `1:${limit}` }, { source: true })) {
          const parsed = await simpleParser(message.source);
          messages.push({
            id: message.uid,
            subject: parsed.subject,
            from: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
            to: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
            date: parsed.date,
            text: parsed.text,
            html: parsed.html
          });
        }
        return messages;
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error('Get emails error:', error);
      throw error;
    } finally {
      await imapClient.logout();
    }
  },

  // Send lead-related email
  async sendLeadEmail(to: string[], subject: string, content: string, cc?: string[], bcc?: string[]) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">${subject}</h2>
        <div style="color: #4a5568; line-height: 1.6;">
          ${content}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096;">
          <p>Best regards,<br>Your Real Estate Team</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, content, html, cc, bcc);
  }
}; 