import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class SectionWithTitleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class SectionWithHtmlDto {
  @IsOptional()
  @IsString()
  html?: string;
}
export class AddCategoryDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  professionId: string;

  @ApiProperty({
    example: '6928359bae48c24b75504f26',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  categoryTypeId: string;

  @ApiProperty({
    example: 'Plumber',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Plumber.jpg',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  category_image: string;

  @ApiProperty({
    example: 'Plumber.jpg',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  category_icon: string;

  @ApiProperty({
    example: 'plumber service',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  meta_title?: string;

  @ApiProperty({
    example: 'this is plumber service',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_description?: string;

  @ApiProperty({
    example: ['Plumber', 'plumber', 'plumber service'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meta_keywords?: string[];

  @ApiProperty({
    required: false,
    type: SectionWithTitleDto,
    example: {
      title: 'About Plumber',
      description: 'Professional plumbing services',
      location_description: 'This is for add Location description',
    },
  })
  @IsOptional()
  section1?: SectionWithTitleDto;

  @ApiProperty({
    required: false,
    type: SectionWithHtmlDto,
    example: {
      html: '<p>Plumbing installation & repair services</p>',
    },
  })
  @IsOptional()
  section2?: SectionWithHtmlDto;

  @ApiProperty({
    required: false,
    type: SectionWithHtmlDto,
    example: {
      html: '<ul><li>Emergency service</li><li>24x7 support</li></ul>',
    },
  })
  @IsOptional()
  section3?: SectionWithHtmlDto;

  @ApiProperty({
    required: false,
    type: SectionWithTitleDto,
    example: {
      title: 'Why choose us',
      description: 'Trusted experts with years of experience',
    },
  })
  @IsOptional()
  section4?: SectionWithTitleDto;

  @ApiProperty({
    required: false,
    type: SectionWithHtmlDto,
    example: {
      html: '<p>Contact us today for fast service</p>',
    },
  })
  @IsOptional()
  section5?: SectionWithHtmlDto;
}

export class CreateProfessionDto {
  @ApiProperty({
    example: 'Home Service',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  profession_name: string;

  @ApiProperty({
    example: 'This profession contains home related services',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProfessionDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  professionId: string;

  @ApiProperty({
    example: 'Home Service',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  profession_name: string;

  @ApiProperty({
    example: 'This profession contains home related services',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  professionId: string;

  @ApiProperty({
    example: '6928359bae59c24b75504f35',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: '6928359bae59c24b75504f24',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryTypeId?: string;

  @ApiProperty({
    example: 'plumber',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'plumber.jpg',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  category_image?: string;

  @ApiProperty({
    example: 'plumber-icon.jpg',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  category_icon?: string;

  @ApiProperty({
    example: 'plumber service',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_title?: string;

  @ApiProperty({
    example: 'This category contains home related services',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  meta_description?: string;

  @ApiProperty({
    example: ['Plumber', 'plumber', 'plumber service'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meta_keywords?: string[];

  @ApiProperty({
    required: false,
    type: SectionWithTitleDto,
    example: {
      title: 'About Plumber',
      description: 'Professional plumbing services',
      location_description: 'This is for add Location description',
    },
  })
  @IsOptional()
  section1?: SectionWithTitleDto;

  @ApiProperty({
    required: false,
    type: SectionWithHtmlDto,
    example: {
      html: '<p>Plumbing installation & repair services</p>',
    },
  })
  @IsOptional()
  section2?: SectionWithHtmlDto;

  @ApiProperty({
    required: false,
    type: SectionWithHtmlDto,
    example: {
      html: '<ul><li>Emergency service</li><li>24x7 support</li></ul>',
    },
  })
  @IsOptional()
  section3?: SectionWithHtmlDto;

  @ApiProperty({
    required: false,
    type: SectionWithTitleDto,
    example: {
      title: 'Why choose us',
      description: 'Trusted experts with years of experience',
    },
  })
  @IsOptional()
  section4?: SectionWithTitleDto;

  @ApiProperty({
    required: false,
    type: SectionWithHtmlDto,
    example: {
      html: '<p>Contact us today for fast service</p>',
    },
  })
  @IsOptional()
  section5?: SectionWithHtmlDto;
}

export class AddTypeOfWorkDto {
  @ApiProperty({
    example: '6928359bae48c24b75504f26',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: 'Wall Paint',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateTypeOfWorkDto {
  @ApiProperty({
    example: '6928359bae48c24b75504f26',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: '6928359bae48c24c75503f47',
    type: 'string',
    format: 'string',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  typeOfWorkId: string;

  @ApiProperty({
    example: 'Interior Wall Paint',
    type: 'string',
    format: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  name: string;
}
