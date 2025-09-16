import { ApiProperty } from '@nestjs/swagger';

export class ProposalDto {
  @ApiProperty({ description: 'Unique identifier of the proposal (string).' })
  proposalId: string;

  @ApiProperty({ description: 'Human-readable title of the proposal.' })
  title: string;
}

export class ProposalDetailDto extends ProposalDto {
  @ApiProperty({ description: 'Description of the proposal.' })
  description: string;

  @ApiProperty({
    description: 'Address of the account that created the proposal.',
  })
  proposer: string;

  @ApiProperty({ description: 'Timestamp (epoch) when voting starts.' })
  voteStart: number;

  @ApiProperty({ description: 'Timestamp (epoch) when voting ends.' })
  voteEnd: number;

  @ApiProperty({
    description:
      'Quorum value (string) once voting has started; "0" before start.',
  })
  quorum: string;

  @ApiProperty({
    description: 'Target contract addresses for proposal execution.',
  })
  targets: string[];

  @ApiProperty({
    description: 'ETH values (in wei) sent with each call, as strings.',
  })
  values: string[];

  @ApiProperty({
    description: 'Calldata payloads (hex-encoded) for each call.',
  })
  calldatas: string[];

  @ApiProperty({
    description:
      'EIP-712 hash of the proposal description used for identification.',
  })
  descriptionHash: string;
}
