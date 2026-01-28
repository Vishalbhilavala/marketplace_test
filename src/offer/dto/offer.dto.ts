import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OfferStatus } from 'src/libs/utils/constant/enum';

export class ApplyProjectDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({
    example: '6928359bae59c24b75532c44',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  project_id: string;

  @ApiProperty({
    example:
      'Hey, i am jane and my company provide this service in 2000nok which is realy to cheap',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: '2 week',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  estimated_duration: string;

  @ApiProperty({
    example: 2000,
    type: 'number',
    format: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  amount: string;
}

export class AcceptOfferDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  offer_id: string;

  @ApiProperty({
    example: OfferStatus.ASSIGNED,
    enum: OfferStatus,
    required: false,
  })
  @IsEnum(OfferStatus)
  @IsOptional()
  status: OfferStatus;
}
