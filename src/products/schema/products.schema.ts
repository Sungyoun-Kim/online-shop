import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import { Category } from 'src/categories/schema/categories.schema';
import { User } from 'src/users/schema/users.schema';
import { BoutiqueProduct } from './boutique-product.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema()
export class Product {
  _id: Types.ObjectId;

  @Prop({ unique: true })
  sku: string;

  @Prop()
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' })
  brand: Brand;

  @Prop()
  description: string;

  @Prop()
  thumbnail: string;

  @Prop()
  images: string[];

  @Prop({ type: mongoose.Schema.Types.String, ref: 'Category' })
  category: Category;

  @Prop()
  lowestPrice: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
