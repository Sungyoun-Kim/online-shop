import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import { BoutiqueProduct } from 'src/products/schema/boutique-product.schema';
import { User } from 'src/users/schema/users.schema';

export type CartDocument = HydratedDocument<Cart>;

@Schema()
export class Cart {
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  user: User;

  storedProducts: {
    productDetailId: BoutiqueProduct;
    quantity: number;
  }[];

  @Prop()
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
