import nodemailer, { type Transporter } from "nodemailer";
import {
  getMissingSmtpEnvVars,
  getSmtpConfig,
  type SmtpConfig,
} from "@/lib/email/email.config";
import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
} from "@/lib/email/templates";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: SmtpConfig | null = null;
  private initialized = false;
  private configErrorLogged = false;

  private initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.config = getSmtpConfig();
    if (!this.config) {
      this.logConfigError();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port === 465,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  private logConfigError(): void {
    if (this.configErrorLogged) return;
    this.configErrorLogged = true;

    const missing = getMissingSmtpEnvVars();
    console.error(
      `[EmailService] SMTP is not configured. Missing environment variables: ${missing.join(", ")}. Emails will not be sent.`,
    );
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    this.initialize();

    if (!this.transporter || !this.config) {
      this.logConfigError();
      console.error(
        `[EmailService] Skipped email to ${input.to} (subject: "${input.subject}") — SMTP not configured.`,
      );
      return { sent: false };
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      return { sent: true };
    } catch (error) {
      console.error(
        `[EmailService] Failed to send email to ${input.to} (subject: "${input.subject}"):`,
        error,
      );
      return { sent: false };
    }
  }

  async sendVerificationEmail(input: {
    to: string;
    name: string;
    verifyLink: string;
  }): Promise<SendEmailResult> {
    const template = verificationEmailTemplate({
      name: input.name,
      verifyLink: input.verifyLink,
    });

    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(input: {
    to: string;
    name: string;
    resetLink: string;
  }): Promise<SendEmailResult> {
    const template = passwordResetEmailTemplate({
      name: input.name,
      resetLink: input.resetLink,
    });

    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

export const emailService = new EmailService();
