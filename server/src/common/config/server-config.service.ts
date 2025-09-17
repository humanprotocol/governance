import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServerConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The environment in which the server is running (e.g., 'development', 'production').
   * Default: 'development'
   */
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  /**
   * The hostname or IP address on which the server will run.
   * Default: 'localhost'
   */
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }

  /**
   * The port number on which the server will listen for incoming connections.
   * Default: 5000
   */
  get port(): number {
    return +this.configService.get<number>('PORT', 5000);
  }

  /**
   * The address of the Governance Hub contract.
   */
  get governanceHubAddress(): string {
    return this.configService.get<string>('GOVERNANCE_HUB_ADDRESS', '');
  }

  /**
   * The Governance Hub contract block number.
   */
  get governanceHubBlockNumber(): number {
    return +this.configService.get<number>('GOVERNANCE_HUB_BLOCK_NUMBER', 0);
  }

  /**
   * The Governance Hub contract chain ID.
   */
  get governanceHubChainId(): number {
    return +this.configService.get<number>('GOVERNANCE_HUB_CHAIN_ID', 1);
  }

  /**
   * Comma-separated chain IDs for spoke chains.
   * Example: "56,97"
   */
  get governanceSpokeChainIds(): number[] {
    const ids = this.configService.get<string>(
      'GOVERNANCE_SPOKE_CHAIN_IDS',
      '',
    );
    return ids
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
  }

  /**
   * Comma-separated addresses for spoke contracts.
   * Example: "0xabc...,0xdef..."
   */
  get governanceSpokeAddresses(): string[] {
    const addresses = this.configService.get<string>(
      'GOVERNANCE_SPOKE_ADDRESSES',
      '',
    );
    return addresses
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => !!addr);
  }

  /**
   * Cache TTL for votes (in seconds).
   */
  get cacheTtlVotesPending(): number {
    return +this.configService.get<number>('CACHE_TTL_VOTES_PENDING', 300);
  }

  get cacheTtlVotesActive(): number {
    return +this.configService.get<number>('CACHE_TTL_VOTES_ACTIVE', 180);
  }
}
