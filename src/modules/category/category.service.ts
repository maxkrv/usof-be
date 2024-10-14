import { Injectable } from '@nestjs/common';
import { DbService } from 'src/shared/services/db.service';

@Injectable()
export class CategoryService {
  constructor(private readonly dbService: DbService) {}

  findAll() {
    return this.dbService.category.findMany({
      select: {
        id: true,
        title: true,
      },
    });
  }
}
