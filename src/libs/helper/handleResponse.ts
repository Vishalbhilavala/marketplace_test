import { HttpStatus } from '@nestjs/common';
import { ResponseData } from '../utils/constant/enum';
import { HandleResponseOptions } from '../utils/constant/interface';

export function HandleResponse<T = unknown>(
  statusCode: number,
  status: ResponseData,
  messageKey?: string,
  message?: string,
  data?: T,
  error?: unknown,
): HandleResponseOptions<T> {
  return {
    statusCode: statusCode || HttpStatus.OK,
    status,
    messageKey: messageKey || undefined,
    message: message || undefined,
    data: data || undefined,
    error: error || undefined,
  };
}
