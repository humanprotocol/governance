import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The port number for the Redis cache server.
   * Required
   */
  get cachePort(): number {
    return this.configService.getOrThrow<number>('REDIS_PORT');
  }

  /**
   * The hostname or IP address of the Redis cache server.
   * Required
   */
  get cacheHost(): string {
    return this.configService.getOrThrow<string>('REDIS_HOST');
  }

  /**
   * The DB number of the Redis cache server
   */
  get cacheDatabase(): number {
    return this.configService.get<number>('REDIS_DB', 0);
  }
}
