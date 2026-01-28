import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ApiTag, Role } from 'src/libs/utils/constant/enum';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import {
  AddRefillPlanDto,
  AddRenewalPlanDto,
  AssignBusinessPlanDto,
  UpdateBusinessStatusDto,
  UpdatePaymentDto,
  UpdatePaymentStatusDto,
} from './dto/purchasing.dto';

@ApiTags(ApiTag.BUSINESS)
@Controller()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Businesses',
    description: 'This API is used for getting list of businesses.',
  })
  @Post('business/listOfBusiness')
  async listOfBusiness(@Body() dto: ListOfDataDto) {
    return await this.businessService.listOfBusiness(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Business by ID',
    description: 'This API is used for viewing Business details by ID',
  })
  @ApiParam({
    example: '69270a191409f23ce2d2de41',
    name: 'id',
    required: true,
  })
  @Get('business/viewBusiness/:id')
  async viewBusiness(@Param('id') businessId: string) {
    return await this.businessService.viewBusiness(businessId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Payment Status',
    description: 'This API is used for updating payment status',
  })
  @Put('purchasing/updatePayment')
  async updatePayment(@Body() dto: UpdatePaymentDto) {
    return await this.businessService.updatePayment(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Purchasing',
    description: 'This API is used for getting list of purchasing.',
  })
  @Post('purchasing/listOfPurchasing')
  async listOfPurchasing(@Body() dto: ListOfDataDto) {
    return await this.businessService.listOfPurchasing(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Purchase Details by ID',
    description: 'This API is used to view purchase details of a business',
  })
  @ApiParam({
    example: '67a123b4d123feee7e0e4f93',
    name: 'id',
    required: true,
  })
  @Get('purchasing/viewPurchasing/:id')
  async viewPurchasing(@Param('id') purchasingId: string) {
    return await this.businessService.viewPurchasing(purchasingId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Business Status',
    description: 'This API is used for updating business status',
  })
  @Put('purchasing/updateBusinessStatus')
  async updateBusinessStatus(@Body() dto: UpdateBusinessStatusDto) {
    return await this.businessService.updateBusinessStatus(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Payment Status',
    description: 'This API is used for updating payment status',
  })
  @Put('purchasing/updatePaymentStatus')
  async updatePaymentStatus(@Body() dto: UpdatePaymentStatusDto) {
    return await this.businessService.updatePaymentStatus(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Renewal Plan',
    description: 'This API is used for adding renewal plan',
  })
  @Post('purchasing/addRenewalPlan')
  async addRenewalPlan(@Body() dto: AddRenewalPlanDto) {
    return await this.businessService.addRenewalPlan(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Refill Plan',
    description: 'This API is used for adding refill plan',
  })
  @Post('purchasing/addRefillPlan')
  async addRefillPlan(@Body() dto: AddRefillPlanDto) {
    return await this.businessService.addRefillPlan(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Expiry Date',
    description: 'This API is used for getting expiry date',
  })
  @ApiParam({
    example: '67a123b4d123feee7e0e4f93',
    name: 'id',
    required: true,
  })
  @Get('purchasing/getExpiryDate/:id')
  async getExpiryDate(@Param('id') id: string) {
    return await this.businessService.getExpiryDate(id);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign Business Plan',
    description: 'This API is used for assigning business plan',
  })
  @Post('purchasing/assignBusinessPlan')
  async assignBusinessPlan(@Body() dto: AssignBusinessPlanDto) {
    return await this.businessService.assignBusinessPlan(dto);
  }
}
