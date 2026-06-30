"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import apiRequest from "@/service/api";
import { FamilyMoneyPageData } from "./family-money-page-data";
import { CreateCategoryForm } from "./forms/create-category-form";
import { MoneySectionLayout } from "./money-section-layout";
import {
  type CategorySort,
  type CategoryStatus,
  type CategoryType,
  type MoneyCategory,
  type ApiCategory,
  categoryHeader,
  demoCategories,
  enrichApiCategories,
  filterAndSortCategories,
  getCategoryStats,
  todayIso,
} from "./categories/types-and-constants";
import { CategoryStatsCards } from "./categories/category-stats-cards";
import { CategoryFilters } from "./categories/category-filters";
import { CategoryTable } from "./categories/category-table";
import { EditCategoryDialog } from "./categories/edit-category-dialog";
import { CategoryDeleteDialog } from "./categories/category-delete-dialog";
import type { MoneyOverview } from "./types";

export function MoneyCategoriesPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money }) => (
        <MoneyCategoriesWorkspace
          currency={currency}
          familyId={family.id}
          family={family}
          money={money}
        />
      )}
    </FamilyMoneyPageData>
  );
}

function MoneyCategoriesWorkspace({
  currency,
  family,
  familyId,
  money,
}: {
  currency: string;
  family: Parameters<typeof MoneySectionLayout>[0]["family"];
  familyId: string;
  money: MoneyOverview | null;
}) {
  const [categories, setCategories] = useState<MoneyCategory[]>(demoCategories);
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState<string>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CategoryType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CategoryStatus>(
    "ALL",
  );
  const [sort, setSort] = useState<CategorySort>("updated-desc");
  const [editingCategory, setEditingCategory] = useState<MoneyCategory | null>(
    null,
  );
  const [deleteCategory, setDeleteCategory] = useState<MoneyCategory | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiRequest<undefined, ApiCategory[]>(
      "get",
      `/families/${encodeURIComponent(familyId)}/money/categories`,
    ).then((response) => {
      if (!active) return;

      if (response.ok && response.data?.length) {
        setCategories(enrichApiCategories(response.data, money));
        setApiMessage(undefined);
      } else if (response.ok) {
        setCategories(demoCategories);
        setApiMessage(
          "No saved categories were returned yet, so recommended Rwanda Family demo categories are shown.",
        );
      } else {
        setCategories(demoCategories);
        setApiMessage(
          response.message ??
            "Saved categories are not available, so demo categories are shown.",
        );
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [familyId, money]);

  const stats = useMemo(() => getCategoryStats(categories), [categories]);
  const visibleCategories = useMemo(
    () =>
      filterAndSortCategories(
        categories,
        search,
        typeFilter,
        statusFilter,
        sort,
      ),
    [categories, search, sort, statusFilter, typeFilter],
  );

  const setCategoryStatus = (
    category: MoneyCategory,
    status: CategoryStatus,
  ) => {
    setCategories((currentCategories) =>
      currentCategories.map((item) =>
        item.id === category.id
          ? { ...item, status, updatedAt: todayIso() }
          : item,
      ),
    );
    toast.success(
      status === "ACTIVE"
        ? `${category.name} is active again`
        : `${category.name} has been archived`,
    );
  };

  const confirmDelete = async () => {
    if (!deleteCategory) return;

    if (deleteCategory.transactionsCount > 0) {
      setDeleteCategory(null);
      setCategoryStatus(deleteCategory, "INACTIVE");
      return;
    }

    if (deleteCategory.source === "api") {
      const response = await apiRequest(
        "delete",
        `/families/${encodeURIComponent(familyId)}/money/categories/${deleteCategory.id}`,
      );

      if (!response.ok) {
        toast.error(response.message ?? "Category could not be deleted");
        return;
      }
    }

    setCategories((currentCategories) =>
      currentCategories.filter((item) => item.id !== deleteCategory.id),
    );
    toast.success(`${deleteCategory.name} deleted`);
    setDeleteCategory(null);
  };

  return (
    <MoneySectionLayout
      currency={currency}
      exampleDescription="Keep this master data clean so income and expense records stay consistent across reports, budgets, receipts, and approvals."
      family={family}
      header={categoryHeader}
      money={money}
      showMoneyMetrics={false}
      actionDialog={
        <CreateCategoryForm
          existingCategories={categories}
          familyId={familyId}
        />
      }
    >
      <CategoryStatsCards stats={stats} />
      <CategoryFilters
        search={search}
        setSearch={setSearch}
        setSort={setSort}
        setStatusFilter={setStatusFilter}
        setTypeFilter={setTypeFilter}
        sort={sort}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />
      <CategoryTable
        apiMessage={apiMessage}
        categories={visibleCategories}
        currency={currency}
        loading={loading}
        onArchive={setCategoryStatus}
        onDelete={setDeleteCategory}
        onEdit={setEditingCategory}
      />
      <EditCategoryDialog
        categories={categories}
        category={editingCategory}
        familyId={familyId}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        onUpdated={(category) => {
          setCategories((currentCategories) =>
            currentCategories.map((item) =>
              item.id === category.id ? category : item,
            ),
          );
          setEditingCategory(null);
        }}
      />
      <CategoryDeleteDialog
        category={deleteCategory}
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null);
        }}
      />
    </MoneySectionLayout>
  );
}
