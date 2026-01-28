import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { CategorySource } from 'src/libs/utils/constant/enum';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ _id: true })
class TypeOfWorkData {
  @Prop({ type: String })
  name: string;
}

@Schema({ _id: true })
class SectionWithTitle {
  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  location_description: string;
}

@Schema({ _id: true })
class SectionWithHtml {
  @Prop({ type: String })
  html: string;
}

@Schema({ _id: true, timestamps: true })
class CategoryData {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'CategoryType',
    required: true,
  })
  categoryType_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  category_image: string;

  @Prop({ type: String })
  category_icon: string;

  @Prop({
    type: [TypeOfWorkData],
    default: [],
  })
  type_of_work: TypeOfWorkData[];

  @Prop({ type: String, required: false })
  meta_title: string;

  @Prop({ type: String, required: false })
  meta_description?: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  is_deleted: boolean;

  @Prop({ type: [String], default: [] })
  meta_keywords?: string[];

  @Prop({ type: SectionWithTitle })
  section1?: SectionWithTitle;

  @Prop({ type: SectionWithHtml })
  section2?: SectionWithHtml;

  @Prop({ type: SectionWithHtml })
  section3?: SectionWithHtml;

  @Prop({ type: SectionWithTitle })
  section4?: SectionWithTitle;

  @Prop({ type: SectionWithHtml })
  section5?: SectionWithHtml;
}

@Schema({ timestamps: true, collection: 'category' })
export class Category {
  @Prop({
    type: String,
    required: true,
  })
  profession_name: string;

  @Prop({
    type: [CategoryData],
    default: [],
  })
  category: CategoryData[];

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  is_deleted: boolean;

  @Prop({
    type: String,
    enum: [CategorySource.PROFF, CategorySource.ADMIN],
    default: CategorySource.ADMIN,
  })
  source: string;
}

export const categorySchema = SchemaFactory.createForClass(Category);
