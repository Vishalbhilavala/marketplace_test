import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BusinessClipHistory } from 'src/libs/utils/constant/enum';

export class AddClipDto {
  @ApiProperty({
    example: 'Monthly subscription clip',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  package_name: string;

  @ApiProperty({
    example: 'This subscription is to purchase monthly clip for project',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  package_description: string;

  @ApiProperty({
    example: 10,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  total_clips: number;

  @ApiProperty({
    example: 100,
    type: 'number',
    format: 'number',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    example: '1 month',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  validity_days?: string;

  @ApiProperty({
    example: 100,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  monthly_duration: number;
}

export class EditClipDto {
  @ApiProperty({
    example: '67cedbb39192136fb05515b6',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @ApiProperty({
    example: 'Yearly subscription clip',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  package_name?: string;

  @ApiProperty({
    example: 'This subscription is to purchase yearly clip for project',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  package_description: string;

  @ApiProperty({
    example: 20,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  total_clips: number;

  @ApiProperty({
    example: 100,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty({
    example: '1 year',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  validity_days: string;

  @ApiProperty({
    example: 200,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  monthly_duration: number;
}

export class ListOfClipUsageDto {
  @ApiProperty({
    example: '_id',
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortKey: string;

  @ApiProperty({
    example: 'desc',
    type: 'string',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortValue: string;

  @ApiProperty({
    example: 1,
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  page: number;

  @ApiProperty({
    example: 10,
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit: number;

  @ApiProperty({
    example: '',
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    example: BusinessClipHistory.APPLIED,
    enum: BusinessClipHistory,
    required: false,
  })
  @IsEnum(BusinessClipHistory)
  @IsOptional()
  usageType: BusinessClipHistory;
}
