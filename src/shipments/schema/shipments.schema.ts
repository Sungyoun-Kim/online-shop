import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import { User } from 'src/users/schema/users.schema';

export type ShipmentDocument = HydratedDocument<Shipment>;

@Schema()
export class Shipment {
  _id: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  address: string;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);
