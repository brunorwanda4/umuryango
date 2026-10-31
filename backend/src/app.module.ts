import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { ContributionsModule } from './contributions/contributions.module';
import { FamiliesModule } from './families/families.module';
import { MoneyModule } from './money/money.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PersonalPlansModule } from './personal-plans/personal-plans.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FamiliesModule,
    ContactsModule,
    ContributionsModule,
    MoneyModule,
    NotificationsModule,
    PersonalPlansModule,
    ProjectsModule,
    ReportsModule,
  ],
})
export class AppModule {}
