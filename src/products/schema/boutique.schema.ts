import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type BoutiqueDocument = HydratedDocument<Boutique>;

@Schema()
export class Boutique {
  //
  _id: Types.ObjectId;

  @Prop()
  name: string;
}

export const BoutiqueSchema = SchemaFactory.createForClass(Boutique);
