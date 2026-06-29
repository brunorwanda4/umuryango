import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ContributionsModule } from './contributions/contributions.module';
import { FamiliesModule } from './families/families.module';
import { MoneyModule } from './money/money.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FamiliesModule,
    ContributionsModule,
    MoneyModule,
    ProjectsModule,
  ],
})
export class AppModule {}
