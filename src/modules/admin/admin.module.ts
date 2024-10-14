import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbService } from 'src/shared/services/db.service';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { ReactionModule } from '../reaction/reaction.module';
import { ReactionService } from '../reaction/reaction.service';
import { CommentModule } from '../comment/comment.module';
import { PostModule } from '../post/post.module';
import { CommentService } from '../comment/comment.service';
import { PostService } from '../post/post.service';

const AdminModule = (async () => {
  const { AdminJS } = await import('adminjs');
  await import('@adminjs/express');
  const { AdminModule } = await import('@adminjs/nestjs');
  const { Database, Resource, getModelByName } = await import(
    '@adminjs/prisma'
  );

  AdminJS.registerAdapter({
    Resource,
    Database,
  });

  const dbClient = new DbService();

  return AdminModule.createAdminAsync({
    imports: [ConfigModule, ReactionModule, CommentModule, PostModule],
    inject: [ConfigService, ReactionService, CommentService, PostService],
    useFactory: (
      configService: ConfigService,
      reactionService: ReactionService,
      commentService: CommentService,
      postService: PostService,
    ) => ({
      adminJsOptions: {
        rootPath: '/admin',
        resources: [
          {
            model: getModelByName('User'),
            client: dbClient,
            options: {
              properties: {
                password: {
                  isVisible: { show: false, edit: false },
                },
                rating: { isVisible: { edit: false, show: false } },
              },
            },
          },
          {
            model: getModelByName('Post'),
            client: dbClient,
            options: {
              properties: {
                rating: {
                  isVisible: { edit: false, show: true },
                },
                content: {
                  isVisible: {
                    new: false,
                    show: true,
                    edit: false,
                    list: true,
                  },
                },
                title: {
                  isVisible: {
                    edit: false,
                  },
                },
                author: { isVisible: { edit: false, show: true } },
              },
            },
          },
          {
            model: getModelByName('Category'),
            client: dbClient,
          },
          {
            model: getModelByName('Comment'),
            options: {
              properties: {
                rating: {
                  isVisible: { edit: false, show: true },
                },
                content: { isVisible: { edit: false, show: true } },
                author: { isVisible: { edit: false, show: true } },
                Post: { isVisible: { edit: false, show: true } },
              },
            },
            client: dbClient,
          },
          {
            model: getModelByName('Reaction'),
            options: {
              properties: {
                User: {
                  isVisible: {
                    show: true,
                    edit: false,
                  },
                },
              },
              actions: {
                edit: {
                  isAccessible: false,
                },
                new: {
                  isAccessible: true,
                  handler: async (request, _, context) => {
                    const { resource, h, currentAdmin } = context;
                    if (request.payload.Post && request.payload.Comment) {
                      return {
                        record: null,
                        notice: {
                          message: 'Cant do both',
                          type: 'error',
                        },
                      };
                    }

                    if (request.payload.Comment) {
                      const comment = await commentService.findById(
                        request.payload.Comment,
                      );
                      if (comment.userId != currentAdmin.id) {
                        return {
                          record: null,
                          notice: {
                            message:
                              'You can only like/dislike posts created by yourself',
                            type: 'error',
                          },
                        };
                      }
                    }

                    if (request.payload.Post) {
                      const post = await postService.findById(
                        request.payload.Post,
                      );
                      if (post.author.id != currentAdmin.id) {
                        return {
                          record: null,
                          notice: {
                            message:
                              'You can only like/dislike posts created by yourself',
                            type: 'error',
                          },
                        };
                      }
                    }

                    await reactionService.create(
                      Number(request.payload.User),
                      Number(request.payload.Post || request.payload.Comment),
                      { type: request.payload.type },
                      request.payload.Post ? true : false,
                    );

                    const record = await resource.build(request.payload || {});
                    context.record = record;

                    return {
                      redirectUrl: h.resourceUrl({
                        resourceId: resource._decorated?.id() || resource.id(),
                      }),
                      record: record.toJSON(currentAdmin),
                      msg: 'Hello world',
                    };
                  },
                },
              },
            },
            client: dbClient,
          },
        ],
      },
      auth: {
        authenticate: async (email, password) => {
          const user = await dbClient.user.findUnique({
            where: {
              email,
              role: Role.ADMIN,
            },
          });

          if (!user) {
            return null;
          }

          const match = await argon2.verify(user.password, password);

          if (!match) {
            return null;
          }

          return {
            id: String(user.id),
            email: user.email,
          };
        },
        cookieName: 'adminjs',
        cookiePassword: 'supersecret',
      },
      sessionOptions: {
        resave: true,
        saveUninitialized: true,
        secret: configService.get('ADMIN_SECRET'),
      },
    }),
  });
})();

export default AdminModule;
