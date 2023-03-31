import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import { BoutiqueProduct } from 'src/products/schema/boutique-product.schema';
import { Shipment } from 'src/shipments/schema/shipments.schema';
import { Cart, User, UserSchema } from 'src/users/schema/users.schema';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  Processing = 0,
  ReadyToShip = 1,
  OnShipping = 2,
  ShippingComplete = 3,
}
@Schema()
export class Order {
  _id: Types.ObjectId;

  @Prop({ type: UserSchema })
  user: User;

  @Prop({
    _id: false,
    type: mongoose.Schema.Types.Mixed,
    ref: 'BoutiqueProduct',
  })
  cart: Cart;

  @Prop({ default: OrderStatus.Processing })
  orderStatus: OrderStatus;

  @Prop()
  address: string;

  @Prop({ default: null })
  trakingNumber: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
