import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { UserRequest } from 'src/libs/utils/constant/interface';
import {
  ListOfBusinessProjectDto,
  ListOfDataDto,
  ListOfProjectDataDto,
} from 'src/libs/helper/common/dto/listOfData.dto';

@ApiTags(ApiTag.DASHBOARD)
@Controller(ControllerEndpoint.DASHBOARD)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Projects(Business)',
    description: 'This API is used for getting list of published projects',
  })
  @Post('listOfProject')
  async listOfProject(
    @Req() req: UserRequest,
    @Body() dto: ListOfBusinessProjectDto,
  ) {
    return await this.dashboardService.listOfProject(req, dto, false);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Active Projects(Business)',
    description:
      'This API is used for getting list of active (assigned) projects for logged-in business',
  })
  @Post('listOfActiveProject')
  async listOfActiveProject(
    @Req() req: UserRequest,
    @Body() dto: ListOfBusinessProjectDto,
  ) {
    return await this.dashboardService.listOfProject(req, dto, true);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Business Dashboard Top Stats',
    description:
      'This API is used to get top-level dashboard statistics for the logged-in business such as remaining clips, new projects, active offers, and average rating.',
  })
  @Get('statsCount')
  async getBusinessTopStats(@Req() req: UserRequest) {
    return await this.dashboardService.getBusinessTopStats(req);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Recent Offers(Business)',
    description:
      'This API is used to get the list of recent offers for the logged-in business with pagination, search, and sorting.',
  })
  @Post('recentOffers')
  async listRecentOffers(@Req() req: UserRequest, @Body() dto: ListOfDataDto) {
    return await this.dashboardService.listRecentOffers(req, dto);
  }

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of customer projects',
    description: 'This API is used for getting list of customer projects',
  })
  @Post('customer/listOfProject')
  async listOfCustomerProject(
    @Req() req: UserRequest,
    @Body() dto: ListOfProjectDataDto,
  ) {
    return await this.dashboardService.listOfCustomerProject(req, dto, false);
  }

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of customer active projects',
    description:
      'This API is used for getting list of customer active projects',
  })
  @Post('customer/listOfActiveProject')
  async listOfCustomerActiveProject(
    @Req() req: UserRequest,
    @Body() dto: ListOfProjectDataDto,
  ) {
    return await this.dashboardService.listOfCustomerProject(req, dto, true);
  }

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Customer Dashboard Top Stats',
    description:
      'This API is used to get top-level customer dashboard statistics for the logged-in customer such as active projects, total offer and completed projects.',
  })
  @Get('customer/statsCount')
  async getCustomerTopStats(@Req() req: UserRequest) {
    return await this.dashboardService.getCustomerTopStats(req);
  }

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of received offers',
    description:
      'This API is used for getting list of received offers by projectId',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Post('customer/listOfReceivedOffer/:id')
  async listOfReceivedOffer(
    @Req() req: UserRequest,
    @Param('id') projectId: string,
    @Body() dto: ListOfDataDto,
  ) {
    return await this.dashboardService.listOfReceivedOffer(req, projectId, dto);
  }
}
