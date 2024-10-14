import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DbService } from 'src/shared/services/db.service';

@Module({
  controllers: [CategoryController],
  providers: [DbService, CategoryService],
})
export class CategoryModule {}
