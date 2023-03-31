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
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Types } from 'mongoose';
import { CategoriesService } from 'src/categories/categories.service';
import { UsersService } from 'src/users/users.service';
import {
  CommaToArrayPipe,
  StringToObjectIdPipe,
} from 'src/utility/pipe.utility';

import {
  CreateBoutiqueDto,
  CreateBoutiqueProductDto,
  CreateProductDto,
  FindProductsByFilterDto,
  UpdateBoutiqueProductDto,
  UpdateProductDto,
} from './dto/products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productService: ProductsService,
    private readonly categoryService: CategoriesService,
    private readonly userService: UsersService,
  ) {}

  @Post('boutique')
  async createBoutique(
    @Body() createBoutiqueDto: CreateBoutiqueDto,
    @Res() res: Response,
  ) {
    const result = await this.productService.createBoutique(createBoutiqueDto);
    res.status(201).json(result);
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 3 },
    ]),
  )
  @Post()
  async createProduct(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File;
      images?: Express.Multer.File[];
    },
    @Body() createProductDto: CreateProductDto,
    @Res() res: Response,
  ) {
    createProductDto.brand = new Types.ObjectId(createProductDto.brand);

    const category = await this.categoryService.findCategoryById(
      createProductDto.category,
    );

    if (!category) {
      throw new BadRequestException('올바르지 않은 카테고리입니다');
    }

    const product = await this.productService.findProductBySKU(
      createProductDto.sku,
    );
    if (product) {
      throw new BadRequestException(
        '제품이 이미 존재합니다. 재고만 입력해주세요',
      );
    }

    if (files.thumbnail[0].path) {
      createProductDto.thumbnail = files.thumbnail[0].path;
    }
    if (files.images.length > 0) {
      files.images.map((image) => createProductDto.images.push(image.path));
    }

    const result = await this.productService.createProduct(createProductDto);
    res.status(201).json(result);
  }
  @Post('sku/:sku/boutique')
  async createBoutiqueProduct(
    @Param('sku')
    sku: string,

    @Body() createBoutiqueProductDto: CreateBoutiqueProductDto,
    @Res() res: Response,
  ) {
    const product = await this.productService.findProductBySKU(sku);
    if (!product) {
      throw new BadRequestException(
        '존재하지 않는 상품입니다. 상품 등록 문의 부탁드립니다',
      );
    }
    createBoutiqueProductDto.sku = sku;

    const boutique = await this.productService.findBoutiqueById(
      createBoutiqueProductDto.boutique,
    );
    if (!boutique) {
      throw new BadRequestException('존재하지 않는 부티크입니다.');
    }
    createBoutiqueProductDto.boutique = new Types.ObjectId(
      createBoutiqueProductDto.boutique,
    );
    const result = await this.productService.upsertBoutiqueProduct(
      createBoutiqueProductDto,
    );
    res.status(201).json(result);
  }

  @Get()
  async findProductsByFilter(
    @Query(CommaToArrayPipe) findProductByFilterDto: FindProductsByFilterDto,
    @Res() res: Response,
  ) {
    const result = await this.productService.findProductsByFilter(
      findProductByFilterDto,
    );

    res.status(200).json(result);
  }

  @Get(':productId')
  async findProductById(
    @Param('productId', StringToObjectIdPipe)
    productId: Types.ObjectId & string,
    @Res() res: Response,
  ) {
    const product = await this.productService.findProductById(productId);
    const lowestPriceBoutiqueProduct =
      await this.productService.findLowestPriceBoutiqueProductBySKU(
        product.sku,
      );

    res.status(200).json({ product, lowestPriceBoutiqueProduct });
  }

  @Patch('boutique/:boutiqueProductId')
  async updateBoutiqueProductById(
    @Param('boutiqueProductId', StringToObjectIdPipe)
    boutiqueProductId: string & Types.ObjectId,
    @Body() updateBoutiqueProductDto: UpdateBoutiqueProductDto,
    @Res() res: Response,
  ) {
    const boutiqueProduct = await this.productService.findBoutiqueProductById(
      boutiqueProductId,
    );
    if (!boutiqueProduct) {
      throw new NotFoundException('업데이트 하려는 상품이 존재하지 않습니다');
    }
    await this.productService.updateBoutiqueProduct(
      boutiqueProductId,
      updateBoutiqueProductDto,
    );
    res.status(200).end();
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 3 },
    ]),
  )
  @Patch(':productId')
  async updateProductById(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File;
      images?: Express.Multer.File[];
    },

    @Param('productId', StringToObjectIdPipe)
    productId: string & Types.ObjectId,
    @Body() updateProductDto: UpdateProductDto,
    @Res() res: Response,
  ) {
    const product = await this.productService.findProductById(productId);
    if (!product) {
      throw new NotFoundException('업데이트하려는 상품이 존재하지 않습니다');
    }
    if (files && files.thumbnail) {
      updateProductDto.thumbnail = files.thumbnail[0].path;
    }
    if (files && files.images) {
      files.images.map((image) => updateProductDto.images.push(image.path));
    }
    await this.productService.updateProduct(productId, updateProductDto);
    res.status(204).end();
  }

  @Delete('boutique/:boutiqueProductId')
  async deleteBoutiqueProductById(
    @Param('boutiqueProductId', StringToObjectIdPipe)
    boutiqueProductId: string & Types.ObjectId,

    @Res() res: Response,
  ) {
    const boutiqueProduct = await this.productService.findBoutiqueProductById(
      boutiqueProductId,
    );
    if (!boutiqueProduct) {
      throw new NotFoundException('삭제하려는 상품이 존재하지 않습니다');
    }
    await this.productService.deleteBoutiqueProductById(boutiqueProductId);

    res.status(204).end();
  }

  @Delete(':productId')
  async deleteProductById(
    @Param('productId', StringToObjectIdPipe)
    productId: string & Types.ObjectId,
    @Res() res: Response,
  ) {
    const product = await this.productService.findProductById(productId);
    if (!product) {
      throw new NotFoundException('삭제하려는 상품이 존재하지 않습니다');
    }
    await this.productService.deleteProductById(productId);
    res.status(204).end();
  }

  @Post(':productId/like')
  async likeProduct(
    @Req() req: Express.Request,
    @Param('productId', StringToObjectIdPipe)
    productId: Types.ObjectId & string,
    @Res() res: Response,
  ) {
    const product = await this.productService.findProductById(productId);
    if (!product) {
      throw new NotFoundException('좋아요를 누른 상품이 존재하지 않습니다');
    }
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('다시 로그인을 해주시기 바랍니다');
    }
    const result = await this.productService.likeProduct(user, product);
    res.status(201).json(result);
  }

  @Delete(':productId/unlike')
  async unlikeProduct(
    @Req() req: Express.Request,
    @Param('productId', StringToObjectIdPipe)
    productId: Types.ObjectId & string,
    @Res() res: Response,
  ) {
    const product = await this.productService.findProductById(productId);
    if (!product) {
      throw new NotFoundException(
        '좋아요를 취소하려는 상품이 존재하지 않습니다',
      );
    }
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('다시 로그인을 해주시기 바랍니다');
    }
    const result = await this.productService.unlikeProduct(user, product);
    res.status(201).json(result);
  }

  @Post('boutique/:boutiqueProductId/cart')
  async putProductInCart(
    @Req() req: Express.Request,
    @Param('boutiqueProductId') boutiqueProductId: Types.ObjectId & string,
    @Query('quantity') quantity: number,
    @Res() res: Response,
  ) {
    const boutiqueProduct = await this.productService.findBoutiqueProductById(
      boutiqueProductId,
    );
    if (!boutiqueProduct) {
      throw new NotFoundException(
        '장바구니에 담으려는 상품이 존재하지 않습니다',
      );
    }
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('다시 로그인을 해주시기 바랍니다');
    }

    if (
      user.cart.storedProducts.find((product) =>
        product.boutiqueProduct._id.equals(boutiqueProduct._id),
      )
    ) {
      throw new NotFoundException('장바구니에 담으려는 상품이 이미 존재합니다');
    }

    const result = await this.productService.putProductInCart(
      user,
      boutiqueProduct,
      quantity,
    );

    res.status(201).json(result);
  }

  @Delete('boutique/:boutiqueProductId/cart')
  async removeProductFromCart(
    @Req() req: Express.Request,
    @Param('boutiqueProductId') boutiqueProductId: Types.ObjectId & string,
    @Res() res: Response,
  ) {
    const boutiqueProduct = await this.productService.findBoutiqueProductById(
      boutiqueProductId,
    );
    if (!boutiqueProduct) {
      throw new NotFoundException(
        '장바구니에 담으려는 상품이 존재하지 않습니다',
      );
    }
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('다시 로그인을 해주시기 바랍니다');
    }
    if (
      !user.cart.storedProducts.find((product) =>
        product.boutiqueProduct._id.equals(boutiqueProduct._id),
      )
    ) {
      throw new NotFoundException('장바구니에서 제거하려는 상품이 없습니다');
    }
    await this.productService.removeProductFromCart(user, boutiqueProduct);

    res.status(204).end();
  }
}
