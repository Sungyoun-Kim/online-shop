import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import {
  BoutiqueProduct,
  StoredProduct,
} from 'src/products/schema/boutique-product.schema';
import { Product } from 'src/products/schema/products.schema';
//import { Cart, CartSchema } from './user-cart.schema';

export type UserDocument = HydratedDocument<User>;

export type Cart = {
  storedProducts: StoredProduct[];
  totalPrice: number;
};

export enum UserRole {
  Customer = '100',
  BrandAdmin = '200',
  BrandChiefAdmin = '201',
  SuperAdmin = '300',
}

export enum registerType {
  google = 'google',
  naver = 'naver',
  local = 'local',
  github = 'github',
  kakao = 'kakao',
}
@Schema()
export class User {
  _id: Types.ObjectId;

  @Prop({ unique: true })
  uid: string;

  @Prop()
  name: string;

  @Prop({ unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  userRole: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }])
  likes: Product[];

  @Prop({
    _id: false,
    type: mongoose.Schema.Types.Mixed,
    ref: 'BoutiqueProduct',
    default: { storedProducts: [], totalPrice: 0 },
  })
  cart: Cart;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  brand: Brand;
}

export const UserSchema = SchemaFactory.createForClass(User);
