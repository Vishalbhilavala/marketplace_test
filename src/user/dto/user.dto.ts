import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Match } from 'src/libs/service/auth/decorators/match.decorator';
import { Role } from 'src/libs/utils/constant/enum';
import { Messages } from 'src/libs/utils/constant/messages';

export class CustomerFieldsDto {
  @ApiProperty({ example: 'John Doe', required: true })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({ example: 'john@gmail.com', required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Admin@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must be 8+ characters, including an uppercase letter, lowercase letter, number, and special character.',
  })
  password: string;

  @ApiProperty({
    example: 'Admin@123',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Match('password', {
    message: Messages.PASSWORD_DOES_NOT_MATCH,
  })
  confirmPassword?: string;
}

export class BusinessFieldsDto {
  @ApiProperty({
    example: 'GOJOR',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_name: string;

  @ApiProperty({
    example: 'John Doe',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({
    example: 'youremail@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456789',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc', '694a29715a0e5498a400edbb'],
    type: [String],
    required: false,
    description: 'Selected county ids',
  })
  @IsArray()
  @IsOptional()
  @Type(() => String)
  county: string[];

  @ApiProperty({ example: '123456789', required: true })
  @IsNotEmpty()
  @IsString()
  org_no: string;

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc', '694a29715a0e5498a400edbb'],
    type: [String],
    required: false,
    description: 'Selected category ids',
  })
  @IsArray()
  @IsOptional()
  @Type(() => String)
  category: string[];

  @ApiProperty({
    example: true,
    type: 'boolean',
    format: 'boolean',
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  terms_condition: boolean;
}

export class RegisterDto {
  @ApiProperty({
    example: Role.CUSTOMER,
    enum: [Role.CUSTOMER, Role.BUSINESS],
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ type: () => CustomerFieldsDto })
  @ValidateIf((o) => o.role === Role.CUSTOMER)
  @ValidateNested()
  @Type(() => CustomerFieldsDto)
  customerFields?: CustomerFieldsDto;

  @ApiPropertyOptional({ type: () => BusinessFieldsDto })
  @ValidateIf((o) => o.role === Role.BUSINESS)
  @ValidateNested()
  @Type(() => BusinessFieldsDto)
  businessFields?: BusinessFieldsDto;
}

export class LoginDto {
  @ApiProperty({
    example: 'admin@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Admin@123',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must be 8+ characters, including an uppercase letter, lowercase letter, number, and special character.',
  })
  newPassword: string;

  @ApiProperty({
    example: 'Admin@123',
    required: true,
  })
  @ValidateIf(
    (o) =>
      o.newPassword !== undefined &&
      o.newPassword !== null &&
      o.newPassword !== '',
  )
  @IsNotEmpty()
  @IsString()
  @Match('newPassword', {
    message: Messages.PASSWORD_DOES_NOT_MATCH,
  })
  confirmPassword?: string;
}

export class ValidateBusinessDto {
  @ApiProperty({
    example: 'admin@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456789',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  org_no: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'test@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 123456,
    type: 'number',
    format: 'number',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  otp: number;

  @ApiProperty({
    example: 'example@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'example@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must be 8+ characters, including an uppercase letter, lowercase letter, number, and special character.',
  })
  newPassword: string;

  @ApiProperty({
    example: 'example@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @Match('newPassword', {
    message: Messages.PASSWORD_DOES_NOT_MATCH,
  })
  @IsString()
  confirmPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Admin@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must be 8+ characters, including an uppercase letter, lowercase letter, number, and special character.',
  })
  newPassword: string;

  @ApiProperty({
    example: 'Admin@123',
    required: true,
  })
  @ValidateIf(
    (o) =>
      o.newPassword !== undefined &&
      o.newPassword !== null &&
      o.newPassword !== '',
  )
  @IsNotEmpty()
  @IsString()
  @Match('newPassword', {
    message: Messages.PASSWORD_DOES_NOT_MATCH,
  })
  confirmPassword?: string;

  @ApiProperty({
    example: 'Admin@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;
}
export class CreatePasswordDto {
  @ApiProperty({
    example: 'Admin@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message:
      'Password must be 8+ characters, including an uppercase letter, lowercase letter, number, and special character.',
  })
  newPassword: string;

  @ApiProperty({
    example: 'Admin@123',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Match('newPassword', {
    message: Messages.PASSWORD_DOES_NOT_MATCH,
  })
  confirmPassword: string;
}

export class CreateCustomerDto {
  @ApiProperty({
    example: 'John',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({
    example: 'youremail@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '1234567890',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  phone_number: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: 'youremail@gmail.com',
    type: 'string',
    format: 'email',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 123456,
    type: 'number',
    format: 'number',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  otp: number;
}
