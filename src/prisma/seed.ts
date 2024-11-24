import { Prisma, PrismaClient, ReactionType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';

const PASSWORD = '123123aaAA!!';
const ADMIN_PASSWORD = `${PASSWORD}_Admin`;

const prisma = new PrismaClient();

// fucking beyond awful
const createReaction = async (
  userId: number,
  entityId: number,
  type: ReactionType,
  isForPost = true,
) => {
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

  return await prisma.$transaction(async (tx) => {
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
      throw new Error('Already liked');
    }

    if (
      exists &&
      exists.type === ReactionType.DISLIKE &&
      type === ReactionType.DISLIKE
    ) {
      throw new Error('Already disliked');
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
      throw new Error(`${isForPost ? 'Post' : 'Comment'} not found`);
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
};

const main = async () => {
  await prisma.category.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  await prisma.category.createMany({
    data: [
      { title: 'General' },
      { title: 'Programming' },
      { title: 'Music' },
      { title: 'Art' },
      { title: 'Food' },
    ],
  });
  const categories = await prisma.category
    .findMany({
      select: {
        id: true,
      },
    })
    .then((categories) => categories.map((category) => category.id));

  const password = await argon2.hash(PASSWORD);
  const adminPassword = await argon2.hash(ADMIN_PASSWORD);

  const users: Prisma.UserCreateInput[] = Array.from({ length: 5 }, () => ({
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password,
    isActive: true,
    role: 'USER',
    fullName: faker.person.fullName(),
  }));

  const admin: Prisma.UserCreateInput = {
    email: 'admin@admin.com',
    username: 'admin',
    password: adminPassword,
    isActive: true,
    role: 'ADMIN',
    fullName: 'Admin',
  };

  await prisma.user.createMany({
    data: [...users, admin],
  });

  const userIds = await prisma.user
    .findMany({
      select: {
        id: true,
      },
    })
    .then((users) => users.map((user) => user.id));

  const posts: Prisma.PostCreateManyInput[] = Array.from(
    { length: 10 },
    () => ({
      title: faker.lorem.word(),
      content: faker.lorem.paragraph(),
      userId: faker.helpers.arrayElement(userIds),
    }),
  );

  await prisma.post.createMany({
    data: posts,
  });

  const postIds = await prisma.post
    .findMany({
      select: {
        id: true,
      },
    })
    .then((posts) => posts.map((post) => post.id));

  await prisma.postCategory.createMany({
    data: postIds.map((id) => ({
      postId: id,
      categoryId: faker.helpers.arrayElement(categories),
    })),
  });

  await prisma.comment.createMany({
    data: Array.from({ length: 10 }, () => ({
      content: faker.lorem.paragraph(),
      userId: faker.helpers.arrayElement(userIds),
      postId: faker.helpers.arrayElement(postIds),
    })),
  });

  const commentIds = await prisma.comment
    .findMany({
      select: {
        id: true,
      },
    })
    .then((comments) => comments.map((comment) => comment.id));

  userIds.forEach(async (userId) => {
    await createReaction(
      userId,
      faker.helpers.arrayElement(postIds),
      faker.helpers.arrayElement(['LIKE', 'DISLIKE']),
    );
  });
  userIds.forEach(async (userId) => {
    await createReaction(
      userId,
      faker.helpers.arrayElement(commentIds),
      faker.helpers.arrayElement(['LIKE', 'DISLIKE']),
      false,
    );
  });

  console.log('Seeded successfully 🌱');

  console.log('Deleting your computer...');
  console.log(3);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(2);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(1);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Deleted!');
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
