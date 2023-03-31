import { Injectable, Param } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import {
  CreateBoutiqueProductDto,
  CreateProductDto,
  FindProductsByFilterDto,
  UpdateBoutiqueProductDto,
  UpdateProductDto,
} from './dto/products.dto';
import { Boutique, BoutiqueDocument } from './schema/boutique.schema';
import {
  BoutiqueProduct,
  BoutiqueProductDocument,
} from './schema/boutique-product.schema';

import { Product, ProductDocument } from './schema/products.schema';
import { User, UserDocument } from 'src/users/schema/users.schema';
// import {
//   UserProductLike,
//   UserProductLikeDocument,
// } from 'src/users/schema/user-product-like.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(BoutiqueProduct.name)
    private readonly boutiqueProductModel: Model<BoutiqueProductDocument>,
    @InjectModel(Boutique.name)
    private readonly boutiqueModel: Model<BoutiqueDocument>,
    @InjectConnection() private readonly connection: Connection, // @InjectModel(User.name) private readonly userModel: Model<UserDocument>, // @InjectModel(UserProductLike.name) // private readonly userProductLikeModel: Model<UserProductLikeDocument>,
  ) {}

  async createBoutique(createBoutiqueDto: any) {
    const result = await this.boutiqueModel.create(createBoutiqueDto);
    return result;
  }

  async findBoutiqueById(boutiqueId: any) {
    const result = await this.boutiqueModel.findOne({ _id: boutiqueId });
    return result;
  }

  async createProduct(createProductDto: CreateProductDto) {
    const result = await this.productModel.create(createProductDto);
    return result;
  }
  async updateProduct(
    productId: Types.ObjectId,
    updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productModel.findOneAndUpdate(
      { _id: productId },
      updateProductDto,
    );
    return result;
  }

  async findProductBySKU(sku: string) {
    const result = await this.productModel.findOne({ sku: sku });
    return result;
  }
  async findProductById(productId: Types.ObjectId) {
    const result = await this.productModel
      .findOne({ _id: productId })
      .populate({
        path: 'brand',
        model: 'Brand',
        select: 'name',
      });

    return result;
  }
  async findLowestPriceBoutiqueProductBySKU(sku: string) {
    const result = await this.boutiqueProductModel.aggregate([
      { $match: { sku: sku, quantity: { $gt: 0 } } },

      {
        $group: {
          _id: '$size',
          price: { $min: '$price' },
        },
      },
    ]);
    return result;
  }

  async upsertBoutiqueProduct(
    createBoutiqueProductDto: CreateBoutiqueProductDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await this.boutiqueProductModel.findOneAndUpdate(
        {
          sku: createBoutiqueProductDto.sku,
          boutique: createBoutiqueProductDto.boutique,
          size: createBoutiqueProductDto.size,
        },
        createBoutiqueProductDto,
        { upsert: true, new: true, session },
      );
      const product = await this.productModel.findOne({
        sku: createBoutiqueProductDto.sku,
      });
      if (!product.lowestPrice || result.price < product.lowestPrice) {
        await this.productModel.findOneAndUpdate(
          { sku: createBoutiqueProductDto.sku },
          { $set: { lowestPrice: result.price } },
          { session },
        );
      }

      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async findProductsByFilter(findProductByFilterDto: FindProductsByFilterDto) {
    const matchObj = {};
    console.log(findProductByFilterDto);
    Object.keys(findProductByFilterDto).map((key) => {
      switch (key) {
        case 'category': {
          if (findProductByFilterDto['category']) {
            const arrayCategory = findProductByFilterDto['category'];
            findProductByFilterDto['category'] = findProductByFilterDto[
              'category'
            ]
              .toString()
              .replace(/\,/g, '|');

            matchObj['$or'] = [
              {
                'category.path': {
                  $regex: findProductByFilterDto['category'],
                },
              },
              { 'category._id': { $in: arrayCategory } },
            ];
          }
          break;
        }
        case 'name': {
          if (findProductByFilterDto['name']) {
            matchObj['name'] = { $regex: findProductByFilterDto['name'][0] };
          }
        }
        case 'brand': {
          if (findProductByFilterDto['brand']) {
            matchObj['brand'] = { $in: findProductByFilterDto['brand'] };
          }
          break;
        }
        case 'lessPrice': {
          if (findProductByFilterDto['lessPrice']) {
            matchObj['lowestPrice'] = {
              $lte: findProductByFilterDto['lessPrice'][0],
            };
          }
          break;
        }
        case 'morePrice':
          {
            if (findProductByFilterDto['morePrice']) {
              matchObj['lowestPrice'] = {
                $gte: findProductByFilterDto['morePrice'][0],
              };
            }
          }
          break;
      }
    });

    const result = await this.productModel.aggregate([
      //paginate는 고려하지 않음
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      { $set: { brand: { $first: '$brand.name' } } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $set: { category: { $first: '$category' } } },

      { $match: matchObj },
    ]);
    return result;
  }

  async findBoutiqueProductById(boutiqueProductId: Types.ObjectId) {
    const result = await this.boutiqueProductModel.findOne({
      _id: boutiqueProductId,
    });
    return result;
  }

  async updateBoutiqueProduct(
    boutiqueProductId: Types.ObjectId,
    updateBoutiqueProductDto: UpdateBoutiqueProductDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await this.boutiqueProductModel.findOneAndUpdate(
        boutiqueProductId,

        updateBoutiqueProductDto,
        { session },
      );
      const product = await this.productModel.findOne({
        sku: result.sku,
      });

      if (
        //기존 최저가였다면
        updateBoutiqueProductDto.price &&
        product &&
        product.lowestPrice == result.price
      ) {
        const lowestPriceProduct = await this.boutiqueProductModel
          .findOne({ sku: result.sku })
          .sort({ price: 1 })
          .limit(1);

        if (lowestPriceProduct.price > updateBoutiqueProductDto.price) {
          //더 싸졌다면
          product.lowestPrice = updateBoutiqueProductDto.price;
        } else {
          //더 싼게 있다면
          product.lowestPrice = lowestPriceProduct.price;
        }

        await product.save({ session });
      }

      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async deleteProductById(productId: Types.ObjectId) {
    const result = await this.productModel.deleteOne({ _id: productId });
    return result;
  }
  async deleteBoutiqueProductById(boutiqueProductId: Types.ObjectId) {
    const result = await this.boutiqueProductModel.deleteOne({
      _id: boutiqueProductId,
    });
    return result;
  }

  async likeProduct(user: UserDocument, product: ProductDocument) {
    user.likes.push(product);
    await user.save();
    return user;
  }

  async unlikeProduct(user: UserDocument, product: ProductDocument) {
    user.likes = user.likes.filter((like) => {
      return !like._id.equals(product._id);
    });
    await user.save();
    return user;
  }

  async putProductInCart(
    user: UserDocument,
    boutiqueProduct: BoutiqueProduct,
    quantity: number,
  ) {
    user.cart.storedProducts.push({
      boutiqueProduct: boutiqueProduct._id,
      quantity: quantity,
    });
    user.cart.totalPrice =
      user.cart.totalPrice + boutiqueProduct.price * quantity;
    user.markModified('cart');
    await user.save();
    return user;
  }
  async removeProductFromCart(
    user: UserDocument,
    boutiqueProduct: BoutiqueProduct,
  ) {
    const targetProduct = user.cart.storedProducts.find((product) =>
      product.boutiqueProduct._id.equals(boutiqueProduct._id),
    );

    user.cart.storedProducts = user.cart.storedProducts.filter(
      (product) => !product.boutiqueProduct._id.equals(boutiqueProduct._id),
    );
    user.cart.totalPrice =
      user.cart.totalPrice - boutiqueProduct.price * targetProduct.quantity;

    user.markModified('cart');
    await user.save();
    return user;
  }
}
