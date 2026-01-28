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
import { ProjectService } from './project.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
} from './dto/project.dto';
import { ListOfDataDto } from 'src/libs/helper/common/dto/listOfData.dto';
import { ApiTag, ControllerEndpoint, Role } from 'src/libs/utils/constant/enum';
import { UserRequest } from 'src/libs/utils/constant/interface';
import { ROLES } from 'src/libs/service/auth/decorators/role.decorator';
import { JwtGuard } from 'src/libs/service/auth/guards/jwt.guard';
import { RolesGuard } from 'src/libs/service/auth/guards/role.guard';

@ApiTags(ApiTag.PROJECT)
@Controller(ControllerEndpoint.PROJECT)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Project',
    description: 'This API is used for creating Project',
  })
  @Post('createProject')
  async createProject(@Body() dto: CreateProjectDto) {
    return await this.projectService.createProject(dto);
  }

  @ROLES(Role.ADMIN, Role.CUSTOMER, Role.BUSINESS)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Project by ID',
    description: 'This API is used for viewing Project by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Get('viewProject/:id')
  async viewProject(@Req() req: UserRequest, @Param('id') projectId: string) {
    return await this.projectService.viewProject(req, projectId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List of Projects',
    description: 'This API is used for getting list of Projects',
  })
  @Post('listOfProject')
  async listOfProject(@Body() dto: ListOfDataDto) {
    return await this.projectService.listOfProject(dto);
  }

  @ROLES(Role.ADMIN, Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Project by ID',
    description: 'This API is used for deleting Project by ID',
  })
  @ApiParam({
    example: '6928359bae59c24b75504f35',
    name: 'id',
    required: true,
  })
  @Delete('deleteProject/:id')
  async deleteProject(@Req() req: UserRequest, @Param('id') projectId: string) {
    return await this.projectService.deleteProject(req, projectId);
  }

  @ROLES(Role.ADMIN, Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Project by ID',
    description: 'This API is used for updating Project by ID',
  })
  @Put('updateProject')
  async updateProject(@Req() req: UserRequest, @Body() dto: UpdateProjectDto) {
    return await this.projectService.updateProject(req, dto);
  }

  @ROLES(Role.ADMIN, Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Project Status',
    description:
      'This API is used for updating Project status by admin or customer',
  })
  @Put('updateStatus')
  async updateStatus(@Body() dto: UpdateProjectStatusDto) {
    return await this.projectService.updateProjectStatus(dto);
  }

  @ROLES(Role.CUSTOMER)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel Project',
    description: 'This API is used for canceling Project by customer',
  })
  @Put('cancelProject')
  async cancelProject(@Body() dto: UpdateProjectStatusDto) {
    return await this.projectService.cancelProject(dto);
  }
}
