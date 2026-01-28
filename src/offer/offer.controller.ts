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
import { OfferService } from './offer.service';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { AcceptOfferDto, ApplyProjectDto } from './dto/offer.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@ApiTags(ApiTag.OFFER)
@Controller(ControllerEndpoint.OFFER)
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Make Offer on Project',
    description:
      'This API is used for make offer on published project for business user',
  })
  @Post('applyProject')
  async applyProject(@Req() req: UserRequest, @Body() dto: ApplyProjectDto) {
    return await this.offerService.applyProject(req, dto);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Offers',
    description: 'This API is used for getting list of Offers for business',
  })
  @Post('listOfOffer')
  async listOfOffer(@Req() req: UserRequest, @Body() dto: ListOfDataDto) {
    return await this.offerService.listOfOffer(req, dto);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Offer Details',
    description: 'This API is used for getting offer details for business',
  })
  @ApiParam({
    example: '69270a191409f23cf2d2de48',
    name: 'offerId',
    required: true,
  })
  @Get('viewOffer/:offerId')
  async viewOffer(@Req() req: UserRequest, @Param('offerId') offerId: string) {
    return await this.offerService.viewOffer(req, offerId);
  }

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept Offer on Project',
    description:
      'This API is used tp accept an offer on published project for customer user',
  })
  @Post('acceptOffer')
  async acceptOffer(@Req() req: UserRequest, @Body() dto: AcceptOfferDto) {
    return await this.offerService.acceptOffer(req, dto);
  }
}
