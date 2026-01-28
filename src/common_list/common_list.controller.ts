import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommonListService } from './common_list.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ApiTag } from 'src/libs/utils/constant/enum';
import { ListOfMunicipalityDto } from './dto/commonList.dto';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';

@ApiTags(ApiTag.COMMON_MODULE)
@Controller()
export class CommonListController {
  constructor(private readonly commonListService: CommonListService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of county',
    description: 'This API is used for getting list of county',
  })
  @Post('listOfCounty')
  async listOfContactUs(@Body() dto: ListOfDataDto) {
    return await this.commonListService.listOfCounty(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of municipalities',
    description:
      'This API is used for getting list of municipalities, optionally filtered by county',
  })
  @Post('listOfMunicipality')
  async listOfMunicipality(@Body() dto: ListOfMunicipalityDto) {
    return await this.commonListService.listOfMunicipality(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search village by postal code',
    description: 'This API is used for searching villages by postal code',
  })
  @ApiParam({
    example: '0154',
    name: 'postal_code',
    required: true,
  })
  @Post('getLocation/:postal_code')
  async searchVillage(@Param('postal_code') postalCode: string) {
    return await this.commonListService.searchVillage(postalCode);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of subscription duration',
    description:
      'This API is used for getting list of subscription duration drop down',
  })
  @Post('listOfSubscriptionDropDow')
  async listOfSubscriptionDropDown() {
    return await this.commonListService.listOfSubscriptionDropDown();
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of business review(for home page)',
    description: 'This API is used for getting list of business review',
  })
  @Post('listOfBusinessReview')
  async listOfBusinessReview(@Body() dto: ListOfDataDto) {
    return await this.commonListService.listOfBusinessReview(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Home page stats data',
    description:
      'This API is used for getting avg rating and total satisfied customers project count',
  })
  @Get('home/stats')
  async stats() {
    return await this.commonListService.stats();
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View service details()',
    description: 'This API is used for getting service details by service name',
  })
  @ApiParam({
    example: 'plumber',
    name: 'serviceName',
    required: true,
  })
  @ApiQuery({
    example: 'Øyer',
    name: 'municipalityName',
    required: false,
  })
  @Get('viewService/:serviceName')
  async getServiceDetails(
    @Param('serviceName') serviceName: string,
    @Query('municipalityName') municipalityName?: string,
  ) {
    return await this.commonListService.getServiceDetails(
      serviceName,
      municipalityName,
    );
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get municipalities by direction',
    description: 'This API is used to get municipalities grouped by direction',
  })
  @Get('getMunicipalitiesByDirection')
  async getMunicipalitiesByDirection() {
    return await this.commonListService.getMunicipalitiesByDirection();
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View service details()',
    description: 'This API is used for getting service details by service name',
  })
  @ApiParam({
    example: '67a123b4d123feee7e0e4f93',
    name: 'id',
    required: true,
  })
  @Get('viewUserDetails/:id')
  async viewUserDetails(@Param('id') userId: string) {
    return await this.commonListService.viewUserDetails(userId);
  }
}
