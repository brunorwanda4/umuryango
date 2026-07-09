"use client";

import { CheckCircle2Icon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";

type ProjectCategory =
	| "house"
	| "vehicle"
	| "education"
	| "business"
	| "event"
	| "other";
type ContributionStrategy =
	| "equal_shares"
	| "pledges"
	| "monthly"
	| "as_available";

type CreateProjectFormValues = {
	name: string;
	category: ProjectCategory;
	targetAmount: string;
	startDate: string;
	targetDate: string;
	ownerMemberId: string;
	contributionStrategy: ContributionStrategy;
	expectedContributionAmount: string;
	participantNotes: string;
	description: string;
};

const projectCategoryOptions: { value: ProjectCategory; label: string }[] = [
	{ value: "house", label: "Build a house" },
	{ value: "vehicle", label: "Buy a vehicle" },
	{ value: "education", label: "Education support" },
	{ value: "business", label: "Family business" },
	{ value: "event", label: "Ceremony or event" },
	{ value: "other", label: "Other family plan" },
];

const contributionStrategyOptions: {
	value: ContributionStrategy;
	label: string;
}[] = [
	{ value: "equal_shares", label: "Equal shares" },
	{ value: "pledges", label: "Member pledges" },
	{ value: "monthly", label: "Monthly contribution" },
	{ value: "as_available", label: "As available" },
];

export function CreateProjectDialog({
	currency,
	family,
	onProjectCreated,
}: {
	currency: string;
	family: FamilyDetail;
	onProjectCreated: () => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<PlusIcon aria-hidden="true" data-icon="inline-start" />
					New project
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl md:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Create a family project</DialogTitle>
					<DialogDescription>
						Add a plan with a target amount, dates, responsible member, and
						contribution approach.
					</DialogDescription>
				</DialogHeader>
				<CreateProjectForm
					currency={currency}
					family={family}
					onCreated={() => {
						setOpen(false);
						onProjectCreated();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

function CreateProjectForm({
	currency,
	family,
	onCreated,
}: {
	currency: string;
	family: FamilyDetail;
	onCreated: () => void;
}) {
	const schema = useMemo(() => createProjectSchema(currency), [currency]);
	const memberOptions = useMemo(
		() => [
			{ value: "unassigned", label: "Assign later" },
			...family.members.map((member) => ({
				value: member.id,
				label: member.fullName,
			})),
		],
		[family.members],
	);
	const defaultProjectDates = useMemo(() => getDefaultProjectDates(), []);
	const { form, onSubmit, error, success, isPending } =
		useZodFormSubmit<CreateProjectFormValues>({
			schema,
			formOptions: {
				defaultValues: {
					name: "",
					category: "house",
					targetAmount: "",
					startDate: defaultProjectDates.startDate,
					targetDate: defaultProjectDates.targetDate,
					ownerMemberId: "unassigned",
					contributionStrategy: "equal_shares",
					expectedContributionAmount: "",
					participantNotes: "",
					description: "",
				},
			},
			request: {
				method: "post",
				url: `/families/${encodeURIComponent(family.id)}/projects`,
				apiRequest: () => ({ idempotencyKey: crypto.randomUUID() }),
			},
			transform: (values) => {
				const expectedContributionMinorUnits = parseMoneyToMinorUnits(
					values.expectedContributionAmount,
					currency,
				);

				return {
					name: values.name.trim(),
					category: values.category,
					targetAmountMinorUnits: parseMoneyToMinorUnits(
						values.targetAmount,
						currency,
					),
					currency,
					startDate: values.startDate || null,
					targetDate: values.targetDate,
					ownerMemberId:
						values.ownerMemberId === "unassigned" ? null : values.ownerMemberId,
					contributionStrategy: values.contributionStrategy,
					expectedContributionMinorUnits,
					participantNotes: values.participantNotes.trim() || null,
					description: values.description.trim() || null,
				};
			},
			onSuccessMessage: "Project plan saved.",
			onSuccess: () => {
				form.reset();
				onCreated();
			},
			toastOnError: true,
			toastOnSuccess: true,
		});

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Could not save project</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{success ? (
				<Alert>
					<CheckCircle2Icon aria-hidden="true" />
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			) : null}

			<FieldGroup className=" grid grid-cols-2">
				<CommonFormField
					control={form.control}
					name="name"
					label="Project name"
					placeholder="Build family house"
					required
				/>
				<CommonFormField
					control={form.control}
					name="category"
					label="Project type"
					fieldType="select"
					selectOptions={projectCategoryOptions}
					required
				/>
				<CommonFormField
					control={form.control}
					name="targetAmount"
					label={`Target amount (${currency})`}
					placeholder={
						getCurrencyFractionDigits(currency) === 0 ? "5000000" : "50000.00"
					}
					required
					fieldType="money"
				/>

				<CommonFormField
					control={form.control}
					name="expectedContributionAmount"
					label={`Expected contribution per member (${currency})`}
					placeholder={
						getCurrencyFractionDigits(currency) === 0 ? "10000" : "100.00"
					}
					description="Optional. Use this for equal shares, monthly plans, or expected pledges."
					inputProps={{
						inputMode: "decimal",
						autoComplete: "off",
					}}
				/>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 col-span-2">
					<CommonFormField
						control={form.control}
						name="startDate"
						label="Start date"
						fieldType="date"
					/>
					<CommonFormField
						control={form.control}
						name="targetDate"
						label="Target date"
						fieldType="date"
						required
					/>
				</div>
				<CommonFormField
					control={form.control}
					name="ownerMemberId"
					label="Responsible member"
					fieldType="select"
					selectOptions={memberOptions}
				/>
				<CommonFormField
					control={form.control}
					name="contributionStrategy"
					label="Contribution approach"
					fieldType="select"
					selectOptions={contributionStrategyOptions}
					required
				/>

				<CommonFormField
					control={form.control}
					name="participantNotes"
					label="People and roles"
					fieldType="textarea"
					placeholder="Example: Jean leads construction follow-up, Alice tracks supplier receipts."
					textareaProps={{ rows: 3 }}
					fieldClassName="col-span-2"
				/>
				<CommonFormField
					control={form.control}
					name="description"
					label="Project notes"
					fieldType="textarea"
					placeholder="Add purpose, location, payment rules, documents needed, or approval notes."
					textareaProps={{ rows: 4 }}
					fieldClassName="col-span-2"
				/>
			</FieldGroup>

			<DialogFooter>
				<DialogClose asChild>
					<Button type="button" variant="outline">
						Cancel
					</Button>
				</DialogClose>
				<Button type="submit" disabled={isPending}>
					{isPending ? (
						<>
							<Spinner data-icon="inline-start" />
							Saving
						</>
					) : (
						"Save project"
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}

function createProjectSchema(currency: string) {
	return z.object({
		name: z.string().trim().min(2, "Project name is required."),
		category: z.enum([
			"house",
			"vehicle",
			"education",
			"business",
			"event",
			"other",
		]),
		targetAmount: z
			.string()
			.trim()
			.min(1, "Target amount is required.")
			.refine((value) => parseMoneyToMinorUnits(value, currency) !== null, {
				message: `Enter a valid ${currency} amount.`,
			}),
		startDate: z.string().optional().default(""),
		targetDate: z.string().min(1, "Target date is required."),
		ownerMemberId: z.string().min(1).default("unassigned"),
		contributionStrategy: z.enum([
			"equal_shares",
			"pledges",
			"monthly",
			"as_available",
		]),
		expectedContributionAmount: z
			.string()
			.trim()
			.optional()
			.default("")
			.refine(
				(value) => !value || parseMoneyToMinorUnits(value, currency) !== null,
				{ message: `Enter a valid ${currency} contribution amount.` },
			),
		participantNotes: z.string().trim().max(1000).optional().default(""),
		description: z.string().trim().max(1000).optional().default(""),
	});
}

function parseMoneyToMinorUnits(value: string, currency: string) {
	const normalized = value.trim().replaceAll(",", "");

	if (!normalized) {
		return null;
	}

	if (!/^\d+(\.\d+)?$/.test(normalized)) {
		return null;
	}

	const fractionDigits = getCurrencyFractionDigits(currency);
	const [major, minor = ""] = normalized.split(".");

	if (minor.length > fractionDigits) {
		return null;
	}

	const paddedMinor = minor.padEnd(fractionDigits, "0");
	const combined = `${major}${paddedMinor}`.replace(/^0+(?=\d)/, "");

	return combined || "0";
}

function getCurrencyFractionDigits(currency: string) {
	try {
		const maximumFractionDigits = new Intl.NumberFormat("en", {
			currency,
			style: "currency",
		}).resolvedOptions().maximumFractionDigits;

		return typeof maximumFractionDigits === "number"
			? maximumFractionDigits
			: 2;
	} catch {
		return 2;
	}
}

function getDefaultProjectDates() {
	const today = new Date();

	return {
		startDate: formatDateInputValue(addCalendarMonths(today, 1)),
		targetDate: formatDateInputValue(addCalendarMonths(today, 12)),
	};
}

function addCalendarMonths(date: Date, monthOffset: number) {
	const target = new Date(date);
	const dayOfMonth = target.getDate();

	target.setDate(1);
	target.setMonth(target.getMonth() + monthOffset);

	const lastDayOfTargetMonth = new Date(
		target.getFullYear(),
		target.getMonth() + 1,
		0,
	).getDate();

	target.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));

	return target;
}

function formatDateInputValue(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}
