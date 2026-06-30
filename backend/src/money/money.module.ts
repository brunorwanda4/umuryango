import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MoneyController } from './money.controller';
import { MoneyService } from './money.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    MoneyController,
    CategoriesController,
    TransactionsController,
    BudgetsController,
    ReceiptsController,
  ],
  providers: [
    MoneyService,
    CategoriesService,
    TransactionsService,
    BudgetsService,
    ReceiptsService,
  ],
})
export class MoneyModule {}
