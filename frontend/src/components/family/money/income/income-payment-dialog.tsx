"use client";

import { useEffect } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CurrentUser } from "@/hooks/use-current-user";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import apiRequest from "@/service/api";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate, formatMinorUnits } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

const incomePaymentSchema = z.object({
	amountMinorUnits: z.coerce
		.number()
		.min(1, "Payment amount must be greater than 0"),
	date: z.string().min(1, "Payment date is required"),
	paymentMethod: z.string().min(1, "Payment method is required"),
	receivedFromContactId: z.string().optional(),
	receivedBy: z.string().optional(),
	notes: z.string().optional(),
	fileName: z.string().optional(),
});

type IncomePaymentFormValues = z.infer<typeof incomePaymentSchema>;

function formatDateInput(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function getDefaultValues(
	receivedBy: string,
	paymentSource?: IncomeTransaction | null,
): IncomePaymentFormValues {
	return {
		amountMinorUnits: 0,
		date: formatDateInput(new Date()),
		paymentMethod: paymentSource?.paymentMethod || "CASH",
		receivedFromContactId: paymentSource?.receivedFromContactId || "",
		receivedBy,
		notes: "",
		fileName: "",
	};
}

export function IncomePaymentDialog({
	open,
	onOpenChange,
	family,
	currentUser,
	contacts,
	paymentSource,
	paymentAmountMinorUnits,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	family: FamilyDetail;
	currentUser: CurrentUser | null;
	contacts: FamilyContact[];
	paymentSource: IncomeTransaction | null;
	paymentAmountMinorUnits: string | null;
	onSuccess: () => void;
}) {
	const defaultReceivedBy =
		family.members.find((member) => member.userId === currentUser?.id)
			?.fullName ??
		currentUser?.fullName ??
		"";
	const activeContacts = contacts.filter(
		(contact) => contact.status === "ACTIVE",
	);
	const payerOptions = activeContacts.map((contact) => ({
		label: contact.phoneNumber
			? `${contact.fullName} (${contact.phoneNumber})`
			: contact.fullName,
		value: contact.id,
	}));

	const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
		IncomePaymentFormValues,
		IncomeTransaction
	>({
		schema: incomePaymentSchema,
		formOptions: {
			defaultValues: getDefaultValues(defaultReceivedBy, paymentSource),
		},
		transform: (values) => ({
			amountMinorUnits: String(values.amountMinorUnits),
			date: new Date(values.date).toISOString(),
			paymentMethod: values.paymentMethod,
			receivedFromContactId: values.receivedFromContactId || undefined,
			receivedBy: values.receivedBy,
			notes: values.notes,
			idempotencyKey: `record-income-payment-${Date.now()}-${Math.random()
				.toString(36)
				.substring(2, 11)}`,
		}),
		request: {
			method: "post",
			url: () =>
				`/families/${encodeURIComponent(
					family.id,
				)}/money/transactions/${encodeURIComponent(
					paymentSource?.id ?? "",
				)}/payments`,
		},
		onSuccessMessage: "Income payment recorded successfully",
		toastOnSuccess: true,
		onSuccess: async (data, values) => {
			if (values.fileName && data?.id) {
				await apiRequest(
					"post",
					`/families/${encodeURIComponent(family.id)}/money/receipts`,
					{
						transactionId: data.id,
						fileName: values.fileName || "receipt.pdf",
						fileType: "application/pdf",
						fileSizeBytes: 1024,
						storageKey: `mock-bunny-storage-key-${Date.now()}`,
					},
				);
			}

			onOpenChange(false);
			form.reset(getDefaultValues(defaultReceivedBy));
			onSuccess();
		},
	});

	useEffect(() => {
		if (!open) return;

		form.reset(getDefaultValues(defaultReceivedBy, paymentSource));
	}, [defaultReceivedBy, form, open, paymentSource]);

	useEffect(() => {
		if (!open || !defaultReceivedBy || form.getValues("receivedBy")) return;

		form.setValue("receivedBy", defaultReceivedBy, {
			shouldDirty: false,
			shouldValidate: true,
		});
	}, [defaultReceivedBy, form, open]);

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				onOpenChange(isOpen);
				if (!isOpen) resetMessages();
			}}
		>
			<DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Record Payment</DialogTitle>
					<DialogDescription>
						Save only the money received now. The monthly income setup stays the
						same.
					</DialogDescription>
				</DialogHeader>

				{paymentSource ? (
					<div className="rounded-md border bg-muted/30 p-4 text-sm">
						<div className="font-medium">
							{paymentSource.propertyName ||
								paymentSource.description ||
								paymentSource.category.name}
						</div>
						<div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
							<div>
								<span className="text-muted-foreground">Payer: </span>
								<span className="font-medium">
									{paymentSource.receivedFrom ?? "Not recorded"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Category: </span>
								<span className="font-medium">
									{paymentSource.category.name}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Expected: </span>
								<span className="font-medium">
									{formatMinorUnits(
										paymentSource.expectedAmountMinorUnits ?? "0",
										family.defaultCurrency,
									)}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Left now: </span>
								<span className="font-medium">
									{formatMinorUnits(
										paymentAmountMinorUnits ?? "0",
										family.defaultCurrency,
									)}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Due date: </span>
								<span className="font-medium">
									{paymentSource.dueDate
										? formatDate(paymentSource.dueDate)
										: "-"}
								</span>
							</div>
						</div>
					</div>
				) : null}

				<form
					id="income-payment-form"
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4 py-4"
				>
					{error ? (
						<div className="font-medium text-destructive text-sm">{error}</div>
					) : null}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<CommonFormField
							control={form.control}
							name="amountMinorUnits"
							label={`Amount paid now (${family.defaultCurrency})`}
							fieldType="money"
							currency={family.defaultCurrency}
							placeholder="e.g. 150,000"
							description="Enter only what was paid now."
							required
						/>

						<CommonFormField
							control={form.control}
							name="date"
							label="Payment date"
							fieldType="date"
							required
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<CommonFormField
							control={form.control}
							name="paymentMethod"
							label="Payment method"
							fieldType="select"
							selectOptions={[
								{ label: "Cash", value: "CASH" },
								{ label: "Mobile Money", value: "MOBILE_MONEY" },
								{ label: "Bank Transfer", value: "BANK_TRANSFER" },
								{ label: "Card", value: "CARD" },
								{ label: "Cheque", value: "CHEQUE" },
								{ label: "Other", value: "OTHER" },
							]}
							placeholder="Select payment method"
							required
						/>

						<CommonFormField
							control={form.control}
							name="receivedBy"
							label="Received by"
							fieldType="select"
							selectOptions={family.members.map((member) => ({
								label: member.fullName,
								value: member.fullName,
							}))}
							placeholder="Select member"
						/>
					</div>

					<CommonFormField
						control={form.control}
						name="receivedFromContactId"
						label="Person who paid"
						fieldType="select"
						selectOptions={payerOptions}
						placeholder={
							activeContacts.length === 0
								? "No active contacts"
								: "Select payer contact"
						}
						description="Defaults to the last payer saved on this recurring income."
						disabled={activeContacts.length === 0}
					/>

					<CommonFormField
						control={form.control}
						name="notes"
						label="Payment note"
						fieldType="textarea"
						placeholder="e.g. Paid before due date, balance will come later"
					/>

					<CommonFormField
						control={form.control}
						name="fileName"
						label="Receipt/Proof (Mock Upload)"
						type="file"
						description="Upload proof of this payment"
					/>
				</form>

				<DialogFooter>
					<Button
						type="submit"
						form="income-payment-form"
						disabled={isPending || !paymentSource}
						className="w-full"
					>
						{isPending ? "Recording..." : "Record payment"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
