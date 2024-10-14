import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }
}
