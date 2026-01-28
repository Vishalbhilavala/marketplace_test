import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProffCountyDocument = HydratedDocument<ProffCounty>;

export class Village {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  postal_code: string;
}

export class Municipality {
  @Prop({ type: String })
  name: string;

  @Prop({ type: [Village], default: [] })
  villages: Village[];
}

@Schema({ timestamps: true, collection: 'proff_county' })
export class ProffCounty {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: [Municipality], default: [] })
  municipalities: Municipality[];

  @Prop({ type: String })
  direction: string;

  @Prop({ type: String })
  source: string;
}

export const proffCountySchema = SchemaFactory.createForClass(ProffCounty);
