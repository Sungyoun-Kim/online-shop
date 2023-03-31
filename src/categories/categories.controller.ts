import {
  BadRequestException,
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
import { InjectConnection } from '@nestjs/mongoose';
import { Response, urlencoded } from 'express';
import { Connection } from 'mongoose';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Post()
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Res() res: Response,
  ) {
    const category = await this.categoryService.findCategoryById(
      createCategoryDto._id,
    );
    if (category) {
      throw new BadRequestException('카테고리 이름이 이미 존재합니다');
    }
    const result = await this.categoryService.createCategory(createCategoryDto);

    res.status(201).json(result);
  }

  @Patch('super/:superCategoryId/sub/:subOrdinateCategoryId')
  async insertSubordinateCategory(
    @Param('superCategoryId') superCategoryId: string,
    @Param('subOrdinateCategoryId') subOrdinateCategoryId: string,
    @Res() res: Response,
  ) {
    await this.categoryService.insertSubCategory(
      superCategoryId,
      subOrdinateCategoryId,
    );
    res.status(204).end();
  }

  @Delete(':categoryId')
  async deleteCategory(
    @Param('categoryId') categoryId: string,
    @Res() res: Response,
  ) {
    const category = await this.categoryService.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundException('삭제하려는 카테고리가 존재하지 않습니다');
    }

    await this.categoryService.deleteCategoryAndAllDescendant(category);
    res.status(204).end();
  }

  @Patch(':categoryId')
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Res() res: Response,
  ) {
    const category = await this.categoryService.findCategoryById(categoryId);

    if (!category) {
      throw new NotFoundException('삭제하려는 카테고리가 존재하지 않습니다');
    }
    await this.categoryService.updateCategory(category, updateCategoryDto);
  }
}
