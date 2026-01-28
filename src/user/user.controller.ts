import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
  Get,
  Req,
  UseInterceptors,
  UploadedFiles,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ChangePasswordDto,
  CreateCustomerDto,
  CreatePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ValidateBusinessDto,
  VerifyEmailDto,
  VerifyOtpDto,
} from './dto/user.dto';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { Role } from 'src/libs/utils/constant/enum';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';
import { UserRequest } from 'src/libs/utils/constant/interface';
import {
  TypeDto,
  UpdateCustomerDto,
  UpdateUserDto,
} from './dto/update-user.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { upload } from 'src/libs/helper/multer';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register User(Customer | Business)',
    description: 'This API is used for registering a customer | business user.',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    const { role } = dto;
    if (role === Role.CUSTOMER && dto.customerFields) {
      return this.userService.customerRegister(dto.customerFields);
    }
    if (role === Role.BUSINESS && dto.businessFields) {
      return this.userService.businessRegister(dto.businessFields);
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login using Email',
    description: 'This API is used for login for every user',
  })
  @Post('login')
  userLogin(@Body() dto: LoginDto) {
    return this.userService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login using Email',
    description: 'This API is used for login for every user',
  })
  @Post('validateBusiness')
  async validateBusiness(@Body() dto: ValidateBusinessDto) {
    return await this.userService.validateBusiness(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'File upload',
    description:
      'Allows users to upload a file to the server or directly to S3.',
  })
  @Post('/fileUpload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor(
      'files',
      10,
      process.env.ENV_TYPE === 'production'
        ? {
            storage: memoryStorage(),
            fileFilter: upload.fileFilter,
            limits: upload.limits,
          }
        : upload,
    ),
  )
  fileUpload(@UploadedFiles() files: Express.Multer.File[]) {
    if (process.env.ENV_TYPE === 'production') {
      return this.userService.fileUploaded(files);
    } else {
      return this.userService.fileUpload(files);
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Email for forgot password',
    description:
      'This API is used for sending otp verification for forgot password.',
  })
  @Post('verifyEmail')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.userService.verifyEmail(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP for forgot password',
    description: 'This API is used for otp verification for forgot password.',
  })
  @Post('verifyOtp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.userService.verifyOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description:
      'This API is used for forgot password once your otp is verified successfully.',
  })
  @Put('forgotPassword')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.userService.forgotPassword(dto);
  }

  @ROLES(Role.ADMIN, Role.BUSINESS, Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'change password',
    description: 'This API is used to change password..',
  })
  @Put('changePassword')
  changePassword(@Req() req: UserRequest, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req, dto);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'change viewProfile',
    description: 'This API is used to view user ..',
  })
  @Get('viewProfile')
  viewProfile(@Req() req: UserRequest) {
    return this.userService.viewProfile(req);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'edit profile',
    description: 'This API is used to edit profile..',
  })
  @Put('editProfile')
  editProfile(@Body() dto: UpdateUserDto) {
    return this.userService.editProfile(dto);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'dropdown APIs',
    description: 'This is the dropdown APIs..',
  })
  @Post('listOfTypes')
  listOfTypes(@Body() dto: TypeDto) {
    return this.userService.listOfTypes(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'customer edit profile',
    description: 'This API is used to edit customer profile for admin user.',
  })
  @Put('customer/updateCustomer')
  editCustomerProfile(@Body() dto: UpdateCustomerDto) {
    return this.userService.editCustomerProfile(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Customers',
    description: 'This API is used for getting list of customers.',
  })
  @Post('customer/listOfCustomer')
  async listOfCustomer(@Body() dto: ListOfDataDto) {
    return await this.userService.listOfCustomer(dto);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Customer by ID',
    description: 'This API is used for viewing Customer details by ID',
  })
  @ApiParam({
    example: '69270a191409f23ce2d2de41',
    name: 'id',
    required: true,
  })
  @Get('customer/viewCustomer/:id')
  async viewCustomer(@Param('id') customerId: string) {
    return await this.userService.viewCustomer(customerId);
  }

  @ROLES(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Customer',
    description: 'This API is used for adding a new customer for admin.',
  })
  @Post('customer/addCustomer')
  async addCustomer(@Body() dto: CreateCustomerDto) {
    return await this.userService.addCustomer(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search verified companies',
    description:
      'Fetch verified business details from Proff API using a search query. Only company name and organization number are returned.',
  })
  @ApiQuery({
    name: 'query',
    type: String,
    example: 'software',
  })
  @Get('businessSearch')
  searchCompanies(@Query('query') query: string) {
    if (process.env.ENV_TYPE === 'production') {
      return this.userService.searchCompanies(query);
    } else {
      return this.userService.searchCompaniesDev(query);
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Password',
    description:
      'This API allows a business to set its password for the first time.',
  })
  @Post('createPassword')
  async createPassword(
    @Query('email') email: string,
    @Body() dto: CreatePasswordDto,
  ) {
    return await this.userService.createPassword(email, dto);
  }
}
