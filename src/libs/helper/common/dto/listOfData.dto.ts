import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import {
  OfferStatus,
  ProjectFilterStatus,
  ProjectStatus,
  Type,
} from 'src/libs/utils/constant/enum';

export class ListOfDataDto {
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
    example: Type.DETAILS,
    enum: Type,
    required: false,
  })
  @IsEnum(Type)
  @IsOptional()
  type: Type;

  @ApiProperty({
    example: OfferStatus.PENDING,
    enum: OfferStatus,
    required: false,
  })
  @IsEnum(OfferStatus)
  @IsOptional()
  status: OfferStatus;
}

export class ListOfProjectDataDto {
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
    example: Type.DETAILS,
    enum: Type,
    required: false,
  })
  @IsEnum(Type)
  @IsOptional()
  type: Type;

  @ApiProperty({
    example: ProjectStatus.PUBLISHED,
    enum: ProjectStatus,
    required: false,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status: ProjectStatus;
}

export class ListOfBusinessProjectDto {
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
    example: Type.DETAILS,
    enum: Type,
    required: false,
  })
  @IsEnum(Type)
  @IsOptional()
  type: Type;

  @ApiProperty({
    example: ProjectFilterStatus.APPLIED,
    enum: ProjectFilterStatus,
    required: false,
  })
  @IsEnum(ProjectFilterStatus)
  @IsOptional()
  status: ProjectFilterStatus;

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc', '694a29715a0e5498a400edbb'],
    type: [String],
    required: false,
    description: 'Selected county ids',
  })
  @IsArray()
  @IsOptional()
  county: string[];

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc', '694a29715a0e5498a400edbb'],
    type: [String],
    required: false,
    description: 'Selected county ids',
  })
  @IsArray()
  @IsOptional()
  municipality: string[];

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc', '694a29715a0e5498a400edbb'],
    type: [String],
    required: false,
    description: 'Selected category ids',
  })
  @IsArray()
  @IsOptional()
  category: string[];

  @ApiProperty({
    example: ['694a29715a0e5498a400edbc', '694a29715a0e5498a400edbb'],
    type: [String],
    required: false,
    description: 'Selected type of work ids',
  })
  @IsArray()
  @IsOptional()
  typeOfWork: string[];
}
