import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@ApiTags(ApiTag.REVIEW)
@Controller(ControllerEndpoint.REVIEW)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Review',
    description: 'This API is used for creating Review',
  })
  @Post('createReview')
  async createReview(@Req() req: UserRequest, @Body() dto: CreateReviewDto) {
    return await this.reviewService.createReview(req, dto);
  }

  @ROLES(Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Review',
    description: 'This API is used for updating Review by ID',
  })
  @Put('updateReview')
  async updateReview(@Body() dto: UpdateReviewDto) {
    return await this.reviewService.updateReview(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Reviews',
    description: 'This API is used for getting list of Reviews by Business ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: false,
  })
  @Post('listOfReview/:id')
  async listOfReview(
    @Param('id') businessId: string,
    @Body() dto: ListOfDataDto,
  ) {
    return await this.reviewService.listOfReview(businessId, dto);
  }
}
