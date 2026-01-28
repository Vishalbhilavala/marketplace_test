import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiTag, Role } from 'src/libs/utils/constant/enum';
import { CategoryService } from './category.service';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import {
  AddCategoryDto,
  AddTypeOfWorkDto,
  CreateProfessionDto,
  UpdateCategoryDto,
  UpdateProfessionDto,
  UpdateTypeOfWorkDto,
} from './dto/category.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@ApiTags(ApiTag.CATEGORY)
@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Profession',
    description: 'This API is used for Add Profession',
  })
  @Post('category/addProfession')
  async addProfession(@Body() dto: CreateProfessionDto) {
    return await this.categoryService.addProfession(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Profession by ID',
    description: 'This API is used for viewing Profession by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('category/viewProfession/:id')
  async viewProfession(@Param('id') professionId: string) {
    return await this.categoryService.viewProfession(professionId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Professions',
    description: 'This API is used for getting list of Professions',
  })
  @Post('category/listOfProfessions')
  async listOfProfessions(@Body() dto: ListOfDataDto) {
    return await this.categoryService.listOfProfessions(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Profession by ID',
    description: 'This API is used for updating Profession by ID',
  })
  @Put('category/updateProfession')
  async updateProfession(@Body() dto: UpdateProfessionDto) {
    return await this.categoryService.updateProfession(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Profession by ID',
    description: 'This API is used for deleting Profession by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Delete('category/deleteProfession/:id')
  async deleteProfession(@Param('id') professionId: string) {
    return await this.categoryService.deleteProfession(professionId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Category',
    description: 'This API is used for Add Category',
  })
  @Post('category/addCategory')
  async addCategory(@Body() dto: AddCategoryDto) {
    return await this.categoryService.addCategory(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Category with parent profession',
    description:
      'This API is used for viewing Category with it parent profession',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'professionId',
    required: true,
  })
  @ApiParam({
    example: '6928359bae59c24b75504f23',
    name: 'categoryId',
    required: true,
  })
  @Get('category/viewCategory/:professionId/:categoryId')
  async viewCategory(
    @Param('professionId') professionId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return await this.categoryService.viewCategory(professionId, categoryId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Categories',
    description: 'This API is used for getting list of Categories',
  })
  @Post('category/listOfCategory')
  async listOfCategory(@Body() dto: ListOfDataDto) {
    return await this.categoryService.listOfCategory(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Category',
    description: 'This API is used for updating category',
  })
  @Put('category/updateCategory')
  async updateCategory(@Body() dto: UpdateCategoryDto) {
    return await this.categoryService.updateCategory(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Category',
    description: 'This API is used for deleting Category by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'professionId',
    required: true,
  })
  @ApiParam({
    example: '6928359bae59c24b75504f23',
    name: 'categoryId',
    required: true,
  })
  @Delete('category/deleteCategory/:professionId/:categoryId')
  async deleteCategory(
    @Param('professionId') professionId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return await this.categoryService.deleteCategory(professionId, categoryId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Type Of Work',
    description: 'This API is used for Add Type Of Work in selected category',
  })
  @Post('category/addTypeOfWork')
  async addTypeOfWork(@Body() dto: AddTypeOfWorkDto) {
    return await this.categoryService.addTypeOfWork(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Type Of Work',
    description: 'This API is used for updating type of work data',
  })
  @Put('category/updateTypeOfWork')
  async updateTypeOfWork(@Body() dto: UpdateTypeOfWorkDto) {
    return await this.categoryService.updateTypeOfWork(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Type Of Work',
    description: 'This API is used for deleting type of work',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f23',
    name: 'categoryId',
    required: true,
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'typeOfWorkId',
    required: true,
  })
  @Delete('category/deleteTypeOfWork/:categoryId/:typeOfWorkId')
  async deleteTypeOfWork(
    @Param('categoryId') categoryId: string,
    @Param('typeOfWorkId') typeOfWorkId: string,
  ) {
    return await this.categoryService.deleteTypeOfWork(
      categoryId,
      typeOfWorkId,
    );
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of category template',
    description: 'This API is used for getting list of template for category',
  })
  @Post('category/listOfTemplate')
  async listOfTemplate(@Body() dto: ListOfDataDto) {
    return await this.categoryService.listOfTemplate(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Template by ID',
    description: 'This API is used for viewing Template by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('category/viewTemplate/:id')
  async viewTemplate(@Param('id') templateId: string) {
    return await this.categoryService.viewTemplate(templateId);
  }
}
