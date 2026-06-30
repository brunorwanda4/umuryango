import {
	ArchiveIcon,
	FolderCogIcon,
	MoreHorizontalIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatOptionalMoney } from "../utils";
import { CategoryIcon } from "./category-icon";
import {
	type CategoryStatus,
	formatCategoryStatus,
	formatCategoryType,
	type MoneyCategory,
} from "./types-and-constants";

const categorySkeletonKeys = ["category-1", "category-2", "category-3"];
const categoryCountFormatter = new Intl.NumberFormat("en");

export function CategoryTable({
	apiMessage,
	categories,
	currency,
	loading,
	onArchive,
	onDelete,
	onEdit,
}: {
	apiMessage?: string;
	categories: MoneyCategory[];
	currency: string;
	loading: boolean;
	onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
	onDelete: (category: MoneyCategory) => void;
	onEdit: (category: MoneyCategory) => void;
}) {
	return (
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle>Category master data</CardTitle>
				<CardDescription>
					Reusable income and expense categories selected by the transaction,
					budget, receipt, and reporting workflows.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex min-w-0 flex-col gap-3">
				{apiMessage ? (
					<p className="text-muted-foreground text-sm">{apiMessage}</p>
				) : null}
				{loading ? (
					<CategoryCardSkeleton />
				) : categories.length ? (
					<section
						aria-label="Category list"
						className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3"
					>
						{categories.map((category) => (
							<CategoryCard
								category={category}
								currency={currency}
								key={category.id}
								onArchive={onArchive}
								onDelete={onDelete}
								onEdit={onEdit}
							/>
						))}
					</section>
				) : (
					<Empty className="min-h-64">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<FolderCogIcon aria-hidden="true" />
							</EmptyMedia>
							<EmptyTitle>No categories found</EmptyTitle>
							<EmptyDescription>
								Adjust the filters or create a category for income, expenses,
								budgets, receipts, and reports.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</CardContent>
		</Card>
	);
}

function CategoryCard({
	category,
	currency,
	onArchive,
	onDelete,
	onEdit,
}: {
	category: MoneyCategory;
	currency: string;
	onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
	onDelete: (category: MoneyCategory) => void;
	onEdit: (category: MoneyCategory) => void;
}) {
	return (
		<Card className="min-w-0" size="sm">
			<CardHeader className="gap-3">
				<div className="flex min-w-0 items-start gap-3">
					<CategoryIcon category={category} />
					<div className="min-w-0 flex-1">
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<CardTitle className="truncate">{category.name}</CardTitle>
							{category.isDefault ? (
								<Badge variant="secondary">Default</Badge>
							) : null}
						</div>
						<CardDescription className="mt-1 truncate">
							Created by {category.createdBy}
						</CardDescription>
					</div>
				</div>
				<CardAction>
					<CategoryActions
						category={category}
						onArchive={onArchive}
						onDelete={onDelete}
						onEdit={onEdit}
					/>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={category.type === "INCOME" ? "secondary" : "outline"}>
						{formatCategoryType(category.type)}
					</Badge>
					<Badge
						variant={category.status === "ACTIVE" ? "outline" : "secondary"}
					>
						{formatCategoryStatus(category.status)}
					</Badge>
				</div>
				<p className="line-clamp-3 min-h-15 text-muted-foreground text-sm leading-5">
					{category.description}
				</p>
				<dl className="grid grid-cols-2 gap-3 text-sm">
					<CategoryMetric
						label="Transactions"
						value={categoryCountFormatter.format(category.transactionsCount)}
					/>
					<CategoryMetric
						label="Total amount"
						value={formatOptionalMoney(category.totalMinorUnits, currency)}
					/>
					<CategoryMetric
						label="Last updated"
						value={formatDate(category.updatedAt)}
					/>
				</dl>
			</CardContent>
		</Card>
	);
}

function CategoryMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<dt className="text-muted-foreground text-xs">{label}</dt>
			<dd className="truncate font-mono text-sm">{value}</dd>
		</div>
	);
}

function CategoryActions({
	category,
	onArchive,
	onDelete,
	onEdit,
}: {
	category: MoneyCategory;
	onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
	onDelete: (category: MoneyCategory) => void;
	onEdit: (category: MoneyCategory) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={`Open actions for ${category.name}`}
					size="icon-sm"
					variant="ghost"
				>
					<MoreHorizontalIcon aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className=" min-w-40">
				<DropdownMenuLabel>Category actions</DropdownMenuLabel>
				<DropdownMenuGroup>
					<DropdownMenuItem onSelect={() => onEdit(category)}>
						<PencilIcon aria-hidden="true" data-icon="inline-start" />
						Edit category
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() =>
							onArchive(
								category,
								category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
							)
						}
					>
						<ArchiveIcon aria-hidden="true" data-icon="inline-start" />
						{category.status === "ACTIVE" ? "Archive" : "Activate"}
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => onDelete(category)}
					>
						<Trash2Icon aria-hidden="true" data-icon="inline-start" />
						Delete category
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function CategoryCardSkeleton() {
	return (
		<div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{categorySkeletonKeys.map((key) => (
				<Skeleton className="h-56 w-full" key={key} />
			))}
		</div>
	);
}
