import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  ProjectStatus,
  Role,
  TemplateFieldType,
  TemplateValidation,
} from 'src/libs/utils/constant/enum';

class ProjectCategoryDto {
  @ApiProperty({
    example: '69494c90b4205d019eb1669d',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: '69494c90b4205d019eb1669d',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  typeOfWorkId: string;

  customer_id?: string;
}

class ProjectDetailDto {
  @ApiProperty({
    example: 'How often do you want cleaning?',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  labelName: string;

  @ApiProperty({
    example: 'Weekly',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  fieldValue: string;

  @ApiProperty({
    example: TemplateFieldType.RADIO,
    enum: TemplateFieldType,
    required: false,
  })
  @IsEnum(TemplateFieldType)
  fieldType: string;

  @ApiProperty({
    example: TemplateValidation.YES,
    enum: TemplateValidation,
    required: false,
  })
  @IsOptional()
  @IsEnum(TemplateValidation)
  isRequired: string;

  @ApiProperty({
    example: TemplateValidation.NO,
    enum: TemplateValidation,
    required: false,
  })
  @IsOptional()
  @IsEnum(TemplateValidation)
  readOnly: string;

  @ApiProperty({
    example: '',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  variableOptions: string;
}

export class CreateProjectDto {
  @ApiProperty({
    example: 'John Doy',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  full_name: string;

  @ApiProperty({
    example: 'john@gmail.com',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '9876543210',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_number: string;

  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  customer_id: string;

  @ApiProperty({
    example: ProjectStatus.PUBLISHED,
    enum: ProjectStatus,
    required: false,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status: ProjectStatus;

  @ApiProperty({
    example: Role.ADMIN,
    enum: Role,
    required: true,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  source: Role;

  @ApiProperty({
    type: ProjectCategoryDto,
    required: true,
    description: 'Project category information',
  })
  @IsNotEmpty()
  category: ProjectCategoryDto;

  @ApiProperty({
    example: 'Project category title',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'We need an experienced person ...',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'Name, Karl Johans gate 1, 0159 Oslo, NORWAY',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    example: '560012',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @ApiProperty({
    example: ['project.png'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  project_image?: string[];

  @ApiProperty({
    example: 'Project Meta Title',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_title: string;

  @ApiProperty({
    example: 'Project Meta Description',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_description: string;

  @ApiProperty({
    example: ['project keyword'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meta_keyword: string[];

  @ApiProperty({
    type: [ProjectDetailDto],
    required: false,
    description: 'Dynamic project form fields',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDetailDto)
  project_details: ProjectDetailDto[];
}

export class UpdateProjectDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  project_id: string;

  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiProperty({
    type: ProjectCategoryDto,
    required: false,
    description: 'Project category information',
  })
  @IsOptional()
  category?: ProjectCategoryDto;

  @ApiProperty({
    title: 'Project category title',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

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
    example: ['project.png'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  project_image?: string[];

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_title?: string;

  @ApiProperty({
    example: 'We are a company that ...',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_description?: string;

  @ApiProperty({
    example: ['project keyword'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meta_keyword?: string[];
}

export class UpdateProjectStatusDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  project_id: string;

  @ApiProperty({
    example: 'published',
    enum: ProjectStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
