import { ApiProperty } from '@nestjs/swagger';

export class ProposalDto {
  @ApiProperty()
  proposalId: string;

  @ApiProperty()
  title: string;
}

export class ProposalDetailDto extends ProposalDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  proposer: string;

  @ApiProperty()
  voteStart: number; // timestamp en segundos

  @ApiProperty()
  voteEnd: number; // timestamp en segundos
}
