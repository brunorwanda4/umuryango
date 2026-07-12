import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MoneyCategory } from "./types-and-constants";

export function CategoryDeleteDialog({
	category,
	onConfirm,
	onOpenChange,
}: {
	category: MoneyCategory | null;
	onConfirm: () => void;
	onOpenChange: (open: boolean) => void;
}) {
	const isUsed = Boolean(category && category.transactionsCount > 0);

	return (
		<AlertDialog
			open={Boolean(category)}
			onOpenChange={onOpenChange}
			searchParamValue={`delete-category-${category?.id}`}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isUsed
							? "Archive this category instead?"
							: "Delete this category?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isUsed
							? `${category?.name} is used by ${category?.transactionsCount} transactions. Categories already used by transactions cannot be deleted because reports and audit history must remain intact. Archive it to prevent future use.`
							: `${category?.name} has no transactions using it. Deleting removes it from the reusable category list.`}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						{isUsed ? "Archive category" : "Delete category"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
