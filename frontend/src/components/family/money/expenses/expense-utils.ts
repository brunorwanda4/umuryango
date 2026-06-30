import type {
  ExpenseFormValues,
  ExpenseLinkOptions,
} from "./types-and-schemas";

export function formatPaymentMethod(value: string | null | undefined) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getLinkedBudgetName(
  value: string | undefined,
  linkOptions: ExpenseLinkOptions,
) {
  if (!value || value === "none") return "";

  return (
    linkOptions.budgets.find(
      (budget) => (budget.id ?? budget.categoryName) === value,
    )?.categoryName ?? value
  );
}

export function getLinkedProjectName(
  value: string | undefined,
  linkOptions: ExpenseLinkOptions,
) {
  if (!value || value === "none") return "";

  return (
    linkOptions.projects.find((project) => project.id === value)?.name ?? value
  );
}

export function withLinkedContext(
  values: ExpenseFormValues,
  linkOptions: ExpenseLinkOptions,
) {
  const budgetName = getLinkedBudgetName(values.budgetId, linkOptions);
  const projectName = getLinkedProjectName(values.projectId, linkOptions);
  const lines = [values.notes?.trim()].filter(Boolean);

  if (budgetName) lines.push(`Linked budget: ${budgetName}`);
  if (projectName) lines.push(`Linked project: ${projectName}`);
  if (values.status === "DRAFT") {
    lines.push("Requested status: Draft");
  }

  return lines.join("\n");
}

export function getNoteLinkValue(
  notes: string | null | undefined,
  label: string,
) {
  if (!notes) return "";

  const line = notes
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));

  return line?.slice(label.length + 1).trim() ?? "";
}
