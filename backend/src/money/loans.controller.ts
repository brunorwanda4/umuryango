import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLoanDto } from './dto/create-loan.dto';
import { CreatePersonalLoanDto } from './dto/create-personal-loan.dto';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { LoanQueryDto } from './dto/loan-query.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { UpdateRepaymentDto } from './dto/update-repayment.dto';
import { UploadLoanDocumentDto } from './dto/upload-loan-document.dto';
import { LoansService } from './loans.service';

@ApiTags('money-loans')
@ApiExtraModels(
  CreateLoanDto,
  CreatePersonalLoanDto,
  CreateRepaymentDto,
  LoanQueryDto,
  UpdateLoanDto,
  UpdateRepaymentDto,
  UploadLoanDocumentDto,
)
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/money/loans')
export class LoansController {
  constructor(
    @Inject(LoansService) private readonly loansService: LoansService,
  ) {}

  @Get('personal')
  @ApiOperation({ summary: 'List personal loans with trusted people' })
  @ApiOkResponse({ description: 'Personal loans retrieved successfully.' })
  async findPersonalLoans(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query() query: LoanQueryDto,
  ) {
    const data = await this.loansService.findPersonalLoans(
      userId,
      familyId,
      query,
    );
    return { data, message: 'Personal loans retrieved successfully.' };
  }

  @Post('personal')
  @ApiOperation({ summary: 'Create a personal loan with a trusted person' })
  @ApiCreatedResponse({ description: 'Personal loan created successfully.' })
  async createPersonalLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreatePersonalLoanDto,
  ) {
    const data = await this.loansService.createPersonalLoan(
      userId,
      familyId,
      dto,
    );
    return { data, message: 'Personal loan created successfully.' };
  }

  @Get()
  @ApiOperation({ summary: 'List family loans' })
  @ApiOkResponse({ description: 'Loans retrieved successfully.' })
  async findLoans(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query() query: LoanQueryDto,
  ) {
    const data = await this.loansService.findLoans(userId, familyId, query);
    return { data, message: 'Loans retrieved successfully.' };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get loan summary metrics' })
  @ApiOkResponse({ description: 'Loan summary retrieved successfully.' })
  async getSummary(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
  ) {
    const data = await this.loansService.getLoanSummary(userId, familyId);
    return { data, message: 'Loan summary retrieved successfully.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan by ID' })
  @ApiOkResponse({ description: 'Loan retrieved successfully.' })
  async findLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.findLoan(userId, familyId, id);
    return { data, message: 'Loan retrieved successfully.' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a loan request' })
  @ApiCreatedResponse({ description: 'Loan created successfully.' })
  async createLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreateLoanDto,
  ) {
    const data = await this.loansService.createLoan(userId, familyId, dto);
    return { data, message: 'Loan created successfully.' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a loan' })
  @ApiOkResponse({ description: 'Loan updated successfully.' })
  async updateLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLoanDto,
  ) {
    const data = await this.loansService.updateLoan(userId, familyId, id, dto);
    return { data, message: 'Loan updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a loan' })
  @ApiOkResponse({ description: 'Loan deleted successfully.' })
  async deleteLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.deleteLoan(userId, familyId, id);
    return { data, message: 'Loan deleted successfully.' };
  }

  @Post(':id/submit-approval')
  @ApiOperation({ summary: 'Submit a loan for approval' })
  @ApiOkResponse({ description: 'Loan submitted for approval.' })
  async submitForApproval(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.submitForApproval(
      userId,
      familyId,
      id,
    );
    return { data, message: 'Loan submitted for approval.' };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a pending loan' })
  @ApiOkResponse({ description: 'Loan approved successfully.' })
  async approveLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.approveLoan(userId, familyId, id);
    return { data, message: 'Loan approved successfully.' };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending loan' })
  @ApiOkResponse({ description: 'Loan rejected successfully.' })
  async rejectLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.rejectLoan(userId, familyId, id);
    return { data, message: 'Loan rejected successfully.' };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a loan' })
  @ApiOkResponse({ description: 'Loan cancelled successfully.' })
  async cancelLoan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.cancelLoan(userId, familyId, id);
    return { data, message: 'Loan cancelled successfully.' };
  }

  @Post(':id/mark-completed')
  @ApiOperation({ summary: 'Mark a fully repaid loan completed' })
  @ApiOkResponse({ description: 'Loan marked completed successfully.' })
  async markCompleted(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.markCompleted(userId, familyId, id);
    return { data, message: 'Loan marked completed successfully.' };
  }

  @Get(':id/repayments')
  @ApiOperation({ summary: 'List loan repayments' })
  @ApiOkResponse({ description: 'Repayments retrieved successfully.' })
  async getRepayments(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.getRepayments(userId, familyId, id);
    return { data, message: 'Repayments retrieved successfully.' };
  }

  @Post(':id/repayments')
  @ApiOperation({ summary: 'Record a loan repayment' })
  @ApiCreatedResponse({ description: 'Repayment recorded successfully.' })
  async createRepayment(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: CreateRepaymentDto,
  ) {
    const data = await this.loansService.addRepayment(
      userId,
      familyId,
      id,
      dto,
    );
    return { data, message: 'Repayment recorded successfully.' };
  }

  @Patch(':id/repayments/:repaymentId')
  @ApiOperation({ summary: 'Update a loan repayment' })
  @ApiOkResponse({ description: 'Repayment updated successfully.' })
  async updateRepayment(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Param('repaymentId') repaymentId: string,
    @Body() dto: UpdateRepaymentDto,
  ) {
    const data = await this.loansService.updateRepayment(
      userId,
      familyId,
      id,
      repaymentId,
      dto,
    );
    return { data, message: 'Repayment updated successfully.' };
  }

  @Delete(':id/repayments/:repaymentId')
  @ApiOperation({ summary: 'Soft-delete a loan repayment' })
  @ApiOkResponse({ description: 'Repayment deleted successfully.' })
  async deleteRepayment(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Param('repaymentId') repaymentId: string,
  ) {
    const data = await this.loansService.deleteRepayment(
      userId,
      familyId,
      id,
      repaymentId,
    );
    return { data, message: 'Repayment deleted successfully.' };
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'List loan documents' })
  @ApiOkResponse({ description: 'Loan documents retrieved successfully.' })
  async getDocuments(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.loansService.getLoanDocuments(userId, familyId, id);
    return { data, message: 'Loan documents retrieved successfully.' };
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Attach loan document metadata' })
  @ApiCreatedResponse({ description: 'Loan document saved successfully.' })
  async uploadDocument(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UploadLoanDocumentDto,
  ) {
    const data = await this.loansService.uploadLoanDocument(
      userId,
      familyId,
      id,
      dto,
    );
    return { data, message: 'Loan document saved successfully.' };
  }

  @Delete(':id/documents/:documentId')
  @ApiOperation({ summary: 'Soft-delete a loan document' })
  @ApiOkResponse({ description: 'Loan document deleted successfully.' })
  async deleteDocument(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    const data = await this.loansService.deleteLoanDocument(
      userId,
      familyId,
      id,
      documentId,
    );
    return { data, message: 'Loan document deleted successfully.' };
  }
}
