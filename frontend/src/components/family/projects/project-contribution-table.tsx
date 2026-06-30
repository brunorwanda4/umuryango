import type { ColumnDef } from "@tanstack/react-table";
import { HandCoinsIcon } from "lucide-react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, TableEmptyState } from "./projects-ui-helpers";
import type { ProjectContributionRow, ProjectsOverview } from "./types";
import { formatDate, formatOptionalMoney } from "./utils";

export function ProjectContributionTable({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectsOverview | null;
}) {
  const contributions = projects?.contributions ?? [];
  const columns: ColumnDef<ProjectContributionRow>[] = [
    {
      accessorKey: "projectName",
      header: "Project",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.projectName}</span>
      ),
    },
    {
      accessorKey: "contributorName",
      header: "Contributor",
    },
    {
      accessorKey: "paidAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.paidAt),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "pending"} />
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.amountMinorUnits, currency)}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project contributions</CardTitle>
        <CardDescription>
          Contributions linked to a family project and verified by the backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contributions.length ? (
          <CommonDataTable columns={columns} data={contributions} />
        ) : (
          <TableEmptyState
            description="Member payments and pledges connected to projects will show here once saved."
            icon={HandCoinsIcon}
            title="No project contributions returned"
          />
        )}
      </CardContent>
    </Card>
  );
}
