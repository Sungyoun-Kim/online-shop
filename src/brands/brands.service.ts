import { Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBrandDto, UpdateBrandDto } from './dto/brands.dto';
import { Brand, BrandDocument } from './schema/brands.schema';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
  ) {}

  async createBrand(createBrandDto: CreateBrandDto) {
    const result = await this.brandModel.create(createBrandDto);
    return result;
  }
  async updateBrand(brandId: Types.ObjectId, updateBrandDto: UpdateBrandDto) {
    const result = await this.brandModel.updateOne(
      { _id: brandId },
      updateBrandDto,
    );
    return result;
  }
  async deleteBrand(brandId: Types.ObjectId) {
    const result = await this.brandModel.deleteOne({ _id: brandId });
    return result;
  }
  async findBrandById(brandId: Types.ObjectId) {
    const result = await this.brandModel.findOne({ _id: brandId });
    return result;
  }
}
