import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Brand, BrandSchema } from 'src/brands/schema/brands.schema';
import { User } from 'src/users/schema/users.schema';

export type CategoryDocument = HydratedDocument<Category>;

@Schema()
export class Category {
  @Prop()
  _id: string;

  @Prop({ type: mongoose.Schema.Types.String })
  path: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
