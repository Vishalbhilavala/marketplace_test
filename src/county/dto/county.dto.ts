import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VillageDto {
  @ApiProperty({
    example: 'Abelvær',
    type: 'string',
    description: 'Name of the village',
    required: false,
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    example: '7950',
    type: 'string',
    description: 'Postal code of the village',
    required: false,
  })
  @IsString()
  @IsOptional()
  postal_code?: string;
}

export class AddMunicipalityDto {
  @ApiProperty({
    example: 'Nærøysund',
    type: 'string',
    description: 'Name of the municipality',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: [VillageDto],
    description: 'List of villages in this municipality',
    required: false,
  })
  @IsArray()
  @Type(() => VillageDto)
  @IsOptional()
  villages?: VillageDto[];
}

export class CountyDto {
  @ApiProperty({
    example: 'Demo',
    type: 'string',
    description: 'Name of the county',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: [AddMunicipalityDto],
    description: 'List of municipalities in this county',
    required: false,
  })
  @IsArray()
  @Type(() => AddMunicipalityDto)
  @IsOptional()
  municipalities?: AddMunicipalityDto[];
}

export class EditMunicipalityDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: 'Nærøysund',
    required: false,
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    type: [VillageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => VillageDto)
  villages?: VillageDto[];
}

export class DeleteMunicipalityDto {
  @ApiProperty({
    example: '694a29715a0e5498a400edbc',
    description: 'Municipality ID',
  })
  @IsNotEmpty()
  @IsString()
  municipality_id: string;

  @ApiProperty({
    example: ['695b29715a0e5498a400edaa'],
    description: 'Village IDs under this municipality',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  village_ids?: string[];
}

export class EditCountyDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: 'Demo',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: [EditMunicipalityDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => EditMunicipalityDto)
  municipalities?: EditMunicipalityDto[];

  @ApiProperty({
    type: [DeleteMunicipalityDto],
    required: false,
    description: 'Municipalities with their corresponding villages to delete',
  })
  @IsOptional()
  @IsArray()
  @Type(() => DeleteMunicipalityDto)
  deleted_municipalities?: DeleteMunicipalityDto[];
}
