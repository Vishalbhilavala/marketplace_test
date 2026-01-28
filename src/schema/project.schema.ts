import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import {
  ProjectStatus,
  Role,
  TemplateFieldType,
  TemplateValidation,
} from 'src/libs/utils/constant/enum';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ _id: true })
export class ProjectDetail {
  @Prop({ type: String, required: false })
  lableName: string;

  @Prop({ type: String })
  fieldValue: string;

  @Prop({
    type: String,
    enum: [
      TemplateFieldType.TEXT,
      TemplateFieldType.EMAIL,
      TemplateFieldType.NUMBER,
      TemplateFieldType.TEL,
      TemplateFieldType.RADIO,
      TemplateFieldType.CHECKBOX,
      TemplateFieldType.DROPDOWN,
      TemplateFieldType.DATE,
      TemplateFieldType.FILE,
      TemplateFieldType.TEXTAREA,
    ],
  })
  fieldType: string;

  @Prop({
    type: String,
    enum: [TemplateValidation.YES, TemplateValidation.NO],
  })
  isRequired: string;

  @Prop({
    type: String,
    enum: [TemplateValidation.YES, TemplateValidation.NO],
  })
  readOnly: string;

  @Prop({ type: String })
  variableOptions: string;
}

@Schema({ timestamps: true, collection: 'project' })
export class Project {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  customer_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, unique: true })
  project_id: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  business_id?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
  })
  title: string;

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    type: String,
  })
  address: string;

  @Prop({
    type: String,
  })
  postal_code: string;

  @Prop({ type: [String], default: [] })
  project_image?: string[];

  @Prop({
    type: {
      category_id: { type: MongooseSchema.Types.ObjectId },
      type_of_work_id: { type: MongooseSchema.Types.ObjectId },
    },
  })
  category: {
    category_id: MongooseSchema.Types.ObjectId;
    type_of_work_id: MongooseSchema.Types.ObjectId;
  };

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'County',
    required: true,
  })
  county_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Municipality',
    required: true,
  })
  municipality_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      ProjectStatus.DRAFT,
      ProjectStatus.PUBLISHED,
      ProjectStatus.ASSIGNED,
      ProjectStatus.COMPLETED,
      ProjectStatus.CANCELLED,
      ProjectStatus.DELETED,
    ],
  })
  status:
    | ProjectStatus.DRAFT
    | ProjectStatus.PUBLISHED
    | ProjectStatus.ASSIGNED
    | ProjectStatus.COMPLETED
    | ProjectStatus.CANCELLED
    | ProjectStatus.DELETED;

  @Prop({
    type: String,
    enum: [Role.CUSTOMER, Role.ADMIN],
  })
  source: Role.CUSTOMER | Role.ADMIN;

  @Prop({ type: String, required: false })
  meta_title: string;

  @Prop({ type: String, required: false })
  meta_description?: string;

  @Prop({ type: [String], default: [] })
  meta_keyword?: string[];

  @Prop({
    type: [ProjectDetail],
    default: [],
  })
  project_details: ProjectDetail[];

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  is_deleted: boolean;
}

export const projectSchema = SchemaFactory.createForClass(Project);
