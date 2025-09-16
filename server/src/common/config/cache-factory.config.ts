import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import _ from 'lodash';
import logger from '../../logger';
import { CacheConfigService } from './cache-config.service';

const throttledRedisErrorLog = _.throttle((error) => {
  logger.error('Redis client network error', error);
}, 1000 * 5);

export const CacheFactoryConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: CacheConfigService) => {
    const store = await redisStore({
      socket: {
        host: configService.cacheHost,
        port: configService.cachePort,
      },
      database: configService.cacheDatabase,
      disableOfflineQueue: true,
    });

    store.client.on('error', throttledRedisErrorLog);

    return {
      store: () => store,
    };
  },
  inject: [CacheConfigService],
};
