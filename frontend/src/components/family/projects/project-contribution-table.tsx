import type { ColumnDef } from "@tanstack/react-table";
import { HandCoinsIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { StatusBadge, TableEmptyState } from "./projects-ui-helpers";
import type { ProjectContributionRow, ProjectsOverview } from "./types";
import { formatDate } from "./utils";

const t = createTranslator("FamilyProjects");
const tCommon = createTranslator("Common");
const tDashboard = createTranslator("FamilyDashboard");

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
      header: t("projectColumn"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.projectName}</span>
      ),
    },
    {
      accessorKey: "contributorName",
      header: t("contributorColumn"),
    },
    {
      accessorKey: "paidAt",
      header: tCommon("date"),
      cell: ({ row }) => formatDate(row.original.paidAt),
    },
    {
      accessorKey: "status",
      header: tCommon("status"),
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "pending"} />
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">{tCommon("amount")}</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          <CompactMoney
            currency={currency}
            emptyLabel={tDashboard("noRecords")}
            value={row.original.amountMinorUnits}
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("projectContributionsTitle")}</CardTitle>
        <CardDescription>{t("projectContributionsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {contributions.length ? (
          <CommonDataTable columns={columns} data={contributions} />
        ) : (
          <TableEmptyState
            description={t("noProjectContributionsDesc")}
            icon={HandCoinsIcon}
            title={t("noProjectContributionsTitle")}
          />
        )}
      </CardContent>
    </Card>
  );
}
