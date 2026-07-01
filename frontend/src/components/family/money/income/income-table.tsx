import {
	CheckCircleIcon,
	CoinsIcon,
	EyeIcon,
	LockIcon,
	MoreVerticalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UploadIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate, formatMinorUnits } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

export function IncomeTable({
	filteredTransactions,
	currency,
	isAdmin,
	family,
	handleActionClick,
	handleSendApproval,
	setOpenCreate,
}: {
	filteredTransactions: IncomeTransaction[];
	currency: string;
	isAdmin: boolean;
	family: FamilyDetail;
	handleActionClick: (
		tx: IncomeTransaction,
		action: "view" | "edit" | "delete" | "receipt",
	) => void;
	handleSendApproval: (tx: IncomeTransaction) => void;
	setOpenCreate: (open: boolean) => void;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle>Income History</CardTitle>
				<CardDescription>
					List of all incoming money recorded for this family.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{filteredTransactions.length > 0 ? (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Title</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Received From</TableHead>
									<TableHead>Payment Method</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Added By</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTransactions.map((tx) => {
									const txIsApproved = tx.status === "APPROVED";
									const canEditThisTx = !txIsApproved || isAdmin;

									return (
										<TableRow key={tx.id}>
											<TableCell className="whitespace-nowrap">
												{formatDate(tx.date)}
											</TableCell>
											<TableCell className="font-medium max-w-[180px] truncate">
												{tx.description || "Income Transaction"}
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{tx.category.name}
											</TableCell>
											<TableCell className="font-mono whitespace-nowrap">
												{formatMinorUnits(tx.amountMinorUnits, currency)}
											</TableCell>
											<TableCell className="truncate max-w-[150px]">
												{tx.receivedFrom || "—"}
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{tx.paymentMethod
													? tx.paymentMethod.replace("_", " ")
													: "—"}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														tx.status === "APPROVED"
															? "default"
															: tx.status === "PENDING"
																? "secondary"
																: tx.status === "REJECTED"
																	? "destructive"
																	: "outline"
													}
												>
													{tx.status}
												</Badge>
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{tx.createdBy.fullName}
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<MoreVerticalIcon className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleActionClick(tx, "view")}
														>
															<EyeIcon className="size-4 mr-2" />
															View Details
														</DropdownMenuItem>

														{canEditThisTx ? (
															<DropdownMenuItem
																onClick={() => handleActionClick(tx, "edit")}
															>
																<PencilIcon className="size-4 mr-2" />
																Edit Record
															</DropdownMenuItem>
														) : (
															<DropdownMenuItem
																disabled
																className="text-muted-foreground"
															>
																<LockIcon className="size-4 mr-2" />
																Locked (Approved)
															</DropdownMenuItem>
														)}

														<DropdownMenuItem
															onClick={() => handleActionClick(tx, "receipt")}
														>
															<UploadIcon className="size-4 mr-2" />
															Attach Receipt
														</DropdownMenuItem>

														{tx.status === "PENDING" &&
															hasCapability(family, "APPROVE_EXPENSE") && (
																<DropdownMenuItem
																	onClick={() => handleSendApproval(tx)}
																	className="text-primary font-medium"
																>
																	<CheckCircleIcon className="size-4 mr-2" />
																	Approve Income
																</DropdownMenuItem>
															)}

														<DropdownMenuItem
															onClick={() => handleActionClick(tx, "delete")}
															className="text-destructive focus:text-destructive"
														>
															<Trash2Icon className="size-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<span className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
							<CoinsIcon className="size-6 text-muted-foreground" />
						</span>
						<h3 className="font-semibold text-lg">No income recorded yet</h3>
						<p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
							Start by adding salary, business income, family contributions,
							gifts, donations, or other money received by the family.
						</p>
						{hasCapability(family, "RECORD_INCOME") && (
							<Button size="sm" onClick={() => setOpenCreate(true)}>
								<PlusIcon aria-hidden="true" data-icon="inline-start" />
								Add Income
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
