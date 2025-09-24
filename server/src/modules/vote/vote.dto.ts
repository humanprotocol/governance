import { ApiProperty } from '@nestjs/swagger';

export class VoteTotalDto {
  @ApiProperty({ description: 'Unique identifier of the proposal (string).' })
  proposalId: string;

  @ApiProperty({ description: 'Total number of FOR votes aggregated.' })
  forVotes: string;

  @ApiProperty({ description: 'Total number of AGAINST votes aggregated.' })
  againstVotes: string;

  @ApiProperty({ description: 'Total number of ABSTAIN votes aggregated.' })
  abstainVotes: string;
}
