import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'src/libs/utils/constant/enum';

class DetailsDto {
  @ApiProperty({
    example: 'Details title',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  detail_title?: string;

  @ApiProperty({
    example: 'details description',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  detail_description?: string;

  @ApiProperty({
    example: 'detail sub description',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  detail_sub_description?: string;
}

export class AddHomePageDto {
  @ApiProperty({
    example: Type.DETAILS,
    enum: Type,
    required: true,
  })
  @IsEnum(Type)
  @IsNotEmpty()
  type: Type;

  @ApiProperty({
    example: 'Description Title',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'abc.jpg',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty({
    example: 'Description Title',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  get_started_title: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  get_started_description: string;

  @ApiProperty({
    example: 'abc.jpg',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  get_started_image: string;

  @ApiProperty({
    type: [DetailsDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  details: DetailsDto[];
}

export class UpdateHomePageDto {
  @ApiProperty({
    example: '67cedbb39192136fb05515b6',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  homePageId: string;

  @ApiProperty({
    example: Type.DETAILS,
    enum: Type,
    required: true,
  })
  @IsEnum(Type)
  @IsNotEmpty()
  type: Type;

  @ApiProperty({
    example: 'Description Title',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'abc.jpg',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty({
    example: 'Description Title',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  get_started_title: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  get_started_description: string;

  @ApiProperty({
    example: 'abc.jpg',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  get_started_image: string;

  @ApiProperty({
    type: [DetailsDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  details: DetailsDto[];
}
