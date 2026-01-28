import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class ListOfMunicipalityDto {
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
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  countyId: string;
}
