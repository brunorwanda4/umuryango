import {
  ArchiveIcon,
  FolderCogIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { createTranslator } from "@/i18n/translate";
import { formatDate } from "../utils";
import { CategoryIcon } from "./category-icon";
import { CategorySearch } from "./category-search";
import {
  type CategoryStatus,
  formatCategoryStatus,
  formatCategoryType,
  type MoneyCategory,
} from "./types-and-constants";

const categorySkeletonKeys = ["category-1", "category-2", "category-3"];
const categoryCountFormatter = new Intl.NumberFormat("en");

export function CategoryTable({
  apiMessage,
  categories,
  currency,
  loading,
  onArchive,
  onDelete,
  onEdit,
  search,
  onSearchChange,
}: {
  apiMessage?: string;
  categories: MoneyCategory[];
  currency: string;
  loading: boolean;
  onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
  onDelete?: (category: MoneyCategory) => void;
  onEdit: (category: MoneyCategory) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const t = createTranslator("FamilyCategories");

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t((m) => m.FamilyCategories.masterDataTitle)}</CardTitle>
        <CategorySearch
          value={search}
          onChange={onSearchChange}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {apiMessage ? (
          <p className="text-muted-foreground text-sm">{apiMessage}</p>
        ) : null}
        {loading ? (
          <CategoryCardSkeleton />
        ) : categories.length ? (
          <section
            aria-label={t((m) => m.FamilyCategories.categoryListAria)}
            className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3"
          >
            {categories.map((category) => (
              <CategoryCard
                category={category}
                currency={currency}
                key={category.id}
                onArchive={onArchive}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </section>
        ) : (
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderCogIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {t((m) => m.FamilyCategories.table.noCategoriesTitle)}
              </EmptyTitle>
              <EmptyDescription>
                {t((m) => m.FamilyCategories.table.noCategoriesDesc)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryCard({
  category,
  currency,
  onArchive,
  onDelete,
  onEdit,
}: {
  category: MoneyCategory;
  currency: string;
  onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
  onDelete?: (category: MoneyCategory) => void;
  onEdit: (category: MoneyCategory) => void;
}) {
  const t = createTranslator("FamilyCategories");

  return (
    <Card className="min-w-0" size="sm">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CategoryIcon category={category} />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CardTitle className="truncate">{category.name}</CardTitle>
              {category.isDefault ? (
                <Badge variant="secondary">
                  {t((m) => m.FamilyCategories.defaultBadge)}
                </Badge>
              ) : null}
            </div>
            <CardDescription className="mt-1 truncate">
              {t((m) => m.FamilyCategories.createdBy, {
                name: category.createdBy,
              })}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <CategoryActions
            category={category}
            onArchive={onArchive}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={category.type === "INCOME" ? "secondary" : "outline"}>
            {formatCategoryType(category.type)}
          </Badge>
          <Badge
            variant={category.status === "ACTIVE" ? "outline" : "secondary"}
          >
            {formatCategoryStatus(category.status)}
          </Badge>
        </div>
        <p className="line-clamp-3 min-h-15 text-muted-foreground text-sm leading-5">
          {category.description}
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <CategoryMetric
            label={t((m) => m.FamilyCategories.metricTransactions)}
            value={categoryCountFormatter.format(category.transactionsCount)}
          />
          <CategoryMetric
            label={t((m) => m.FamilyCategories.metricTotalAmount)}
            value={
              <CompactMoney
                currency={currency}
                emptyLabel={t((m) => m.FamilyCategories.noRecords)}
                value={category.totalMinorUnits}
              />
            }
          />
          <CategoryMetric
            label={t((m) => m.FamilyCategories.metricLastUpdated)}
            value={formatDate(category.updatedAt)}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function CategoryMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate font-mono text-sm">{value}</dd>
    </div>
  );
}

function CategoryActions({
  category,
  onArchive,
  onDelete,
  onEdit,
}: {
  category: MoneyCategory;
  onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
  onDelete?: (category: MoneyCategory) => void;
  onEdit: (category: MoneyCategory) => void;
}) {
  const t = createTranslator("FamilyCategories");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t((m) => m.FamilyCategories.actionsAria, {
            name: category.name,
          })}
          size="icon-sm"
          variant="ghost"
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className=" min-w-40">
        <DropdownMenuLabel>
          {t((m) => m.FamilyCategories.categoryActions)}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onEdit(category)}>
            <PencilIcon aria-hidden="true" data-icon="inline-start" />
            {t((m) => m.FamilyCategories.table.edit)}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              onArchive(
                category,
                category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              )
            }
          >
            <ArchiveIcon aria-hidden="true" data-icon="inline-start" />
            {category.status === "ACTIVE"
              ? t((m) => m.FamilyCategories.archiveAction)
              : t((m) => m.FamilyCategories.activateAction)}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(category)}
              >
                <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                {t((m) => m.FamilyCategories.table.delete)}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {categorySkeletonKeys.map((key) => (
        <Skeleton className="h-56 w-full" key={key} />
      ))}
    </div>
  );
}
