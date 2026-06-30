import { ClipboardListIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectStatusFilter } from "./types";

export function ProjectFilters({
  onStatusChange,
  status,
  statusLabel,
}: {
  onStatusChange: (status: ProjectStatusFilter) => void;
  status: ProjectStatusFilter;
  statusLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <ClipboardListIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Project status</p>
          <p className="text-muted-foreground text-xs">
            Current view: {statusLabel}
          </p>
        </div>
      </div>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as ProjectStatusFilter)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Project status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All projects</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </section>
  );
}
