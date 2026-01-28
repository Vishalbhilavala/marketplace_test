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
import { EmailTemplateService } from './email_template.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateMailTemplateDto,
  UpdateMailTemplateDto,
} from './dto/email_template.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';

@ApiTags(ApiTag.EMAIL_TEMPLATE)
@Controller(ControllerEndpoint.EMAIL_TEMPLATE)
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Email Template',
    description: 'This API is used for creating Email Template',
  })
  @Post('createEmailTemplate')
  async createEmailTemplate(@Body() dto: CreateMailTemplateDto) {
    return await this.emailTemplateService.createEmailTemplate(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Email Template by ID',
    description: 'This API is used for viewing Email Template by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('viewEmailTemplate/:id')
  async viewEmailTemplate(@Param('id') emailTemplateId: string) {
    return await this.emailTemplateService.viewEmailTemplate(emailTemplateId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Email Template by ID',
    description: 'This API is used for updating Email Template by ID',
  })
  @Put('updateEmailTemplate')
  async updateEmailTemplate(@Body() dto: UpdateMailTemplateDto) {
    return await this.emailTemplateService.updateEmailTemplate(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Email Templates',
    description: 'This API is used for getting list of Email Templates',
  })
  @Post()
  async listOfEmailTemplate(@Body() dto: ListOfDataDto) {
    return await this.emailTemplateService.listOfEmailTemplate(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Email Template by ID',
    description: 'This API is used for deleting Email Template by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Delete('deleteEmailTemplate/:id')
  async deleteEmailTemplate(@Param('id') emailTemplateId: string) {
    return await this.emailTemplateService.deleteEmailTemplate(emailTemplateId);
  }
}
