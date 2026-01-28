import { HttpStatus, Logger } from '@nestjs/common';
import { HandleResponse } from 'src/libs/helper/handleResponse';
import { ResponseData } from './enum';
import { Model, Types } from 'mongoose';
import { MailTemplateDocument } from 'src/schema/email-template.schema';
import { Messages, MessagesKey } from './messages';
import { UserDocument } from 'src/schema/user.schema';

export function notFoundErrorHandler(data: unknown, message: string) {
  if (!data) {
    Logger.error(message);
    return HandleResponse(HttpStatus.NOT_FOUND, ResponseData.ERROR, message);
  }
}

export async function checkUserStatus(
  userModel: Model<UserDocument>,
  value: string,
) {
  let query: Record<string, unknown> = {};

  if (Types.ObjectId.isValid(value)) {
    query = { _id: value };
  } else {
    query = { email: value };
  }

  const user = await userModel
    .findOne(query)
    .select('-__v -createdAt -updatedAt');

  if (!user) {
    Logger.log(`User ${Messages.NOT_EXIST}`);
    return HandleResponse(
      HttpStatus.NOT_FOUND,
      ResponseData.ERROR,
      MessagesKey.USER_NOT_EXIST,
      `User ${Messages.NOT_EXIST}`,
    );
  }

  if (user.is_active === false) {
    Logger.log(Messages.INACTIVE_ACCOUNT);
    return HandleResponse(
      HttpStatus.FORBIDDEN,
      ResponseData.ERROR,
      MessagesKey.INACTIVE_ACCOUNT,
      Messages.INACTIVE_ACCOUNT,
    );
  }

  return user;
}

export async function getTemplate(
  mailTemplateModel: Model<MailTemplateDocument>,
  notificationName: string,
) {
  try {
    const templateDoc = await mailTemplateModel.findOne({
      notification_name: notificationName,
    });
    return templateDoc ?? null;
  } catch (error) {
    Logger.error(`Error while fetching template: ${notificationName}`, error);
    return null;
  }
}

export function toReadableCase(value: string): string {
  if (!value) return value;

  const spaced = value.replaceAll(/[_-]/g, ' ');

  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function generatePassword(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}

export function calculateExpiryDate(validityPeriod: string): Date {
  const now = new Date();
  const [value, unit] = validityPeriod.split(' ');
  const numValue = Number.parseInt(value, 10);

  const expiryDate = new Date(now);

  switch (unit.toLowerCase()) {
    case 'month':
    case 'months':
    case 'måneder':
    case 'måned':
      expiryDate.setMonth(now.getMonth() + numValue);
      break;
    case 'day':
    case 'days':
    case 'dag':
    case 'dager':
      expiryDate.setDate(now.getDate() + numValue);
      break;
    case 'year':
    case 'years':
    case 'år':
      expiryDate.setFullYear(now.getFullYear() + numValue);
      break;
    default:
      // Default to days if unit is not recognized
      expiryDate.setDate(now.getDate() + numValue);
  }

  return expiryDate;
}

interface MonthHistoryItem {
  start_date: string;
  expiry_date: string;
  clip: number;
}

export function generateMonthHistory(
  startDate: Date,
  endDate: Date,
  months: number,
  clipPerMonth: number,
): MonthHistoryItem[] {
  const monthHistory: MonthHistoryItem[] = [];

  let currentStart = new Date(startDate);

  for (let i = 0; i < months; i++) {
    // Create next month end date
    let nextExpiry = new Date(currentStart);
    nextExpiry.setMonth(nextExpiry.getMonth() + 1);

    // Ensure final month does NOT exceed plan expiry date
    if (nextExpiry > endDate) {
      nextExpiry = new Date(endDate);
    }

    monthHistory.push({
      start_date: currentStart.toISOString(),
      expiry_date: nextExpiry.toISOString(),
      clip: clipPerMonth,
    });

    // Move to next month start
    currentStart = new Date(nextExpiry);

    // Stop if we've reached expiry
    if (currentStart >= endDate) break;
  }

  return monthHistory;
}

export function getNextIdNumber(lastId: string | null): string {
  const PREFIX = 'P';
  const PAD_LENGTH = 8;

  if (!lastId) {
    return `${PREFIX}${'1'.padStart(PAD_LENGTH, '0')}`;
  }

  const numericPart = Number.parseInt(lastId.replace(/^P/, ''), 10);

  const nextNumber = Number.isNaN(numericPart) ? 1 : numericPart + 1;

  return `${PREFIX}${nextNumber.toString().padStart(PAD_LENGTH, '0')}`;
}

export function buildExactRegex(value: string): RegExp {
  const normalized = value.trim();

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`^${escaped}$`, 'i');
}
