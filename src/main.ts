import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { format, transports } from 'winston';
import { WinstonModule } from 'nest-winston';
import * as express from 'express';
import { AllExceptionFilter } from './libs/helper/exception-filter/exceptionFilter';
import { Messages } from './libs/utils/constant/messages';
import { resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.File({
          filename: `logs/error.log`,
          level: 'error',
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.File({
          filename: `logs/combined.log`,
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.Console({
          format: format.combine(
            format.cli(),
            format.splat(),
            format.timestamp(),
            format.printf((info) => {
              return `${String(info.timestamp)} ${String(info.level)}: ${String(info.message)}`;
            }),
          ),
        }),
      ],
    }),
  });

  app.enableCors();
  const adapter = app.get(HttpAdapterHost).httpAdapter;
  app.useGlobalFilters(new AllExceptionFilter(adapter));
  app.useGlobalPipes(new ValidationPipe());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle('Market Place')
    .setDescription('Market Place API documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  app.use('/uploads', express.static(resolve('public', 'uploads')));

  const port = process.env.PORT || 5000;
  await app.listen(port);
  Logger.log(`${Messages.SERVER_CONNECTION} http://localhost:${port} `);
}
void bootstrap();
