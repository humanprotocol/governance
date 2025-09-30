import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { VoteService } from './vote.service';
import { VoteTotalDto } from './vote.dto';

@ApiTags('Votes')
@Controller('votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Get(':proposalId')
  @ApiOperation({ summary: 'Get total votes for a proposal' })
  @ApiParam({ name: 'proposalId', type: String })
  async getTotalVotes(
    @Param('proposalId') proposalId: string,
  ): Promise<VoteTotalDto> {
    const votes = await this.voteService.getTotalVotes(proposalId);
    if (!votes) throw new NotFoundException('Votes not found');
    return votes;
  }
}
