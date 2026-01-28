import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminDashboardService } from './admin_dashboard.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminDto } from './dto/admin.dto';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@Controller(ControllerEndpoint.ADMIN_DASHBOARD)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get New Businesses',
    description:
      'This API is used to get new businesses count base on daily or monthly.',
  })
  @Post('newBusinesses')
  async getNewBusinessRegistrations(@Body() dto: AdminDto) {
    return await this.adminDashboardService.getNewBusinessRegistrations(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get New Customers',
    description:
      'This API is used to get new customer count base on daily or monthly.',
  })
  @Post('newCustomers')
  async getNewCustomerRegistrations(@Body() dto: AdminDto) {
    return await this.adminDashboardService.getNewCustomerRegistrations(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Publish Project Counts',
    description:
      'This API is used to get publish projects count base on daily or monthly timeFrame.',
  })
  @Post('projectCounts')
  async getProjectPostCounts(@Body() dto: AdminDto) {
    return await this.adminDashboardService.getProjectPostCounts(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Top Level Stats',
    description:
      'This API is used to get top level statistics for admin dashboard.',
  })
  @Get('getTopLevelStats')
  async getTopLevelStats() {
    return await this.adminDashboardService.getTopLevelStats();
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Top Businesses',
    description:
      'This API is used to get top businesses based on number of projects posted.',
  })
  @Post('getTopBusinesses')
  async getTopBusinesses(@Body() dto: ListOfDataDto) {
    return await this.adminDashboardService.getTopBusinesses(dto);
  }
}
