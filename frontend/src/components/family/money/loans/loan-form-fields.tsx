import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "../../dashboard/types";
import {
  type LoanFormValues,
  loanApprovalStatuses,
  loanStatuses,
  loanTypes,
  paymentMethods,
  repaymentFrequencies,
} from "./types-and-schemas";

export function LoanFormFields({
  control,
  family,
}: {
  control: Control<LoanFormValues>;
  family: FamilyDetail;
}) {
  return (
    <>
      <CommonFormField
        control={control}
        name="title"
        label="Loan title"
        placeholder="e.g. School fees support loan"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="type"
          label="Loan type"
          fieldType="select"
          selectOptions={loanTypes}
          required
        />
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={`Amount (${family.defaultCurrency})`}
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder="e.g. 500,000"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CommonFormField
          control={control}
          name="interestRatePercent"
          label="Interest rate"
          placeholder="e.g. 12.5"
          inputProps={{ inputMode: "decimal" }}
          description="Enter annual percentage, if applicable."
        />
        <CommonFormField
          control={control}
          name="startDate"
          label="Start date"
          fieldType="date"
          required
        />
        <CommonFormField
          control={control}
          name="dueDate"
          label="Due date"
          fieldType="date"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="borrower"
          label="Borrower"
          placeholder="Family member, friend, relative, bank customer, or other borrower"
          required
        />
        <CommonFormField
          control={control}
          name="lender"
          label="Lender"
          placeholder="Bank, SACCO, friend, relative, or family member"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CommonFormField
          control={control}
          name="category"
          label="Category"
          placeholder="e.g. Education, business, emergency"
        />
        <CommonFormField
          control={control}
          name="paymentMethod"
          label="Payment method"
          fieldType="select"
          selectOptions={paymentMethods}
          required
        />
        <CommonFormField
          control={control}
          name="repaymentFrequency"
          label="Repayment frequency"
          fieldType="select"
          selectOptions={repaymentFrequencies}
          required
        />
      </div>
      <CommonFormField
        control={control}
        name="notes"
        label="Notes"
        fieldType="textarea"
        placeholder="Repayment agreement, guarantor, reminder, or family context"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CommonFormField
          control={control}
          name="documentFileName"
          label="Loan document"
          type="file"
          description="Attach the agreement or proof document."
        />
        <CommonFormField
          control={control}
          name="status"
          label="Status"
          fieldType="select"
          selectOptions={loanStatuses}
          required
        />
        <CommonFormField
          control={control}
          name="approvalStatus"
          label="Approval status"
          fieldType="select"
          selectOptions={loanApprovalStatuses}
          required
        />
      </div>
    </>
  );
}
