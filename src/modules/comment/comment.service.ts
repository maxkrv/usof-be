import { Injectable } from '@nestjs/common';
import { DbService } from 'src/shared/services/db.service';
import { GetCommentDto } from './dto/get-comment-dto';
import {
  DataWithPagination,
  SuccessResponse,
} from 'src/shared/interfaces/interface';
import { CommentResponse } from './interface/comment.interface';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private readonly dbService: DbService) {}

  async getAll(
    dto: GetCommentDto,
    userId?: number,
  ): Promise<DataWithPagination<CommentResponse>> {
    const [comments, total] = await this.dbService.$transaction([
      this.dbService.comment.findMany({
        where: {
          postId: dto.postId,
          status: ContentStatus.ACTIVE,
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          ...(userId && { Reaction: { where: { userId } } }),
        },
        orderBy: {
          [dto.orderBy]: dto.order,
        },
        skip: dto.limit * (dto.page - 1),
        take: dto.limit,
      }),

      this.dbService.comment.count({
        where: {
          postId: dto.postId,
        },
      }),
    ]);

    const mappedComments: CommentResponse[] = comments.map((comment) => {
      return {
        id: comment.id,
        content: comment.content,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt,
        author: comment.User,
        rating: comment.rating,
        myReaction: comment.Reaction?.[0]?.type || null,
      };
    });

    return {
      data: mappedComments,
      pagination: {
        page: dto.page,
        total,
      },
    };
  }

  async create(
    userId: number,
    dto: CreateCommentDto,
  ): Promise<SuccessResponse> {
    await this.dbService.comment.create({
      data: {
        content: dto.content,
        Post: { connect: { id: dto.postId } },
        User: { connect: { id: userId } },
      },
    });

    return { success: true };
  }

  async update(id: number, dto: UpdateCommentDto): Promise<SuccessResponse> {
    await this.dbService.comment.update({
      where: {
        id,
      },
      data: {
        ...dto,
        isEdited: true,
      },
    });

    return { success: true };
  }

  async delete(userId: number, id: number): Promise<SuccessResponse> {
    await this.dbService.comment.delete({
      where: {
        id,
        User: {
          id: userId,
        },
      },
    });

    return { success: true };
  }

  findById(id: number) {
    return this.dbService.comment.findFirst({
      where: {
        id,
        status: ContentStatus.ACTIVE,
      },
    });
  }
}
