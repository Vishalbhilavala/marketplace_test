import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({
    example: 'Who we are?',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  answer: string;
}

export class UpdateFaqDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  faqId: string;

  @ApiProperty({
    example: 'Why we create this product?',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  answer?: string;
}
