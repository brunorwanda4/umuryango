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
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    MoneyController,
    CategoriesController,
    TransactionsController,
    BudgetsController,
    ReceiptsController,
    LoansController,
  ],
  providers: [
    MoneyService,
    CategoriesService,
    TransactionsService,
    BudgetsService,
    ReceiptsService,
    LoansService,
  ],
})
export class MoneyModule {}
