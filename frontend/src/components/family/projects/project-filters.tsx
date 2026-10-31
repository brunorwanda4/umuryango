import { ClipboardListIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
import type { ProjectStatusFilter } from "./types";

const t = createTranslator("FamilyProjects");

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
          <p className="font-medium text-sm">
            {t((m) => m.FamilyProjects.projectStatus)}
          </p>
          <p className="text-muted-foreground text-xs">
            {t((m) => m.FamilyProjects.currentView, { status: statusLabel })}
          </p>
        </div>
      </div>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as ProjectStatusFilter)}
      >
        <SelectTrigger
          className="w-full sm:w-44"
          aria-label={t((m) => m.FamilyProjects.projectStatus)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="active">
              {t((m) => m.FamilyProjects.statusActive)}
            </SelectItem>
            <SelectItem value="planned">
              {t((m) => m.FamilyProjects.statusPlanned)}
            </SelectItem>
            <SelectItem value="completed">
              {t((m) => m.FamilyProjects.statusCompleted)}
            </SelectItem>
            <SelectItem value="all">
              {t((m) => m.FamilyProjects.statusAll)}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </section>
  );
}
