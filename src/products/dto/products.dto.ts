import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Types } from 'mongoose';
import { Category } from 'src/categories/schema/categories.schema';

export class FindProductsByFilterDto {
  @IsOptional()
  @Matches(
    /^(([a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣]+\s?[a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣]|[a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣])(=?\,{0,1}))+$/,
  )
  category: string[] | string;

  @IsOptional()
  @Matches(/^(([a-zA-Z]+\s?[a-zA-Z]|[a-zA-Z])(=?\,{0,1}))+$/)
  brand: string[];

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  lessPrice: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  morePrice: number;
}

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @Matches(/^[0-9a-fA-F]{24}$/)
  brand: Types.ObjectId;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  thumbnail: string;

  @IsOptional()
  @IsString({ each: true })
  images: string[] = [];
}
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  thumbnail: string;

  @IsOptional()
  @IsString({ each: true })
  images: string[] = [];
}

export class CreateBoutiqueDto {
  @IsString()
  name: string;
}

export class CreateBoutiqueProductDto {
  @IsString()
  size: string;

  @IsInt()
  quantity: number;

  @IsInt()
  price: number;

  @Matches(/^[0-9a-fA-F]{24}$/)
  boutique: Types.ObjectId;

  @IsOptional()
  sku: string;
}

export class UpdateBoutiqueProductDto {
  @IsString()
  @IsOptional()
  size: string;

  @IsInt()
  @IsOptional()
  quantity: number;

  @IsInt()
  @IsOptional()
  price: number;
}
