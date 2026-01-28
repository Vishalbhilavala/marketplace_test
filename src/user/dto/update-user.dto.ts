import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/libs/utils/constant/enum';

class UserNotificationDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  offer?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  message?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  completed_project?: boolean;
}

class PostalAddressDto {
  @ApiProperty({
    example: 'Street 12',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiProperty({
    example: 'Oslo',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  postPlace?: string;

  @ApiProperty({
    example: '0560',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

class AddressDto {
  @ApiProperty({
    required: false,
    type: PostalAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostalAddressDto)
  postalAddress?: PostalAddressDto;
}

class CoordinateDto {
  @ApiProperty({
    example: 59.9127,
    type: 'number',
    format: 'float',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  XCoordinate?: number;

  @ApiProperty({
    example: 10.7461,
    type: 'number',
    format: 'float',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  YCoordinate?: number;
}

export class UpdateUserDto {
  @ApiProperty({
    example: '67cedbb39192136fb05515b6',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'John',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({
    example: 'john@gmail.com',
    type: 'string',
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '9876543210',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    type: 'string',
    format: 'uri',
    required: false,
  })
  @IsOptional()
  @IsString()
  profile_image?: string | null;

  @ApiProperty({
    example: 'https://example.com/banner.jpg',
    type: 'string',
    format: 'uri',
    required: false,
  })
  @IsOptional()
  @IsString()
  banner_image?: string | null;

  @ApiProperty({
    example: 'John Builders Pvt Ltd',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_name?: string | null;

  @ApiProperty({
    example: 'This is a sample business description.',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc'],
    type: [String],
    required: false,
    description: 'Selected county ids',
  })
  @IsArray()
  @IsOptional()
  @Type(() => String)
  county: string[];

  @ApiProperty({
    example: ['694a2d0292436f5454f79bac'],
    type: [String],
    required: false,
    description: 'Selected category ids',
  })
  @IsArray()
  @IsOptional()
  @Type(() => String)
  category: string[];

  @ApiProperty({
    type: AddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto | null;

  @ApiProperty({
    example: '560012',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  postal_code: string;

  @ApiProperty({
    type: [CoordinateDto],
    required: false,
    example: [{ XCoordinate: 59.91, YCoordinate: 10.75 }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoordinateDto)
  coordinates?: CoordinateDto[] | null;

  @ApiProperty({
    example: '987654321',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  org_no?: string | null;

  @ApiProperty({
    example: true,
    type: 'boolean',
    format: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  terms_condition?: boolean;

  @ApiProperty({
    type: UserNotificationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserNotificationDto)
  user_notifications?: UserNotificationDto;
}

export class TypeDto {
  @ApiProperty({
    example: Role.CUSTOMER,
    enum: Role,
    required: true,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  type: Role;
}

export class UpdateCustomerDto {
  @ApiProperty({
    example: '67cedbb39192136fb05515b6',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'John',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({
    example: 'john@gmail.com',
    type: 'string',
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '9876543210',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    type: 'string',
    format: 'uri',
    required: false,
  })
  @IsOptional()
  @IsString()
  profile_image?: string | null;

  @ApiProperty({
    example: 'https://example.com/banner.jpg',
    type: 'string',
    format: 'uri',
    required: false,
  })
  @IsOptional()
  @IsString()
  banner_image?: string | null;

  @ApiProperty({
    example: '560012',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  postal_code: string;

  @ApiProperty({
    type: AddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto | null;

  @ApiProperty({
    example: true,
    type: 'boolean',
    format: 'boolean',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
