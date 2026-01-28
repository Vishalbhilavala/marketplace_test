import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MailTemplateDocument = HydratedDocument<MailTemplate>;

@Schema({ timestamps: true, collection: 'mail_template' })
export class MailTemplate {
  @Prop({
    type: String,
    required: true,
  })
  template: string;

  @Prop({
    type: [String],
    required: false,
  })
  recipient_roles: string[];

  @Prop({
    type: [
      {
        text: { type: String, required: true },
        link: { type: String, required: true },
        name: { type: [String], required: true },
      },
    ],
    required: true,
  })
  notification_variable: {
    text: string;
    link: string;
    name: string[];
  }[];

  @Prop({
    type: String,
    required: true,
  })
  notification_name: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  is_deleted: boolean;
}

export const mailTemplateSchema = SchemaFactory.createForClass(MailTemplate);
