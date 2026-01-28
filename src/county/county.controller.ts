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
import { CountyService } from './county.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiTag, Role } from 'src/libs/utils/constant/enum';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { CountyDto, EditCountyDto } from './dto/county.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@Controller('county')
export class CountyController {
  constructor(private readonly countyService: CountyService) {}

  @ApiTags(ApiTag.COUNTY)
  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'This API is used for adding county.',
  })
  @Post('addCounty')
  async addCounty(@Body() dto: CountyDto) {
    return await this.countyService.addCounty(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Counties',
    description: 'This API is used for getting list of Counties',
  })
  @Post('listOfCounty')
  async listOfCounty(@Body() dto: ListOfDataDto) {
    return await this.countyService.listOfCounty(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View County by ID',
    description: 'This API is used for viewing County by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('viewCounty/:id')
  async viewCounty(@Param('id') countyId: string) {
    return await this.countyService.viewCounty(countyId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update County',
    description: 'This API is used for updating county information',
  })
  @Put('updateCounty')
  async updateCounty(@Body() dto: EditCountyDto) {
    return await this.countyService.updateCounty(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete County',
    description: 'This API is used for deleting county',
  })
  @Delete('deleteCounty/:id')
  async deleteCounty(@Param('id') countyId: string) {
    return await this.countyService.deleteCounty(countyId);
  }
}
