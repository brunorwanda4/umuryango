import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContributionsModule } from './contributions/contributions.module';
import { FamiliesModule } from './families/families.module';
import { MoneyModule } from './money/money.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FamiliesModule,
    ContributionsModule,
    MoneyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
