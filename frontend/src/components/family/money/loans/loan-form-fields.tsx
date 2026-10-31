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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyLoans");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const loanType = useWatch({ control, name: "type" });
  const contactOptions = [
    { label: t((m) => m.FamilyLoans.form.manualEntry), value: "__manual" },
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
        label={t((m) => m.FamilyLoans.form.loanTitleLabel)}
        placeholder={t((m) => m.FamilyLoans.form.loanTitlePlaceholder)}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="type"
          label={t((m) => m.FamilyLoans.form.loanTypeLabel)}
          fieldType="select"
          selectOptions={loanTypes}
          required
        />
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={t((m) => m.FamilyLoans.form.amountLabel, {
            currency: family.defaultCurrency,
          })}
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder={t((m) => m.FamilyLoans.form.amountPlaceholder)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="startDate"
          label={t((m) => m.FamilyLoans.form.startDateLabel)}
          fieldType="date"
          required
        />
        <CommonFormField
          control={control}
          name="dueDate"
          label={t((m) => m.FamilyLoans.form.dueDateLabel)}
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
              label={t((m) => m.FamilyLoans.form.borrowerLabel)}
              fieldType="select"
              selectOptions={contactOptions}
              description="Choose a saved borrower from family contacts."
            />
            <CommonFormField
              control={control}
              name="borrower"
              label={t((m) => m.FamilyLoans.form.manualBorrowerLabel)}
              placeholder={t(
                (m) => m.FamilyLoans.form.manualBorrowerPlaceholder,
              )}
            />
          </>
        ) : (
          <>
            <CommonFormField
              control={control}
              name="lenderContactId"
              label={t((m) => m.FamilyLoans.form.lenderLabel)}
              fieldType="select"
              selectOptions={contactOptions}
              description="Choose a saved lender from family contacts."
            />
            <CommonFormField
              control={control}
              name="lender"
              label={t((m) => m.FamilyLoans.form.manualLenderLabel)}
              placeholder={t((m) => m.FamilyLoans.form.manualLenderPlaceholder)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="category"
          label={t((m) => m.FamilyLoans.form.categoryLabel)}
          placeholder="e.g. Education, business, emergency"
        />
        <CommonFormField
          control={control}
          name="status"
          label={t((m) => m.FamilyLoans.form.statusLabel)}
          fieldType="select"
          selectOptions={loanStatuses}
          required
        />
      </div>
      <CommonFormField
        control={control}
        name="notes"
        label={t((m) => m.FamilyLoans.form.notesLabel)}
        fieldType="textarea"
        placeholder={t((m) => m.FamilyLoans.form.notesPlaceholder)}
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
              {t((m) => m.FamilyLoans.form.optionalSettings)}
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
              label={t((m) => m.FamilyLoans.form.interestRateLabel)}
              placeholder={t((m) => m.FamilyLoans.form.interestRatePlaceholder)}
              inputProps={{ inputMode: "decimal" }}
              description="Enter annual percentage, if applicable."
            />
            <CommonFormField
              control={control}
              name="paymentMethod"
              label={t((m) => m.FamilyLoans.form.paymentMethodLabel)}
              fieldType="select"
              selectOptions={paymentMethods}
              required
            />
            <CommonFormField
              control={control}
              name="repaymentFrequency"
              label={t((m) => m.FamilyLoans.form.repaymentFrequencyLabel)}
              fieldType="select"
              selectOptions={repaymentFrequencies}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={control}
              name="documentFileName"
              label={t((m) => m.FamilyLoans.docFileLabel)}
              type="file"
              description={t((m) => m.FamilyLoans.docFileDesc)}
            />
            <CommonFormField
              control={control}
              name="approvalStatus"
              label={t((m) => m.FamilyLoans.details.approvalStatus)}
              fieldType="select"
              selectOptions={loanApprovalStatuses}
              required
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
