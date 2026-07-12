import {
	ArchiveIcon,
	BanknoteIcon,
	CircleIcon,
	FolderCogIcon,
	UtensilsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { getCategoryStats } from "./types-and-constants";

export function CategoryStatsCards({
	stats,
}: {
	stats: ReturnType<typeof getCategoryStats>;
}) {
	const cards = [
		{
			className: "rounded-2xl border-border/80 py-0 shadow-sm",
			description: "Total Categories",
			iconImage: "/images/icons/application.png",
			value:<span className="tabular-nums"> {stats.total}</span>,
		},
		{
			className: "rounded-2xl border-border/80 py-0 shadow-sm",
			description: "Income Categories",
			iconImage: "/images/icons/income.png",
			value: <span className="tabular-nums"> {stats.income}</span>,
		},
		{
			className: "rounded-2xl border-border/80 py-0 shadow-sm",
			description: "Expense Categories",
			iconImage: "/images/icons/expense.png",
			value: <span className="tabular-nums"> {stats.expense}</span>,
		},
		{
			className: "rounded-2xl border-border/80 py-0 shadow-sm",
			description: "Active Categories",
			iconImage: "/images/icons/checklist.png",
			value: <span className="tabular-nums"> {stats.active}</span>,
		},
		{
			className: "rounded-2xl border-border/80 py-0 shadow-sm",
			description: "Inactive Categories",
			iconImage: "/images/icons/sleep.png",
			value: <span className="tabular-nums"> {stats.inactive}</span>,
		},
	];
	return (
		<CommonOverviewCardDisplay
			cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium "
			cardFooterClassName="sm:mt-4 font-semibold text-sm"
			cardHeaderClassName="min-h-[10.75rem] flex-col items-start justify-between gap-4 p-5 sm:p-6"
			cardTitleClassName="sm:mt-2 whitespace-normal  leading-tight tracking-normal sm:text-3xl"
			className="grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4"
			iconPosition="start"
			cards={cards}
		/>
	);
}
