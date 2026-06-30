import { HandCoinsIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, TableEmptyState } from "./projects-ui-helpers";
import type { ProjectsOverview } from "./types";
import { formatDate, formatOptionalMoney } from "./utils";

export function ProjectContributionTable({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectsOverview | null;
}) {
  const contributions = projects?.contributions ?? [];

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Contributor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell className="font-medium">
                    {contribution.projectName}
                  </TableCell>
                  <TableCell>{contribution.contributorName}</TableCell>
                  <TableCell>{formatDate(contribution.paidAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={contribution.status ?? "pending"} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(
                      contribution.amountMinorUnits,
                      currency,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
