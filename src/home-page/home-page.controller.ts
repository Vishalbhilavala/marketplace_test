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
import { HomePageService } from './home-page.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { AddHomePageDto, UpdateHomePageDto } from './dto/home-page.dto';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@ApiTags(ApiTag.HOME_PAGE)
@Controller(ControllerEndpoint.HOME_PAGE)
export class HomePageController {
  constructor(private readonly homePageService: HomePageService) {}

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Home Page',
    description: 'This API is used for creating a new Home Page entry.',
  })
  @Post('addHomePage')
  addHomePage(@Body() dto: AddHomePageDto) {
    return this.homePageService.addHomePage(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Home Page',
    description: 'This API is used for viewing a Home Page.',
  })
  @Get('viewHomePage/:id')
  viewHomePage(@Param('id') homePageId: string) {
    return this.homePageService.viewHomePage(homePageId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit Home Page',
    description: 'This API is used for editing Home Page.',
  })
  @Put('editHomePage')
  editHomePage(@Body() dto: UpdateHomePageDto) {
    return this.homePageService.editHomePage(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Home Page',
    description: 'This API is used for delete Home Page.',
  })
  @Delete('deleteHomePage/:id')
  deleteHomePage(@Param('id') homePageId: string) {
    return this.homePageService.deleteHomePage(homePageId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Home Page',
    description: 'This API is used for getting list of Home Page',
  })
  @Post('listOfHomePage')
  listOfHomePageDetails(@Body() dto: ListOfDataDto) {
    return this.homePageService.listOfHomePageDetails(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Current Affairs',
    description: 'This API is used for creating a new Current Affair entry.',
  })
  @Post('addCurrentAffair')
  addCurrentAffairs(@Body() dto: AddHomePageDto) {
    return this.homePageService.addHomePage(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Current Affair',
    description: 'This API is used for viewing a Current Affair.',
  })
  @Get('viewCurrentAffair/:id')
  viewCurrentAffair(@Param('id') homePageId: string) {
    return this.homePageService.viewHomePage(homePageId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit Current Affair',
    description: 'This API is used for editing Current Affair.',
  })
  @Put('editCurrentAffair')
  editCurrentAffair(@Body() dto: UpdateHomePageDto) {
    return this.homePageService.editHomePage(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Current Affair',
    description: 'This API is used for delete Current Affair.',
  })
  @Delete('deleteCurrentAffair/:id')
  deleteCurrentAffair(@Param('id') homePageId: string) {
    return this.homePageService.deleteHomePage(homePageId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Current Affair',
    description: 'This API is used for getting list of Current Affair',
  })
  @Post('listOfCurrentAffair')
  listOfHomeCurrentAffair(@Body() dto: ListOfDataDto) {
    return this.homePageService.listOfHomePageDetails(dto);
  }
}
