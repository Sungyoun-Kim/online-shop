import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema()
export class Brand {
  _id: Types.ObjectId;

  @Prop({ unique: true })
  name: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
