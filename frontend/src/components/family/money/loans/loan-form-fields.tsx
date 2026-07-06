import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { type Control, useWatch } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { FamilyContact } from "../../contacts/types-and-schemas";
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
  contacts = [],
  control,
  family,
}: {
  contacts?: FamilyContact[];
  control: Control<LoanFormValues>;
  family: FamilyDetail;
}) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const loanType = useWatch({ control, name: "type" });
  const contactOptions = [
    { label: "Manual entry", value: "__manual" },
    ...contacts
      .filter((contact) => contact.status === "ACTIVE")
      .map((contact) => ({
        label: [
          contact.fullName,
          contact.phoneNumber,
          contact.relationshipToFamily,
        ]
          .filter(Boolean)
          .join(" - "),
        value: contact.id,
      })),
  ];

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        {loanType === "MONEY_LENT" ? (
          <>
            <CommonFormField
              control={control}
              name="borrowerContactId"
              label="Borrower"
              fieldType="select"
              selectOptions={contactOptions}
              description="Choose a saved borrower from family contacts."
            />
            <CommonFormField
              control={control}
              name="borrower"
              label="Manual borrower"
              placeholder="Enter borrower if not saved"
            />
          </>
        ) : (
          <>
            <CommonFormField
              control={control}
              name="lenderContactId"
              label="Lender"
              fieldType="select"
              selectOptions={contactOptions}
              description="Choose a saved lender from family contacts."
            />
            <CommonFormField
              control={control}
              name="lender"
              label="Manual lender"
              placeholder="Enter lender if not saved"
            />
          </>
        )}
        <div className="flex items-end">
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/contacts?new=1`}
            type="button"
            variant="outline"
            className="w-full"
          >
            Add new contact
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CommonFormField
          control={control}
          name="category"
          label="Category"
          placeholder="e.g. Education, business, emergency"
        />
      </div>
      <CommonFormField
        control={control}
        name="notes"
        label="Notes"
        fieldType="textarea"
        placeholder="Repayment agreement, guarantor, reminder, or family context"
      />
      <Collapsible
        open={showOptionalFields}
        onOpenChange={setShowOptionalFields}
        className="flex flex-col gap-4"
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between sm:w-auto sm:self-start"
          >
            <span className="inline-flex items-center gap-1.5">
              <SlidersHorizontalIcon
                aria-hidden="true"
                data-icon="inline-start"
              />
              Optional loan details
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              data-icon="inline-end"
              className={
                showOptionalFields
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-4">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={control}
              name="documentFileName"
              label="Loan document"
              type="file"
              description="Attach the agreement or proof document."
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
        </CollapsibleContent>
      </Collapsible>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CommonFormField
          control={control}
          name="status"
          label="Status"
          fieldType="select"
          selectOptions={loanStatuses}
          required
        />
      </div>
    </>
  );
}
