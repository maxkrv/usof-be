import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { DbService } from 'src/shared/services/db.service';

@Module({
  controllers: [ReactionController],
  providers: [DbService, ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
