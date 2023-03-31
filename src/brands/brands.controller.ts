import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { StringToObjectIdPipe } from 'src/utility/pipe.utility';
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brands.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandService: BrandsService) {}

  @Post()
  async createBrand(
    @Body() createBrandDto: CreateBrandDto,
    @Res() res: Response,
  ) {
    const result = await this.brandService.createBrand(createBrandDto);
    res.status(201).json(result);
  }

  @Patch('/:brandId')
  async updateBrand(
    @Param('brandId', StringToObjectIdPipe) brandId: Types.ObjectId & string,
    @Body() updateBrandDto: UpdateBrandDto,
    @Res() res: Response,
  ) {
    const brand = await this.brandService.findBrandById(brandId);
    if (!brand) {
      throw new NotFoundException(
        '업데이트를 시도한 브랜드가 존재하지 않습니다',
      );
    }
    const result = await this.brandService.updateBrand(brandId, updateBrandDto);
    res.status(201).json(result);
  }

  @Delete('/:brandId')
  async deleteBrand(
    @Param('brandId', StringToObjectIdPipe) brandId: Types.ObjectId & string,
    @Res() res: Response,
  ) {
    const brand = await this.brandService.findBrandById(brandId);
    if (!brand) {
      throw new NotFoundException('삭제를 시도한 브랜드가 존재하지 않습니다');
    }
    await this.brandService.deleteBrand(brandId);
    res.status(204).end;
  }
}
