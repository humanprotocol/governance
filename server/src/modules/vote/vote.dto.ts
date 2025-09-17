import { ApiProperty } from '@nestjs/swagger';

export class VoteTotalDto {
  @ApiProperty({ description: 'Unique identifier of the proposal (string).' })
  proposalId: string;

  @ApiProperty({ description: 'Total number of FOR votes aggregated.' })
  forVotes: number;

  @ApiProperty({ description: 'Total number of AGAINST votes aggregated.' })
  againstVotes: number;

  @ApiProperty({ description: 'Total number of ABSTAIN votes aggregated.' })
  abstainVotes: number;
}
