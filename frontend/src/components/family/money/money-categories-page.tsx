"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { CategoryDeleteDialog } from "./categories/category-delete-dialog";
import { CategoryFilters } from "./categories/category-filters";
import { CategoryStatsCards } from "./categories/category-stats-cards";
import { CategoryTable } from "./categories/category-table";
import { EditCategoryDialog } from "./categories/edit-category-dialog";
import {
  type ApiCategory,
  type CategorySort,
  type CategoryStatus,
  type CategoryType,
  demoCategories,
  enrichApiCategories,
  filterAndSortCategories,
  getCategoryStats,
  type MoneyCategory,
  todayIso,
} from "./categories/types-and-constants";
import { FamilyMoneyPageData } from "./family-money-page-data";
import { CreateCategoryForm } from "./forms/create-category-form";
import type { MoneyOverview } from "./types";

export function MoneyCategoriesPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money }) => (
        <MoneyCategoriesWorkspace
          currency={currency}
          familyId={family.id}
          money={money}
        />
      )}
    </FamilyMoneyPageData>
  );
}

function MoneyCategoriesWorkspace({
  currency,
  familyId,
  money,
}: {
  currency: string;
  familyId: string;
  money: MoneyOverview | null;
}) {
  const t = createTranslator("FamilyCategories");
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
        setApiMessage(t((m) => m.FamilyCategories.demoNotice));
      } else {
        setCategories(demoCategories);
        setApiMessage(
          response.message ?? t((m) => m.FamilyCategories.unavailableNotice),
        );
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [familyId, money, t]);

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
        ? t((m) => m.FamilyCategories.activeAgain, { name: category.name })
        : t((m) => m.FamilyCategories.archived, { name: category.name }),
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
        toast.error(
          response.message ?? t((m) => m.FamilyCategories.deleteFailed),
        );
        return;
      }
    }

    setCategories((currentCategories) =>
      currentCategories.filter((item) => item.id !== deleteCategory.id),
    );
    toast.success(
      t((m) => m.FamilyCategories.deleted, { name: deleteCategory.name }),
    );
    setDeleteCategory(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={t((m) => m.FamilyCategories.pageTitle)}
        description={t((m) => m.FamilyCategories.pageDescription)}
        actions={
          <CreateCategoryForm
            existingCategories={categories}
            familyId={familyId}
          />
        }
      />
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
        search={search}
        onSearchChange={setSearch}
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
    </div>
  );
}
