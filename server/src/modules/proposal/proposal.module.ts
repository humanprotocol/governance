import { Module } from '@nestjs/common';
import { ProposalsService } from './proposal.service';
import { ProposalsController } from './proposal.controller';
import { Web3Module } from '../web3/web3.module';

@Module({
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
  imports: [Web3Module],
})
export class ProposalModule {}
