import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailPayload } from '../utils/constant/interface';
import * as dotenv from 'dotenv';
import { randomInt } from 'crypto';
dotenv.config();
import * as SendGrid from '@sendgrid/mail';
const {
  EMAIL_SERVICE,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL,
  EMAIL_PASS,
  MAIL_TYPE,
} = process.env;

const transporter: nodemailer.Transporter = nodemailer.createTransport({
  // host: ' smtp.gmail.com',
  service: EMAIL_SERVICE,
  port: Number(EMAIL_PORT),
  secure: EMAIL_SECURE === 'true',
  auth: {
    user: EMAIL!,
    pass: EMAIL_PASS!,
  },
});

SendGrid.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendOtp = (): number => {
  return randomInt(100000, 999999);
};

export const sendWithSendGrid = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
) => {
  try {
    await SendGrid.send({
      to,
      from: {
        name: 'Team MarketPlace',
        email: process.env.SENDGRID_FROM_EMAIL!,
      },
      subject,
      text,
      html,
    });

    Logger.log(`Email sent to ${to}`);
  } catch (error) {
    Logger.error('SendGrid Mail Error', error);
    throw new Error(
      (error instanceof Error ? error.message : String(error)) ||
        'Failed to send email',
    );
  }
};

export const sendWithNodeMailer = async (
  to: string,
  subject: string,
  body: string,
  bcc: string[] = [],
): Promise<EmailPayload> => {
  try {
    const result = await transporter.sendMail({
      from: `"Team MarketPlace" <vishalbhilavala.shivinfotech@gmail.com>`,
      to,
      bcc,
      subject,
      html: body,
    });

    Logger.log(`Email sent to ${to}`);
    return result as EmailPayload;
  } catch (error) {
    Logger.error('Failed to send email: ' + JSON.stringify(error));
    throw new Error('Email sending failed');
  }
};

export const emailSend = async (to: string, subject: string, html: string) => {
  if (MAIL_TYPE === 'sendgrid') {
    return sendWithSendGrid(to, subject, html);
  }

  return sendWithNodeMailer(to, subject, html);
};

module.exports = { emailSend, sendOtp };
