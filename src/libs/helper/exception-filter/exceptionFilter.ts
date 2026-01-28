import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { ResponseData } from 'src/libs/utils/constant/enum';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapter: HttpAdapterHost['httpAdapter']) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    ctx.getRequest();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
    }

    if (isRecord(exception)) {
      const maybeStatus = exception['statusCode'];
      if (typeof maybeStatus === 'number') {
        httpStatus = maybeStatus;
      }
    }

    let exMessage: string | string[] | undefined = undefined;

    if (exception instanceof HttpException) {
      const raw = exception.getResponse();
      if (typeof raw === 'string') {
        exMessage = raw;
      } else if (isRecord(raw)) {
        if (typeof raw.message === 'string' || Array.isArray(raw.message)) {
          exMessage = raw.message;
        }
      }
    } else if (isRecord(exception)) {
      const message = exception['message'];
      if (typeof message === 'string' || Array.isArray(message)) {
        exMessage = message;
      }
    }

    if (!exMessage) {
      exMessage = 'Error';
    }

    const responseBody = {
      statusCode: httpStatus,
      status: ResponseData.ERROR,
      message: exMessage,
    };

    this.httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
