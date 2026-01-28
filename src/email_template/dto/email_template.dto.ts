import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationVariableDto {
  @ApiProperty({
    example: 'Click here to verify your email',
    description: 'The text to be displayed for the notification',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    example: 'https://example.com/verify',
    description: 'The link associated with the notification',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiProperty({
    example: ['admin', 'customer', 'business'],
    description: 'Array of variable names used in the template',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  name?: string[];
}

export class CreateMailTemplateDto {
  @ApiProperty({
    example: '',
    description: 'The template identifier',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiPropertyOptional({
    example: ['admin', 'customer', 'business'],
    description: 'Array of recipient roles',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recipient_roles?: string[];

  @ApiProperty({
    example: [
      {
        text: 'Verify Email',
        link: 'https://example.com/verify',
        name: ['userName', 'verificationLink'],
      },
    ],
    description: 'Notification variables with text, link and variable names',
    type: [NotificationVariableDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NotificationVariableDto)
  notification_variable?: NotificationVariableDto[];

  @ApiProperty({
    example: 'Email Verification',
    description: 'Name of the notification',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  notification_name: string;
}

export class UpdateMailTemplateDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID of the template to update',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    example: '',
    description: 'The template identifier',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({
    example: ['admin', 'customer', 'business'],
    description: 'Array of recipient roles',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recipient_roles?: string[];

  @ApiPropertyOptional({
    example: [
      {
        text: 'Verify Your Email',
        link: 'https://example.com/verify-email',
        name: ['userName', 'verificationUrl'],
      },
    ],
    description: 'Notification variables with text, link and variable names',
    type: [NotificationVariableDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationVariableDto)
  @IsOptional()
  notification_variable?: NotificationVariableDto[];

  @ApiPropertyOptional({
    example: 'Email Verification Updated',
    description: 'Name of the notification',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notification_name?: string;
}
