"use client";

import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CurrentUser } from "@/hooks/use-current-user";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import type {
	ContactListResponse,
	FamilyContact,
} from "../contacts/types-and-schemas";
import type { FamilyDetail } from "../dashboard/types";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { AttachReceiptDialog } from "./income/attach-receipt-dialog";
import { CreateIncomeDialog } from "./income/create-income-dialog";
import { DeleteTransactionDialog } from "./income/delete-transaction-dialog";
import { EditIncomeDialog } from "./income/edit-income-dialog";
import { EveryTimeIncomePanel } from "./income/every-time-income-panel";
import { IncomeFilters } from "./income/income-filters";
import { IncomeMetricCards } from "./income/income-metric-cards";
import { IncomeTable } from "./income/income-table";
import { OneTimeIncomePanel } from "./income/one-time-income-panel";
import type { Category, IncomeTransaction } from "./income/types-and-schemas";
import { ViewDetailsDialog } from "./income/view-details-dialog";

export type MoneyIncomePageInitialData = {
	family: FamilyDetail | null;
	transactions: IncomeTransaction[];
	categories: Category[];
	contacts: FamilyContact[];
	currentUser: CurrentUser | null;
	error: string | null;
};

export function MoneyIncomePage({
	familyName,
	initialData,
}: {
	familyName: string;
	initialData?: MoneyIncomePageInitialData;
}) {
	const [family, setFamily] = useState<FamilyDetail | null>(
		initialData?.family ?? null,
	);
	const [transactions, setTransactions] = useState<IncomeTransaction[]>(
		initialData?.transactions ?? [],
	);
	const [categories, setCategories] = useState<Category[]>(
		initialData?.categories ?? [],
	);
	const [contacts, setContacts] = useState<FamilyContact[]>(
		initialData?.contacts ?? [],
	);
	const [loading, setLoading] = useState(!initialData);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(initialData?.error ?? null);

	// Modals state
	const [openCreate, setOpenCreate] = useState(false);
	const [openEdit, setOpenEdit] = useState(false);
	const [openView, setOpenView] = useState(false);
	const [openReceipt, setOpenReceipt] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);

	const [selectedTx, setSelectedTx] = useState<IncomeTransaction | null>(null);

	// Filters state
	const [search, setSearch] = useState("");
	const [filterCategory, setFilterCategory] = useState("all");
	const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterMember, setFilterMember] = useState("all");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const fetchData = useCallback(
		async ({ showSkeleton = true }: { showSkeleton?: boolean } = {}) => {
			try {
				if (showSkeleton) {
					setLoading(true);
				} else {
					setIsRefreshing(true);
				}
				setError(null);

				const familyResponse = await apiRequest<undefined, FamilyDetail>(
					"get",
					`/families/${encodeURIComponent(familyName)}`,
				);
				if (!familyResponse.ok || !familyResponse.data) {
					throw new Error(familyResponse.message ?? "Failed to load family.");
				}
				const familyData = familyResponse.data;
				setFamily(familyData);

				const [txResponse, categoriesResponse, contactsResponse] =
					await Promise.all([
						apiRequest<undefined, IncomeTransaction[]>(
							"get",
							`/families/${encodeURIComponent(
								familyData.id,
							)}/money/transactions?type=INCOME`,
						),
						apiRequest<undefined, Category[]>(
							"get",
							`/families/${encodeURIComponent(familyData.id)}/money/categories`,
						),
						apiRequest<undefined, ContactListResponse>(
							"get",
							`/families/${encodeURIComponent(
								familyData.id,
							)}/contacts?limit=100&status=ACTIVE`,
						),
					]);

				setTransactions(txResponse.ok ? (txResponse.data ?? []) : []);
				setCategories(
					categoriesResponse.ok && categoriesResponse.data
						? categoriesResponse.data.filter((c) => c.type === "INCOME")
						: [],
				);
				setContacts(
					contactsResponse.ok && contactsResponse.data
						? (contactsResponse.data.items ?? [])
						: [],
				);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred.");
			} finally {
				setLoading(false);
				setIsRefreshing(false);
			}
		},
		[familyName],
	);

	const refreshTransactions = useCallback(async () => {
		if (!family) {
			await fetchData({ showSkeleton: false });
			return;
		}

		try {
			setIsRefreshing(true);
			const txResponse = await apiRequest<undefined, IncomeTransaction[]>(
				"get",
				`/families/${encodeURIComponent(
					family.id,
				)}/money/transactions?type=INCOME`,
			);

			if (txResponse.ok) {
				setTransactions(txResponse.data ?? []);
			} else {
				toast.error(txResponse.message ?? "Income records could not refresh.");
			}
		} catch {
			toast.error("Income records could not refresh.");
		} finally {
			setIsRefreshing(false);
		}
	}, [family, fetchData]);

	const refreshCategories = useCallback(
		async (createdCategory?: Category) => {
			if (!family) {
				await fetchData({ showSkeleton: false });
				return;
			}

			try {
				setIsRefreshing(true);
				if (createdCategory?.type === "INCOME") {
					setCategories((currentCategories) =>
						currentCategories.some(
							(category) => category.id === createdCategory.id,
						)
							? currentCategories
							: [createdCategory, ...currentCategories],
					);
				}

				const categoriesResponse = await apiRequest<undefined, Category[]>(
					"get",
					`/families/${encodeURIComponent(family.id)}/money/categories`,
				);

				if (categoriesResponse.ok) {
					setCategories(
						(categoriesResponse.data ?? []).filter(
							(category) => category.type === "INCOME",
						),
					);
				} else {
					toast.error(
						categoriesResponse.message ??
							"Income categories could not refresh.",
					);
				}
			} catch {
				toast.error("Income categories could not refresh.");
			} finally {
				setIsRefreshing(false);
			}
		},
		[family, fetchData],
	);

	const refreshContacts = useCallback(
		async (createdContact?: FamilyContact) => {
			if (!family) {
				await fetchData({ showSkeleton: false });
				return;
			}

			try {
				setIsRefreshing(true);
				if (createdContact) {
					setContacts((currentContacts) =>
						currentContacts.some((contact) => contact.id === createdContact.id)
							? currentContacts
							: [createdContact, ...currentContacts],
					);
				}

				const contactsResponse = await apiRequest<
					undefined,
					ContactListResponse
				>(
					"get",
					`/families/${encodeURIComponent(
						family.id,
					)}/contacts?limit=100&status=ACTIVE`,
				);

				if (contactsResponse.ok) {
					setContacts(contactsResponse.data?.items ?? []);
				} else {
					toast.error(
						contactsResponse.message ??
							"Income payer contacts could not refresh.",
					);
				}
			} catch {
				toast.error("Income payer contacts could not refresh.");
			} finally {
				setIsRefreshing(false);
			}
		},
		[family, fetchData],
	);

	useEffect(() => {
		if (!initialData) {
			fetchData();
		}
	}, [fetchData, initialData]);

	const isAdmin = useMemo(() => {
		if (!family) return false;
		return family.authority === "HEAD" || family.authority === "ADMIN";
	}, [family]);

	// Filtering Logic
	const filteredTransactions = useMemo(() => {
		return transactions.filter((tx) => {
			// Search
			const searchMatch =
				!search ||
				tx.description?.toLowerCase().includes(search.toLowerCase()) ||
				tx.receivedFrom?.toLowerCase().includes(search.toLowerCase()) ||
				tx.propertyName?.toLowerCase().includes(search.toLowerCase());

			// Category
			const categoryMatch =
				filterCategory === "all" || tx.categoryId === filterCategory;

			// Payment Method
			const paymentMatch =
				filterPaymentMethod === "all" ||
				tx.paymentMethod === filterPaymentMethod;

			// Status
			const statusMatch = filterStatus === "all" || tx.status === filterStatus;

			// Member
			const memberMatch =
				filterMember === "all" || tx.receivedBy === filterMember;

			// Date Range
			let dateMatch = true;
			if (startDate) {
				dateMatch = dateMatch && new Date(tx.date) >= new Date(startDate);
			}
			if (endDate) {
				// Add 1 day to make range inclusive
				const endLimit = new Date(endDate);
				endLimit.setDate(endLimit.getDate() + 1);
				dateMatch = dateMatch && new Date(tx.date) < endLimit;
			}

			return (
				searchMatch &&
				categoryMatch &&
				paymentMatch &&
				statusMatch &&
				memberMatch &&
				dateMatch
			);
		});
	}, [
		transactions,
		search,
		filterCategory,
		filterPaymentMethod,
		filterStatus,
		filterMember,
		startDate,
		endDate,
	]);
	const everyTimeTransactions = useMemo(
		() =>
			filteredTransactions.filter(
				(transaction) => transaction.incomeRecurrence === "MONTHLY",
			),
		[filteredTransactions],
	);
	const oneTimeTransactions = useMemo(
		() =>
			filteredTransactions.filter(
				(transaction) => transaction.incomeRecurrence === "ONE_TIME",
			),
		[filteredTransactions],
	);

	const handleActionClick = (
		tx: IncomeTransaction,
		action: "view" | "edit" | "delete" | "receipt",
	) => {
		setSelectedTx(tx);
		if (action === "view") setOpenView(true);
		else if (action === "edit") setOpenEdit(true);
		else if (action === "delete") setOpenDelete(true);
		else if (action === "receipt") setOpenReceipt(true);
	};

	const handleSendApproval = async (tx: IncomeTransaction) => {
		if (!family) return;
		try {
			const res = await apiRequest(
				"post",
				`/families/${family.id}/money/transactions/${tx.id}/approve`,
			);
			if (res.ok) {
				toast.success("Income approved successfully.");
				await refreshTransactions();
			} else {
				toast.error(res.message ?? "Approval failed.");
			}
		} catch {
			toast.error("An error occurred during approval.");
		}
	};

	const resetFilters = () => {
		setSearch("");
		setFilterCategory("all");
		setFilterPaymentMethod("all");
		setFilterStatus("all");
		setFilterMember("all");
		setStartDate("");
		setEndDate("");
	};

	if (loading) return <FamilyMoneySkeleton />;
	if (error || !family) {
		return (
			<div className="p-6">
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="text-destructive flex items-center gap-2">
							<AlertCircleIcon className="size-5" />
							Failed to load income page
						</CardTitle>
						<CardDescription>
							{error || "Family workspace not found."}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const currency = family.defaultCurrency;

	return (
		<div
			className="flex min-w-0 max-w-full flex-col gap-6"
			aria-busy={isRefreshing}
		>
			<PageTitle
				title="Income"
				description="Manage all money coming into the family, including salary, business income, farming income, gifts, donations, rent income, and family contributions."
				actions={
					hasCapability(family, "RECORD_INCOME") && (
						<Button size="sm" onClick={() => setOpenCreate(true)}>
							<PlusIcon aria-hidden="true" data-icon="inline-start" />
							Add Income
						</Button>
					)
				}
			/>

			<Separator />

			{/* Summary Cards */}
			<IncomeMetricCards transactions={transactions} currency={currency} />

			{/* Filters Bar */}
			<IncomeFilters
				search={search}
				setSearch={setSearch}
				filterCategory={filterCategory}
				setFilterCategory={setFilterCategory}
				filterPaymentMethod={filterPaymentMethod}
				setFilterPaymentMethod={setFilterPaymentMethod}
				filterStatus={filterStatus}
				setFilterStatus={setFilterStatus}
				filterMember={filterMember}
				setFilterMember={setFilterMember}
				startDate={startDate}
				setStartDate={setStartDate}
				endDate={endDate}
				setEndDate={setEndDate}
				resetFilters={resetFilters}
				categories={categories}
				family={family}
			/>

			{/* Main Income Table */}
			<Tabs defaultValue="all">
				<TabsList>
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="every-time">Every Time</TabsTrigger>
					<TabsTrigger value="one-time">One Time</TabsTrigger>
				</TabsList>
				<TabsContent value="all">
					<IncomeTable
						filteredTransactions={filteredTransactions}
						currency={currency}
						isAdmin={isAdmin}
						family={family}
						handleActionClick={handleActionClick}
						handleSendApproval={handleSendApproval}
						setOpenCreate={setOpenCreate}
					/>
				</TabsContent>
				<TabsContent value="every-time">
					<EveryTimeIncomePanel
						transactions={everyTimeTransactions}
						currency={currency}
						isAdmin={isAdmin}
						family={family}
						handleActionClick={handleActionClick}
						handleSendApproval={handleSendApproval}
						setOpenCreate={setOpenCreate}
					/>
				</TabsContent>
				<TabsContent value="one-time">
					<OneTimeIncomePanel
						transactions={oneTimeTransactions}
						currency={currency}
						isAdmin={isAdmin}
						family={family}
						handleActionClick={handleActionClick}
						handleSendApproval={handleSendApproval}
						setOpenCreate={setOpenCreate}
					/>
				</TabsContent>
			</Tabs>

			{/* --- ADD INCOME MODAL --- */}
			<CreateIncomeDialog
				open={openCreate}
				onOpenChange={setOpenCreate}
				family={family}
				categories={categories}
				contacts={contacts}
				currentUser={initialData?.currentUser ?? null}
				onCategoriesChanged={refreshCategories}
				onContactsChanged={refreshContacts}
				onSuccess={refreshTransactions}
			/>

			{/* --- EDIT INCOME MODAL --- */}
			<EditIncomeDialog
				open={openEdit}
				onOpenChange={setOpenEdit}
				family={family}
				categories={categories}
				contacts={contacts}
				transaction={selectedTx}
				onCategoriesChanged={refreshCategories}
				onContactsChanged={refreshContacts}
				onSuccess={refreshTransactions}
			/>

			{/* --- ATTACH RECEIPT MODAL --- */}
			<AttachReceiptDialog
				open={openReceipt}
				onOpenChange={setOpenReceipt}
				family={family}
				transaction={selectedTx}
				onSuccess={refreshTransactions}
			/>

			{/* --- VIEW INCOME DETAILS MODAL --- */}
			<ViewDetailsDialog
				open={openView}
				onOpenChange={setOpenView}
				transaction={selectedTx}
				currency={currency}
			/>

			{/* --- DELETE/REVERSE TRANSACTION MODAL --- */}
			<DeleteTransactionDialog
				open={openDelete}
				onOpenChange={setOpenDelete}
				family={family}
				transaction={selectedTx}
				onSuccess={refreshTransactions}
			/>
		</div>
	);
}
