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
          <p className="font-medium text-sm">{t("projectStatus")}</p>
          <p className="text-muted-foreground text-xs">
            {t("currentView", { status: statusLabel })}
          </p>
        </div>
      </div>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as ProjectStatusFilter)}
      >
        <SelectTrigger
          className="w-full sm:w-44"
          aria-label={t("projectStatus")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="active">{t("statusActive")}</SelectItem>
            <SelectItem value="planned">{t("statusPlanned")}</SelectItem>
            <SelectItem value="completed">{t("statusCompleted")}</SelectItem>
            <SelectItem value="all">{t("statusAll")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </section>
  );
}
