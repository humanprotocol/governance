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
  voteStart: number;

  @ApiProperty()
  voteEnd: number;

  @ApiProperty({
    description:
      'Quorum value (string) once voting has started; "0" before start.',
  })
  quorum: string;
}
