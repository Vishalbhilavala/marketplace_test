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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClipSubscriptionService } from './clip-subscription.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { AddClipDto, EditClipDto, ListOfClipUsageDto } from './dto/clip.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { UserRequest } from 'src/libs/utils/constant/interface';

@ApiTags(ApiTag.CLIP_SUBSCRIPTION)
@Controller(ControllerEndpoint.CLIP_SUBSCRIPTION)
export class ClipSubscriptionController {
  constructor(
    private readonly clipSubscriptionService: ClipSubscriptionService,
  ) {}

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Subscription',
    description: 'This API is used to add subscription.',
  })
  @Post('addSubscription')
  addSubscription(@Body() dto: AddClipDto) {
    return this.clipSubscriptionService.addSubscription(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Subscription',
    description: 'This API is used to view subscription details.',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('viewSubscription/:id')
  viewSubscription(@Param('id') subscriptionId: string) {
    return this.clipSubscriptionService.viewSubscription(subscriptionId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Subscription',
    description: 'This API is used to update subscription details.',
  })
  @Put('updateSubscription')
  updateSubscription(@Body() dto: EditClipDto) {
    return this.clipSubscriptionService.updateSubscription(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Subscription',
    description: 'This API is used to delete subscription details.',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Delete('deleteSubscription/:id')
  deleteSubscription(@Param('id') subscriptionId: string) {
    return this.clipSubscriptionService.deleteSubscription(subscriptionId);
  }

  @ROLES(Role.ADMIN, Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Clip Subscription',
    description: 'This API is used for getting list of clip subscription',
  })
  @Post('listOfSubscriptions')
  listOfClipSubscriptions(@Req() req: UserRequest, @Body() dto: ListOfDataDto) {
    return this.clipSubscriptionService.listOfClipSubscriptions(req, dto);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of clip usage history',
    description:
      'This API is used for getting list of clip usage history for businesses',
  })
  @Post('clipHistory')
  listOfClipHistory(@Req() req: UserRequest, @Body() dto: ListOfClipUsageDto) {
    return this.clipSubscriptionService.listOfClipHistory(req, dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of clip usage history(Admin side)',
    description:
      'This API is used for getting businesses list of clip usage history for Admins',
  })
  @ApiParam({
    example: '69270a191409f23ce2d2de41',
    name: 'businessId',
    required: true,
  })
  @Post('businessClipHistory/:businessId')
  businessClipHistory(
    @Param('businessId') businessId: string,
    @Body() dto: ListOfDataDto,
  ) {
    return this.clipSubscriptionService.businessClipHistory(businessId, dto);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Business plan selection',
    description: 'This API is used for select plan for business user',
  })
  @ApiParam({
    example: '67a123b4d123feee7e0e4f93',
    name: 'subscription_id',
    required: true,
  })
  @Post('sendPlanRequest/:subscription_id')
  async sendPlanRequest(
    @Req() req: UserRequest,
    @Param('subscription_id') subscriptionId: string,
  ) {
    return await this.clipSubscriptionService.sendPlanRequest(
      req,
      subscriptionId,
    );
  }
}
