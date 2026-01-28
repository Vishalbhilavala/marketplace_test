import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { ContactUsService } from './contact_us.service';
import { CreateContactUsDto } from './dto/contact-us.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';

@ApiTags(ApiTag.CONTACT_US)
@Controller(ControllerEndpoint.CONTACT_US)
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Contact Us',
    description: 'This API is used for creating a new Contact Us entry.',
  })
  @Post('contactUs')
  async createContactUs(@Body() dto: CreateContactUsDto) {
    return await this.contactUsService.createContactUs(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Contact Us by ID',
    description: 'This API is used for viewing Contact Us by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('viewContactUs/:id')
  async viewContactUs(@Param('id') contactId: string) {
    return await this.contactUsService.viewContactUs(contactId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Contact Us',
    description: 'This API is used for getting list of Contact Us',
  })
  @Post()
  async listOfContactUs(@Body() dto: ListOfDataDto) {
    return await this.contactUsService.listOfContactUs(dto);
  }
}
