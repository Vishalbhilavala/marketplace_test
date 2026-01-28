import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, categorySchema } from 'src/schema/category.schema';
import {
  CategoryTemplate,
  categoryTemplateSchema,
} from 'src/schema/category-template.schema';
import { SharedModule } from 'src/libs/shared/shared.module';
import { Project, projectSchema } from 'src/schema/project.schema';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: categorySchema },
      { name: CategoryTemplate.name, schema: categoryTemplateSchema },
      { name: Project.name, schema: projectSchema },
    ]),
  ],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
