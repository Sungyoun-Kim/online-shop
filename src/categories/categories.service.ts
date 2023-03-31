import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { Category, CategoryDocument } from './schema/categories.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findCategoryById(categoryId: string) {
    const result = await this.categoryModel.findOne({ _id: categoryId });
    return result;
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const createdCategory = //카테고리를 생성한다. path는 ,로 설정
        (
          await this.categoryModel.create(
            [
              {
                _id: createCategoryDto._id,
                path: ',',
              },
            ],
            { session },
          )
        )[0];

      const categories = await this.categoryModel.find(); //모든 카테고리 조회

      if (createCategoryDto.parent) {
        //생성하고자 하는 노드의 부모를 설정했다면 카테고리에서 찾는다.
        const parentCategory = categories.find(
          (category) => category._id === createCategoryDto.parent,
        );

        if (parentCategory) {
          //있으면 path를 변경하고 저장.
          createdCategory.path = parentCategory.path + parentCategory._id + ',';
          await createdCategory.save({ session });
        } else {
          //없으면 에러
          throw new BadRequestException('부모 카테고리가 존재하지 않습니다.');
        }
      }
      await session.commitTransaction();
      return createdCategory;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async insertSubCategory(superCategoryId: string, subCategoryId: string) {
    const categories = await this.categoryModel.find(); //모든 카테고리 조회

    const superiorCategory = categories.find(
      (category) => category._id === superCategoryId,
    );
    if (!superiorCategory) {
      throw new NotFoundException('상위 카테고리가 존재하지 않습니다.');
    }

    const subordinateCategory = categories.find(
      (category) => category._id === subCategoryId,
    );

    if (!subordinateCategory) {
      throw new NotFoundException('하위 카테고리가 존재하지 않습니다');
    }

    const beforeSubordinateCategoryPath = subordinateCategory.path; // 추후 정규식 사용을 위해 변수에 저장

    const descendants = await this.findAllDescendantCategory(
      // 삽입할 노드의 모든 하위 노드를 가져온다.
      subordinateCategory._id,
    );

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      subordinateCategory.path = // 하위 카테고리 노드의 path를 수정한다.
        superiorCategory.path + superiorCategory._id + ',';

      await subordinateCategory.save({ session });
      if (descendants.length > 0) {
        //서브카테고리에 후손이 존재한다면
        for (const descendant of descendants) {
          // 모든 후손의 category를 알맞게 갱신하고 저장한다.
          let pathRegex = beforeSubordinateCategoryPath.replace(/\,/g, '\\,'); //정규식 사용을 위해 ,를 \,로 바꿔준다
          pathRegex = pathRegex.replace(/\-/g, '\\-');

          descendant.path = descendant.path.replace(
            // 후손의 기존 path를 갱신한다
            new RegExp(pathRegex),
            subordinateCategory.path,
          );

          await descendant.save({ session });
        }
      }

      await session.commitTransaction();
      return subordinateCategory;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async findAllDescendantCategory(path: string) {
    const result = await this.categoryModel.find({
      path: { $regex: path },
    });

    return result;
  }
  async deleteCategoryAndAllDescendant(category: Category) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.categoryModel.deleteOne({ _id: category._id }, { session });
      await this.categoryModel
        .deleteMany({ path: { $regex: category._id } }, { session })
        .exec();

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async findAllChildrenOfCategory(path: string) {
    const result = await this.categoryModel.find({
      path: path,
    });
    return result;
  }

  async updateCategory(
    category: CategoryDocument,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const descendants = await this.findAllDescendantCategory(
        // 삽입할 노드의 모든 하위 노드를 가져온다.
        category._id,
      );

      const beforeCategoryId = category._id;
      category._id = updateCategoryDto._id;

      // 버그가 존재. _id 를 수정할 수 없는데 카테고리 이름을 수정하려해서 에러가 난다.
      // 그래서 update말고 새로 생성하고 기존 _id를 가진 카테고리를 제거하였음
      category.isNew = true;
      await category.save({ session });
      await this.categoryModel.deleteOne(
        { _id: beforeCategoryId },
        { session },
      );

      if (descendants.length > 0) {
        //수정하려는 카테고리의 후손이 존재한다면
        for (const descendant of descendants) {
          // 모든 후손의 category를 알맞게 갱신하고 저장한다.
          let pathRegex = beforeCategoryId;
          pathRegex = pathRegex.replace(/\-/g, '\\-'); //정규식 사용을 위해 -를 \-로 바꿔준다

          descendant.path = descendant.path.replace(
            // 후손의 기존 path를 갱신한다
            new RegExp(pathRegex),
            category._id,
          );

          await descendant.save({ session });
        }
      }
      await session.commitTransaction();
      return category;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
