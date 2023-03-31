import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import { User } from 'src/users/schema/users.schema';
import { Boutique } from './boutique.schema';
import { Product } from './products.schema';

export type BoutiqueProductDocument = HydratedDocument<BoutiqueProduct>;
export type StoredProduct = {
  boutiqueProduct: Types.ObjectId;
  quantity: number;
};

@Schema()
export class BoutiqueProduct {
  _id: Types.ObjectId;

  @Prop({ types: mongoose.Schema.Types.String, ref: 'Product' })
  sku: string;

  @Prop({ types: mongoose.Schema.Types.ObjectId, ref: 'Boutique' })
  boutique: Types.ObjectId;

  @Prop()
  size: string;

  @Prop()
  quantity: number;

  @Prop()
  price: number;
}

export const BoutiqueProductSchema =
  SchemaFactory.createForClass(BoutiqueProduct);
