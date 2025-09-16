import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { CacheFactoryConfig } from './common/config/cache-factory.config';
import { EnvConfigModule } from './common/config/config.module';
import { envValidator } from './common/config/env-schema';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { ProposalModule } from './modules/proposal/proposal.module';
import { VoteModule } from './modules/vote/vote.module';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env.local', '.env'],
      validationSchema: envValidator,
    }),
    CacheModule.registerAsync(CacheFactoryConfig),
    EnvConfigModule,
    ProposalModule,
    VoteModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
