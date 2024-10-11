import { HttpException, Injectable } from '@nestjs/common';
import {
  DataWithPagination,
  SuccessResponse,
} from 'src/shared/interfaces/interface';
import { DbService } from 'src/shared/services/db.service';
import { PostResponse } from './interface/post.interface';
import { GetPostsDto } from './dto/get-posts.dto';
import { PostStatus, Prisma } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private readonly dbService: DbService) {}

  async findAll(
    userId: number,
    dto: GetPostsDto,
    includeUserId = false,
  ): Promise<DataWithPagination<PostResponse>> {
    const getOrderBy = () => {
      switch (dto.orderBy) {
        case 'likes':
          return {
            Like: {
              _count: dto.order,
            },
          };
        case 'comments':
          return { Comment: { _count: dto.order } };
        default:
          return { createdAt: dto.order };
      }
    };

    const posts = await this.dbService.post.findMany({
      where: {
        status: PostStatus.ACTIVE,
        ...(includeUserId && { author: { id: userId } }),
      },
      include: {
        _count: {
          select: {
            Like: true,
            Comment: true,
          },
        },
        PostCategory: {
          select: {
            category: true,
          },
        },
        author: true,
        ...(userId && { Like: { where: { userId } } }),
      },
      orderBy: getOrderBy(),
      skip: dto.limit * (dto.page - 1),
      take: dto.limit,
    });
    const total = await this.dbService.post.count();

    const mappedPosts: PostResponse[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
      },
      categories: post.PostCategory.map(({ category }) => ({
        id: category.id,
        title: category.title,
      })),
      comments: post._count.Comment,
      likes: post._count.Like,
      likedByMe: !!post.Like?.length,
      createdAt: post.createdAt,
    }));

    return {
      data: mappedPosts,
      pagination: {
        page: dto.page,
        total,
      },
    };
  }

  async findById(id: number, userId?: number) {
    const post = await this.dbService.post.findFirst({
      where: {
        id: id,
        status: PostStatus.ACTIVE,
      },
      include: {
        _count: {
          select: {
            Like: true,
            Comment: true,
          },
        },
        PostCategory: {
          select: {
            category: true,
          },
        },
        author: true,
        ...(userId && { Like: { where: { userId } } }),
      },
    });

    if (!post) {
      return null;
    }

    const mappedPost: PostResponse = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
      },
      categories: post.PostCategory.map(({ category }) => ({
        id: category.id,
        title: category.title,
      })),
      comments: post._count.Comment,
      likes: post._count.Like,
      likedByMe: !!post.Like?.length,
      createdAt: post.createdAt,
    };

    return mappedPost;
  }

  async create(dto: CreatePostDto, userId: number) {
    const post = await this.dbService.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        author: { connect: { id: userId } },
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        createdAt: true,
      },
    });

    return post;
  }

  async update(id: number, dto: UpdatePostDto, userId: number) {
    try {
      const post = await this.dbService.post.update({
        where: {
          id,
          author: {
            id: userId,
          },
        },
        data: dto,
        select: {
          id: true,
          title: true,
          content: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          createdAt: true,
        },
      });

      return post;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new HttpException('Post not found', 404);
        }
      }

      throw e;
    }
  }

  async delete(id: number, userId: number): Promise<SuccessResponse> {
    try {
      await this.dbService.post.delete({
        where: {
          id,
          author: {
            id: userId,
          },
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException('Post not found', 404);
        }
      }

      throw error;
    }
  }
}
