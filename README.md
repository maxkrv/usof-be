## Project setup

1. Make a `.env` file by copying values from `.env.example` and filling it with your data

2. Run docker compose

```bash
docker compose up -d
```

3. Install packages

```bash
npm install
```

4. Generate ORM files

```bash
npx prisma generate
```

## Seed DB (if needed)

```bash
npx prisma db seed
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests (There are not any haha)

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
