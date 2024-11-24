import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DataWithPagination,
  SuccessResponse,
} from 'src/shared/interfaces/interface';
import { DbService } from 'src/shared/services/db.service';
import { PostResponse } from './interface/post.interface';
import { GetPostsDto } from './dto/get-posts.dto';
import { ContentStatus, Prisma } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private readonly dbService: DbService) {}

  async findAll(
    authUserId: number,
    dto: GetPostsDto,
    includeUserId = false,
  ): Promise<DataWithPagination<PostResponse>> {
    const getOrderBy = () => {
      switch (dto.orderBy) {
        case 'rating':
          return { rating: dto.order };
        case 'comments':
          return { Comment: { _count: dto.order } };
        default:
          return { id: dto.order };
      }
    };

    const [posts, total] = await this.dbService.$transaction([
      this.dbService.post.findMany({
        where: {
          isBlocked: false,
          author: {
            id: dto.userId,
          },
          ...(!includeUserId && { status: ContentStatus.ACTIVE }),
          ...(includeUserId && dto.status && { status: dto.status }),
          ...(includeUserId && { author: { id: authUserId } }),
          ...(dto.categoryId && {
            PostCategory: {
              some: {
                category: {
                  id: dto.categoryId,
                },
              },
            },
          }),
          ...((dto.fromDate || dto.toDate) && {
            createdAt: {
              gte: dto.fromDate,
              lte: dto.toDate,
            },
          }),
        },
        include: {
          _count: {
            select: {
              Comment: true,
            },
          },
          PostCategory: {
            select: {
              category: true,
            },
          },
          author: true,
          ...(authUserId && {
            Reaction: {
              where: {
                User: {
                  id: authUserId,
                },
              },
              select: {
                type: true,
              },
            },
          }),
          ...(authUserId && { Favorite: { where: { userId: authUserId } } }),
        },
        orderBy: getOrderBy(),
        skip: dto.limit * (dto.page - 1),
        take: dto.limit,
      }),
      this.dbService.post.count({
        where: {
          author: {
            id: dto.userId,
          },
          ...(!includeUserId && { status: ContentStatus.ACTIVE }),
          isBlocked: false,
          ...(includeUserId && { author: { id: authUserId } }),
          ...(includeUserId && dto.status && { status: dto.status }),
          ...(dto.categoryId && {
            PostCategory: { some: { category: { id: dto.categoryId } } },
          }),
          ...((dto.fromDate || dto.toDate) && {
            createdAt: {
              gte: dto.fromDate,
              lte: dto.toDate,
            },
          }),
        },
      }),
    ]);

    const mappedPosts: PostResponse[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
        profilePicture: post.author.profilePicture,
      },
      categories: post.PostCategory.map(({ category }) => ({
        id: category.id,
        title: category.title,
      })),
      comments: post._count.Comment,
      rating: post.rating,
      myAction: post.Reaction?.[0]?.type || null,
      favorite: post.Favorite?.length > 0,
      createdAt: post.createdAt,
      ...(includeUserId && {
        status: post.status,
      }),
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
        isBlocked: false,
      },
      include: {
        _count: {
          select: {
            Comment: true,
          },
        },
        PostCategory: {
          select: {
            category: true,
          },
        },
        author: true,
        ...(userId && {
          Reaction: {
            where: {
              userId,
            },
            select: {
              type: true,
            },
          },
        }),
        ...(userId && { Favorite: { where: { userId } } }),
      },
    });

    const isUserAuthor = post?.author.id === userId;

    if (!post) {
      return null;
    }

    if (post.status === ContentStatus.INACTIVE && !isUserAuthor) {
      throw new NotFoundException('Post not found');
    }

    const mappedPost: PostResponse = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
        profilePicture: post.author.profilePicture,
      },
      categories: post.PostCategory.map(({ category }) => ({
        id: category.id,
        title: category.title,
      })),
      comments: post._count.Comment,
      rating: post.rating,
      myAction: post.Reaction?.[0]?.type || null,
      favorite: post.Favorite?.length > 0,
      createdAt: post.createdAt,
      ...(isUserAuthor && { status: post.status }),
    };

    return mappedPost;
  }

  async create(dto: CreatePostDto, userId: number) {
    try {
      const post = await this.dbService.$transaction(async (tx) => {
        const post = await tx.post.create({
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
                profilePicture: true,
              },
            },
            createdAt: true,
          },
        });

        await tx.postCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            postId: post.id,
            categoryId,
          })),
        });

        return post;
      });

      return {
        data: {
          id: post.id,
        },
        success: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new HttpException('Category not found', 404);
        }
      }
    }
  }

  async update(id: number, dto: UpdatePostDto, userId: number) {
    try {
      const post = await this.dbService.$transaction(async (tx) => {
        const post = await tx.post.update({
          where: {
            id,
            author: {
              id: userId,
            },
          },
          data: {
            title: dto.title,
            content: dto.content,
            status: dto.status,
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

        await tx.postCategory.deleteMany({
          where: {
            postId: id,
          },
        });

        await tx.postCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            postId: id,
            categoryId,
          })),
        });

        return post;
      });

      return {
        success: true,
        data: {
          id: post.id,
        },
      };
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
          isBlocked: false,
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

  async findFavorites(
    authUserId: number,
    dto: GetPostsDto,
    includeUserId = false,
  ): Promise<DataWithPagination<PostResponse>> {
    const [posts, total] = await this.dbService.$transaction([
      this.dbService.post.findMany({
        where: {
          isBlocked: false,
          status: ContentStatus.ACTIVE,
          Favorite: {
            some: {
              userId: authUserId,
            },
          },
          ...((dto.fromDate || dto.toDate) && {
            createdAt: {
              gte: dto.fromDate,
              lte: dto.toDate,
            },
          }),
        },
        include: {
          _count: {
            select: {
              Comment: true,
            },
          },
          PostCategory: {
            select: {
              category: true,
            },
          },
          author: true,
          ...(authUserId && {
            Reaction: {
              where: {
                User: {
                  id: authUserId,
                },
              },
              select: {
                type: true,
              },
            },
          }),
          ...(authUserId && { Favorite: { where: { userId: authUserId } } }),
        },
        skip: dto.limit * (dto.page - 1),
        take: dto.limit,
      }),
      this.dbService.post.count({
        where: {
          isBlocked: false,
          status: ContentStatus.ACTIVE,
          Favorite: {
            some: {
              userId: authUserId,
            },
          },
          ...((dto.fromDate || dto.toDate) && {
            createdAt: {
              gte: dto.fromDate,
              lte: dto.toDate,
            },
          }),
        },
      }),
    ]);

    const mappedPosts: PostResponse[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
        profilePicture: post.author.profilePicture,
      },
      categories: post.PostCategory.map(({ category }) => ({
        id: category.id,
        title: category.title,
      })),
      comments: post._count.Comment,
      rating: post.rating,
      myAction: post.Reaction?.[0]?.type || null,
      favorite: post.Favorite.length > 0,
      createdAt: post.createdAt,
      ...(includeUserId && {
        status: post.status,
      }),
    }));

    return {
      data: mappedPosts,
      pagination: {
        page: dto.page,
        total,
      },
    };
  }

  async setFavorite(userId: number, postId: number) {
    await this.dbService.$transaction(async (tx) => {
      const post = await tx.post.findFirst({
        where: {
          id: postId,
          isBlocked: false,
          status: ContentStatus.ACTIVE,
        },
      });

      if (!post) {
        throw new HttpException('Post not found', 404);
      }

      const exists = await tx.favorite.findFirst({
        where: {
          postId,
          userId,
        },
      });

      if (exists) {
        throw new HttpException('Already favorited', 400);
      }

      await tx.favorite.create({
        data: {
          postId,
          userId,
        },
      });
    });

    return {
      success: true,
    };
  }

  async removeFavorite(userId: number, postId: number) {
    await this.dbService.$transaction(async (tx) => {
      const post = await tx.post.findFirst({
        where: {
          id: postId,
          isBlocked: false,
          status: ContentStatus.ACTIVE,
        },
      });

      if (!post) {
        throw new HttpException('Post not found', 404);
      }

      const exists = await tx.favorite.findFirst({
        where: {
          postId,
          userId,
        },
      });

      if (!exists) {
        throw new HttpException('Not favorited', 400);
      }

      await tx.favorite.delete({
        where: {
          id: exists.id,
        },
      });
    });

    return {
      success: true,
    };
  }
}
