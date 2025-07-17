import { ApiProperty } from '@nestjs/swagger';

export class VoteTotalDto {
  @ApiProperty()
  proposalId: string;

  @ApiProperty()
  forVotes: number;

  @ApiProperty()
  againstVotes: number;

  @ApiProperty()
  abstainVotes: number;
}
