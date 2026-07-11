"use client";

import { ListIcon, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { DataViewMode } from "@/hooks/use-persistent-view-mode";

type DataViewToggleProps = {
  value: DataViewMode;
  onValueChange: (value: DataViewMode) => void;
};

export function DataViewToggle({ value, onValueChange }: DataViewToggleProps) {
  return (
    <ButtonGroup aria-label="Choose data view">
      <Button
        aria-pressed={value === "table"}
        size="sm"
        type="button"
        variant={value === "table" ? "secondary" : "outline"}
        onClick={() => onValueChange("table")}
      >
        <TableIcon aria-hidden="true" data-icon="inline-start" />
        Table
      </Button>
      <Button
        aria-pressed={value === "items"}
        size="sm"
        type="button"
        variant={value === "items" ? "secondary" : "outline"}
        onClick={() => onValueChange("items")}
      >
        <ListIcon aria-hidden="true" data-icon="inline-start" />
        Items
      </Button>
    </ButtonGroup>
  );
}
