"use client";

import { ListIcon, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { DataViewMode } from "@/hooks/use-persistent-view-mode";
import { createTranslator } from "@/i18n/translate";

type DataViewToggleProps = {
  value: DataViewMode;
  onValueChange: (value: DataViewMode) => void;
};

export function DataViewToggle({ value, onValueChange }: DataViewToggleProps) {
  const t = createTranslator("Common");

  return (
    <ButtonGroup aria-label={t((m) => m.Common.chooseView)}>
      <Button
        aria-pressed={value === "table"}
        size="sm"
        type="button"
        variant={value === "table" ? "secondary" : "outline"}
        onClick={() => onValueChange("table")}
      >
        <TableIcon aria-hidden="true" data-icon="inline-start" />
        {t((m) => m.Common.tableView)}
      </Button>
      <Button
        aria-pressed={value === "items"}
        size="sm"
        type="button"
        variant={value === "items" ? "secondary" : "outline"}
        onClick={() => onValueChange("items")}
      >
        <ListIcon aria-hidden="true" data-icon="inline-start" />
        {t((m) => m.Common.itemsView)}
      </Button>
    </ButtonGroup>
  );
}
