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
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ApiTag, ControllerEndpoint } from 'src/libs/utils/constant/enum';

@ApiTags(ApiTag.FAQ)
@Controller(ControllerEndpoint.FAQ)
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create FAQ',
    description: 'This API is used for creating FAQ',
  })
  @Post('createFaq')
  async createFaq(@Body() dto: CreateFaqDto) {
    return await this.faqService.createFaq(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View FAQ by ID',
    description: 'This API is used for viewing FAQ by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('viewFaq/:id')
  async viewFaq(@Param('id') faqId: string) {
    return await this.faqService.viewFaq(faqId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of FAQs',
    description: 'This API is used for getting list of FAQs',
  })
  @Post()
  async listOfFaq(@Body() dto: ListOfDataDto) {
    return await this.faqService.listOfFaq(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete FAQ by ID',
    description: 'This API is used for deleting FAQ by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Delete('deleteFaq/:id')
  async deleteFaq(@Param('id') faqId: string) {
    return await this.faqService.deleteFaq(faqId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update FAQ by ID',
    description: 'This API is used for updating FAQ by ID',
  })
  @Put('updateFaq')
  async updateFaq(@Body() dto: UpdateFaqDto) {
    return await this.faqService.updateFaq(dto);
  }
}
