import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  TemplateFieldType,
  TemplateValidation,
} from 'src/libs/utils/constant/enum';

export type CategoryTemplateDocument = HydratedDocument<CategoryTemplate>;

@Schema({ _id: true })
class TemplateField {
  @Prop({ type: String, required: true })
  lableName: string;

  @Prop({ type: String, default: '' })
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

@Schema({ timestamps: true, collection: 'category_template' })
export class CategoryTemplate {
  @Prop({
    type: String,
    required: true,
  })
  template_name: string;

  @Prop({ type: [TemplateField], default: [] })
  field: TemplateField[];
}

export const categoryTemplateSchema =
  SchemaFactory.createForClass(CategoryTemplate);
