import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BusinessPaymentStatus,
  BusinessStatus,
} from 'src/libs/utils/constant/enum';

export class UpdatePaymentDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_id: string;

  @ApiProperty({
    example: 100,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    example: '1 month',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  validity_days: string;

  @ApiProperty({
    example: 40,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  total_clips: number;
}

export class UpdateBusinessStatusDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_id: string;

  @ApiProperty({
    example: BusinessStatus.REJECTED,
    type: 'string',
    format: 'string',
    enum: [BusinessStatus.REJECTED],
    required: false,
  })
  @IsOptional()
  @IsString()
  status: BusinessStatus;

  @ApiProperty({
    example: 'Your business application has been rejected due to ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_id: string;

  @ApiProperty({
    example: BusinessPaymentStatus.RECEIVED,
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  payment_status: string;
}

export class AddRenewalPlanDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_id: string;

  @ApiProperty({
    example: '6928359bae59c24b75504l70',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  subscription_id: string;

  @ApiProperty({
    example: '2 month',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  validity_days: string;

  @ApiProperty({
    example: 10,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  monthly_duration: number;

  @ApiProperty({
    example: 300,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price: number;
}

export class AddRefillPlanDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_id: string;

  @ApiProperty({
    example: 20,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  clip: number;

  @ApiProperty({
    example: 300,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price: number;

  @ApiProperty({
    example: '2024-01-20',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiry_date?: Date;
}

export class AssignBusinessPlanDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  business_id: string;

  @ApiProperty({
    example: '6928359bae59c24b75504l70',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  subscription_id: string;

  @ApiProperty({
    example: '2 month',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  validity_days: string;

  @ApiProperty({
    example: 10,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  monthly_duration: number;

  @ApiProperty({
    example: 300,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price: number;
}
