import { HttpException, Injectable } from '@nestjs/common';
import { DbService } from 'src/shared/services/db.service';
import { ReactionType } from '@prisma/client';
import { LikeDto } from './dto/create-like.dto';

@Injectable()
export class ReactionService {
  constructor(private readonly dbService: DbService) {}

  async create(
    userId: number,
    entityId: number,
    { type }: LikeDto,
    isForPost = true,
  ) {
    console.log(
      '🚀 ~ file: reaction.service.ts:24 ~ ReactionService ~ { type }:',
      { type },
    );
    const getRatingAction = (exists: any) => {
      let ratingValue: number = 0;

      if (exists) {
        if (exists.type === ReactionType.LIKE) {
          ratingValue = -2;
        } else {
          ratingValue = 2;
        }
      } else {
        if (type === ReactionType.LIKE) {
          ratingValue = 1;
        } else {
          ratingValue = -1;
        }
      }

      return {
        increment: ratingValue,
      };
    };

    return await this.dbService.$transaction(async (tx) => {
      const exists = await tx.reaction.findFirst({
        where: {
          userId,
          ...(isForPost
            ? {
                postId: entityId,
              }
            : {
                commentId: entityId,
              }),
        },
        select: {
          id: true,
          type: true,
        },
      });

      if (
        exists &&
        exists.type === ReactionType.LIKE &&
        type === ReactionType.LIKE
      ) {
        throw new HttpException('Already liked', 400);
      }

      if (
        exists &&
        exists.type === ReactionType.DISLIKE &&
        type === ReactionType.DISLIKE
      ) {
        throw new HttpException('Already disliked', 400);
      }

      let reactionId: number | null = null;
      if (exists) {
        const reaction = await tx.reaction.update({
          where: {
            id: exists.id,
          },
          data: {
            type,
          },
        });

        reactionId = reaction.id;
      } else {
        const reaction = await tx.reaction.create({
          data: {
            userId: userId,
            ...(isForPost
              ? {
                  postId: entityId,
                }
              : {
                  commentId: entityId,
                }),
            type,
          },
        });

        reactionId = reaction.id;
      }

      let entitiesUserId: null | number = null;

      if (isForPost) {
        const post = await tx.post.update({
          where: {
            id: entityId,
          },
          data: {
            rating: getRatingAction(exists),
          },
        });

        entitiesUserId = post.userId;
      } else {
        const comment = await tx.comment.update({
          where: {
            id: entityId,
          },
          data: {
            rating: getRatingAction(exists),
          },
        });

        entitiesUserId = comment.userId;
      }

      if (!entitiesUserId) {
        throw new HttpException(
          `${isForPost ? 'Post' : 'Comment'} not found`,
          404,
        );
      }

      await tx.user.update({
        where: {
          id: entitiesUserId,
        },
        data: {
          rating: getRatingAction(exists),
        },
      });

      return {
        success: true,
        id: reactionId,
      };
    });
  }

  async delete(userId: number, entityId: number, isForPost = true) {
    await this.dbService.$transaction(async (tx) => {
      const exists = await tx.reaction.findFirst({
        where: {
          ...(isForPost ? { postId: entityId } : { commentId: entityId }),
          userId,
        },
      });

      if (!exists) {
        throw new HttpException('Reaction not found', 404);
      }

      let entitiesUserId: null | number = null;

      if (isForPost) {
        const post = await tx.post.update({
          where: {
            id: exists.postId,
          },
          data: {
            rating: {
              decrement: exists.type === ReactionType.LIKE ? 1 : -1,
            },
          },
        });

        entitiesUserId = post.userId;
      } else {
        const comment = await tx.comment.update({
          where: {
            id: exists.commentId,
          },
          data: {
            rating: {
              decrement: exists.type === ReactionType.LIKE ? 1 : -1,
            },
          },
        });

        entitiesUserId = comment.userId;
      }

      if (!entitiesUserId) {
        throw new HttpException(
          `${isForPost ? 'Post' : 'Comment'} not found`,
          404,
        );
      }

      await tx.user.update({
        where: {
          id: entitiesUserId,
        },
        data: {
          rating: {
            decrement: exists.type === ReactionType.LIKE ? 1 : -1,
          },
        },
      });

      await tx.reaction.delete({
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
