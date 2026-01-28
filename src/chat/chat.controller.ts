import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiTag, Role } from 'src/libs/utils/constant/enum';
import { ChatService } from './chat.service';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { CreateChatDto } from './dto/createChat.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { UserRequest } from 'src/libs/utils/constant/interface';

@ApiTags(ApiTag.CHAT)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ROLES(Role.CUSTOMER, Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create chat sessions',
    description: 'This helps to track messages and uniq chatId',
  })
  @Post('createSession')
  createChat(@Req() req: UserRequest, @Body() dto: CreateChatDto) {
    return this.chatService.createChat(req, dto);
  }

  @ROLES(Role.CUSTOMER, Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return the chat of user ',
    description: 'This helps to track chat list of that user',
  })
  @Post('chatList')
  getChat(@Req() req: UserRequest, @Body() dto: ListOfDataDto) {
    return this.chatService.listOfChat(req, dto);
  }

  @ROLES(Role.CUSTOMER, Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get unread message count',
    description:
      'Returns the count of unread messages for the authenticated user',
  })
  @Get('unread-count')
  getUnreadMessageCount(@Req() req: UserRequest) {
    return this.chatService.getUnreadMessageCount(req);
  }
}
