import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  PaymentStatus,
  BusinessStatus,
  Role,
} from 'src/libs/utils/constant/enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
class TypeOfWork {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  type_of_work_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;
}

@Schema({ _id: false })
class Category {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  category_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: [TypeOfWork], default: [] })
  type_of_works: TypeOfWork[];
}

@Schema({ timestamps: true, collection: 'user', minimize: false })
export class User {
  @Prop({ type: String, required: false, maxlength: 50 })
  full_name: string;

  @Prop({
    type: String,
    required: true,
  })
  email: string;

  @Prop({ type: String, required: false })
  password: string;

  @Prop({ type: String })
  phone_number: string;

  @Prop({
    type: String,
    enum: [Role.ADMIN, Role.BUSINESS, Role.CUSTOMER],
    required: true,
  })
  role: Role.CUSTOMER | Role.BUSINESS | Role.ADMIN;

  @Prop({ type: String, default: null })
  profile_image?: string | null;

  @Prop({ type: String, default: null })
  banner_image?: string | null;

  @Prop({ type: Boolean, required: true, default: true })
  is_active: boolean;

  @Prop({ type: String, default: null })
  business_name?: string | null;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  remarks?: string;
  @Prop({
    type: [
      {
        county_id: {
          type: MongooseSchema.Types.ObjectId,
          ref: 'county',
          required: true,
        },
        municipalities: [
          {
            municipality_id: {
              type: MongooseSchema.Types.ObjectId,
              required: true,
            },
            is_active: {
              type: Boolean,
              default: true,
            },
          },
        ],
      },
    ],
    default: [],
  })
  county: {
    county_id: Types.ObjectId;
    municipalities: {
      municipality_id: Types.ObjectId;
      is_active: boolean;
    }[];
  }[];

  @Prop({
    type: {
      postalAddress: {
        addressLine: { type: String, maxlength: 255 },
        postPlace: { type: String, maxlength: 255 },
        postalCode: { type: String },
      },
    },
    default: null,
  })
  address?: {
    postalAddress?: {
      addressLine?: string;
      postPlace?: string;
      postalCode?: string;
    };
  } | null;

  @Prop({ type: String, default: null })
  postal_code?: string | null;

  @Prop({
    type: [
      {
        XCoordinate: { type: Number },
        YCoordinate: { type: Number },
      },
    ],
    default: null,
  })
  coordinates?: { XCoordinate: number; YCoordinate: number }[] | null;

  @Prop({ type: String, maxlength: 255, default: null })
  org_no?: string | null;

  @Prop({ type: Boolean })
  terms_condition?: boolean;

  @Prop({ type: [Category], required: false })
  category: Category[];

  @Prop({ type: Boolean, required: true, default: false })
  is_password: boolean;

  @Prop({
    type: String,
    enum: [BusinessStatus.APPROVED, BusinessStatus.REJECTED],
  })
  status: string;

  @Prop({
    type: String,
    enum: [
      PaymentStatus.PENDING,
      PaymentStatus.PAYMENT_RECEIVED,
      PaymentStatus.PAYMENT_REJECTED,
    ],
    default: PaymentStatus.PENDING,
  })
  payment_status: string;

  @Prop({ type: Boolean, default: false })
  plan_assigned: boolean;

  @Prop({
    type: Object,
    required: false,
    default: {
      offer: false,
      message: false,
      completed_project: false,
    },
  })
  user_notifications: {
    offer: boolean;
    message: boolean;
    completed_project: boolean;
  };
}

export const userSchema = SchemaFactory.createForClass(User);
