import React, { useState } from "react";
import type { CachedCategoryView } from "../types/contracts";

interface OfflineMutationFormsProps {
  familySlug: string;
  currency: string;
  categories: CachedCategoryView[];
  connectivityOnline: boolean;
  onCreateTransaction: (input: {
    direction: "INCOME" | "EXPENSE";
    categoryId: string;
    categoryName?: string;
    amountMinorUnits: string;
    description: string;
    notes?: string;
    receiptFile?: {
      fileName: string;
      mimeType: string;
      contentBase64: string;
    } | null;
  }) => Promise<void>;
  onCreateProject: (input: {
    name: string;
    code: string;
    description?: string;
    targetBudgetMinorUnits: string;
  }) => Promise<void>;
  onCreateContact: (input: {
    fullName: string;
    phone: string;
    email?: string;
    relationship?: string;
  }) => Promise<void>;
}

export function OfflineMutationForms({
  currency,
  categories,
  connectivityOnline,
  onCreateTransaction,
  onCreateProject,
  onCreateContact,
}: OfflineMutationFormsProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<
    "TRANSACTION" | "PROJECT" | "CONTACT" | "ONLINE_ONLY"
  >("TRANSACTION");
  const [direction, setDirection] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?.serverId ?? "cat-default",
  );
  const [amountMinorUnits, setAmountMinorUnits] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<{
    fileName: string;
    mimeType: string;
    contentBase64: string;
  } | null>(null);

  const [projectName, setProjectName] = useState<string>("");
  const [projectCode, setProjectCode] = useState<string>("");
  const [projectBudgetMinor, setProjectBudgetMinor] = useState<string>("");

  const [contactName, setContactName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactRelationship, setContactRelationship] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === "string" ? reader.result : "";
      const base64Part = resultStr.includes(",")
        ? (resultStr.split(",")[1] ?? "")
        : resultStr;
      setReceiptFile({
        fileName: file.name,
        mimeType: file.type || "image/png",
        contentBase64: base64Part,
      });
    };
    reader.readAsDataURL(file);
  };

  const submitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!/^\d+$/.test(amountMinorUnits.trim()) || BigInt(amountMinorUnits.trim()) <= 0n) {
      setFormError(
        "Amount must be a positive integer in minor units (no decimals or floating point).",
      );
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.serverId === categoryId);
      await onCreateTransaction({
        direction,
        categoryId: categoryId || "cat-default",
        categoryName: selectedCat?.name ?? "General",
        amountMinorUnits: amountMinorUnits.trim(),
        description: description.trim(),
        notes: notes.trim() || undefined,
        receiptFile,
      });
      setAmountMinorUnits("");
      setDescription("");
      setNotes("");
      setReceiptFile(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to queue offline record",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (
      !/^\d+$/.test(projectBudgetMinor.trim()) ||
      BigInt(projectBudgetMinor.trim()) <= 0n
    ) {
      setFormError("Project budget must be a positive integer in minor units.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreateProject({
        name: projectName.trim(),
        code: projectCode.trim(),
        targetBudgetMinorUnits: projectBudgetMinor.trim(),
      });
      setProjectName("");
      setProjectCode("");
      setProjectBudgetMinor("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to queue project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await onCreateContact({
        fullName: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: contactRelationship.trim() || undefined,
      });
      setContactName("");
      setContactPhone("");
      setContactRelationship("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to queue contact",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="offline-actions-heading"
      className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 id="offline-actions-heading" className="text-base font-semibold">
            Family Actions &amp; Offline Outbox Queue
          </h2>
          <p className="text-xs text-muted-foreground">
            Offline-created records are stored with LOCAL_PENDING status and a
            stable idempotency key until verified by the NestJS server.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "TRANSACTION"}
            onClick={() => setActiveTab("TRANSACTION")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              activeTab === "TRANSACTION"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
          >
            Income / Expense
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "PROJECT"}
            onClick={() => setActiveTab("PROJECT")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              activeTab === "PROJECT"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
          >
            New Project
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "CONTACT"}
            onClick={() => setActiveTab("CONTACT")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              activeTab === "CONTACT"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
          >
            New Contact
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-online-only-governance"
            aria-selected={activeTab === "ONLINE_ONLY"}
            onClick={() => setActiveTab("ONLINE_ONLY")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              activeTab === "ONLINE_ONLY"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
          >
            Governance (Online-Only)
          </button>
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          data-testid="mutation-form-error"
          className="mt-3 rounded border-2 border-foreground bg-muted p-2.5 text-xs font-medium text-foreground"
        >
          [VALIDATION ERROR] {formError}
        </div>
      ) : null}

      {activeTab === "TRANSACTION" ? (
        <form
          onSubmit={(e) => void submitTransaction(e)}
          className="mt-3 space-y-3 text-xs"
          data-testid="offline-transaction-form"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="font-medium">Direction</span>
              <select
                data-testid="tx-direction-select"
                value={direction}
                onChange={(e) =>
                  setDirection(e.target.value as "EXPENSE" | "INCOME")
                }
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              >
                <option value="EXPENSE">Expense Draft (EXPENSE)</option>
                <option value="INCOME">Income Draft (INCOME)</option>
              </select>
            </label>

            <label className="block">
              <span className="font-medium">Category</span>
              <select
                data-testid="tx-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              >
                {categories.length === 0 ? (
                  <option value="cat-default">General Family Category</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.serverId} value={cat.serverId}>
                      {cat.name} ({cat.direction})
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block">
              <span className="font-medium">
                Amount in Minor Units ({currency})
              </span>
              <input
                type="text"
                inputMode="numeric"
                data-testid="tx-amount-input"
                placeholder="e.g. 25000"
                value={amountMinorUnits}
                onChange={(e) => setAmountMinorUnits(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-medium">Description</span>
              <input
                type="text"
                data-testid="tx-description-input"
                placeholder="Purpose of income or expense..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              />
            </label>

            <label className="block">
              <span className="font-medium">Notes (Optional)</span>
              <input
                type="text"
                data-testid="tx-notes-input"
                placeholder="Additional context for family leaders..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="block text-xs">
              <span className="font-medium">
                Attach Receipt (JPEG/PNG/WEBP/PDF &le; 10 MiB):{" "}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleReceiptChange}
                className="ml-1 text-xs"
              />
            </label>

            <button
              type="submit"
              data-testid="submit-offline-tx-button"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md border border-foreground bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <span aria-hidden="true" data-icon="inline-start">
                [+]
              </span>
              <span>
                {submitting
                  ? "Queueing..."
                  : `Queue ${direction === "INCOME" ? "Income" : "Expense"} (Pending Sync)`}
              </span>
            </button>
          </div>
        </form>
      ) : null}

      {activeTab === "PROJECT" ? (
        <form
          onSubmit={(e) => void submitProject(e)}
          className="mt-3 space-y-3 text-xs"
          data-testid="offline-project-form"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="font-medium">Project Name</span>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Solar Water Tank"
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              />
            </label>
            <label className="block">
              <span className="font-medium">Project Code</span>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="e.g. PRJ-SOLAR"
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5 font-mono"
              />
            </label>
            <label className="block">
              <span className="font-medium">
                Target Budget Minor Units ({currency})
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={projectBudgetMinor}
                onChange={(e) => setProjectBudgetMinor(e.target.value)}
                placeholder="e.g. 1500000"
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5 font-mono"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md border border-foreground bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            [+] Queue Project Creation
          </button>
        </form>
      ) : null}

      {activeTab === "CONTACT" ? (
        <form
          onSubmit={(e) => void submitContact(e)}
          className="mt-3 space-y-3 text-xs"
          data-testid="offline-contact-form"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="font-medium">Full Name</span>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Jean Bosco Habimana"
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              />
            </label>
            <label className="block">
              <span className="font-medium">Phone Number</span>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+250788000000"
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5 font-mono"
              />
            </label>
            <label className="block">
              <span className="font-medium">Relationship</span>
              <input
                type="text"
                value={contactRelationship}
                onChange={(e) => setContactRelationship(e.target.value)}
                placeholder="e.g. Uncle / Advisor"
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1.5"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md border border-foreground bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            [+] Queue Family Contact
          </button>
        </form>
      ) : null}

      {activeTab === "ONLINE_ONLY" ? (
        <div
          data-testid="online-only-governance-notice"
          className="mt-3 rounded-md border border-border bg-muted p-3 text-xs"
        >
          <div className="font-semibold">
            Server-Authoritative Governance Actions ({connectivityOnline ? "Online" : "Currently Offline — Disabled"})
          </div>
          <p className="mt-1 text-muted-foreground">
            Financial approvals, rejections, transaction reversals, member role
            or permission changes, member removal, password/MFA updates, and
            authoritative financial exports require live backend verification
            and are never queued offline.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!connectivityOnline}
              className="rounded border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              [ONLINE REQUIRED] Approve / Reject Pending Expenses
            </button>
            <button
              type="button"
              disabled={!connectivityOnline}
              className="rounded border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              [ONLINE REQUIRED] Manage Member Roles &amp; Permissions
            </button>
            <button
              type="button"
              disabled={!connectivityOnline}
              className="rounded border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              [ONLINE REQUIRED] Generate Authoritative Audit Report
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
