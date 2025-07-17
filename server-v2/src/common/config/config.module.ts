import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerConfigService } from './server-config.service';
import { NetworkConfigService } from './network-config.service';
import { CacheConfigService } from './cache-config.service';

@Global()
@Module({
  providers: [
    CacheConfigService,
    ConfigService,
    ServerConfigService,
    NetworkConfigService,
  ],
  exports: [
    CacheConfigService,
    ConfigService,
    ServerConfigService,
    NetworkConfigService,
  ],
})
export class EnvConfigModule {}
