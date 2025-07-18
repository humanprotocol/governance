import { Module } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { Web3Module } from '../web3/web3.module';

@Module({
  controllers: [VoteController],
  providers: [VoteService],
  imports: [Web3Module],
  exports: [VoteService],
})
export class VoteModule {}
