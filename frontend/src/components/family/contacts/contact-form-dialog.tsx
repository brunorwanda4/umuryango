"use client";

import { useEffect, useMemo } from "react";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import { ContactImportPanel } from "./contact-import-panel";
import { getDefaultValues } from "./contact-utils";
import {
  type ContactFormValues,
  contactFormSchema,
  contactStatusOptions,
  contactTypeOptions,
  type FamilyContact,
} from "./types-and-schemas";

const t = createTranslator("FamilyContacts");
const tCommon = createTranslator("Common");

export interface ContactFormDialogProps {
  contact?: FamilyContact | null;
  family: FamilyDetail;
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContactFormDialog({
  contact,
  family,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: ContactFormDialogProps) {
  const localizedContactTypeOptions = useMemo(
    () =>
      contactTypeOptions.map((opt) => ({
        ...opt,
        label: t(`types.${opt.value}`),
      })),
    [],
  );

  const localizedStatusOptions = useMemo(
    () =>
      contactStatusOptions.map((opt) => ({
        ...opt,
        label: t(`statuses.${opt.value}`),
      })),
    [],
  );

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    ContactFormValues,
    FamilyContact
  >({
    schema: contactFormSchema,
    formOptions: { defaultValues: getDefaultValues(contact) },
    transform: (values) => ({
      ...values,
      phoneNumber: values.phoneNumber || null,
      email: values.email || null,
      address: values.address || null,
      relationshipToFamily: values.relationshipToFamily || null,
      organization: values.organization || null,
      notes: values.notes || null,
    }),
    request: {
      method: mode === "create" ? "post" : "patch",
      url:
        mode === "create"
          ? `/families/${encodeURIComponent(family.id)}/contacts`
          : `/families/${encodeURIComponent(
              family.id,
            )}/contacts/${encodeURIComponent(contact?.id ?? "")}`,
    },
    onSuccessMessage: t("saveSuccess"),
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      form.reset(getDefaultValues());
      onOpenChange(false);
      onSuccess();
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(contact));
    }
  }, [open, contact, form]);

  return (
    <Dialog
      syncWithSearchParams={false}
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
        if (nextOpen) form.reset(getDefaultValues(contact));
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("dialogCreateTitle") : t("dialogEditTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("dialogCreateDesc") : t("dialogEditDesc")}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="form" className="gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">{t("addManually")}</TabsTrigger>
            <TabsTrigger value="file">{t("uploadFile")}</TabsTrigger>
          </TabsList>
          <TabsContent value="form">
            <form
              id={`${mode}-contact-form`}
              className="flex flex-col gap-4 py-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {error ? (
                <div className="text-destructive text-sm font-medium">
                  {error}
                </div>
              ) : null}
              <CommonFormField
                control={form.control}
                name="fullName"
                label={t("fullNameLabel")}
                placeholder={t("fullNamePlaceholder")}
                required
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="contactType"
                  label={t("contactTypeLabel")}
                  fieldType="select"
                  selectOptions={localizedContactTypeOptions}
                  required
                />
                <CommonFormField
                  control={form.control}
                  name="status"
                  label={t("statusLabel")}
                  fieldType="select"
                  selectOptions={localizedStatusOptions}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="phoneNumber"
                  label={t("phoneLabel")}
                  fieldType="phone"
                  placeholder={t("phonePlaceholder")}
                />
                <CommonFormField
                  control={form.control}
                  name="email"
                  label={t("emailLabel")}
                  type="email"
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="relationshipToFamily"
                  label={t("relationshipLabel")}
                  placeholder={t("relationshipPlaceholder")}
                />
                <CommonFormField
                  control={form.control}
                  name="organization"
                  label={t("organizationLabel")}
                  placeholder={t("organizationPlaceholder")}
                />
              </div>
              <CommonFormField
                control={form.control}
                name="address"
                label={t("addressLabel")}
                placeholder={t("addressPlaceholder")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="isEmergencyContact"
                  label={t("isEmergencyLabel")}
                  fieldType="checkbox"
                />
                <CommonFormField
                  control={form.control}
                  name="isLoanContact"
                  label={t("isLoanLabel")}
                  fieldType="checkbox"
                />
              </div>
              <CommonFormField
                control={form.control}
                name="notes"
                label={t("notesLabel")}
                fieldType="textarea"
                placeholder={t("notesPlaceholder")}
              />
            </form>
            <DialogFooter>
              <Button
                type="submit"
                form={`${mode}-contact-form`}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? tCommon("saving") : tCommon("save")}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="file">
            <ContactImportPanel
              familyId={family.id}
              onImported={() => {
                onOpenChange(false);
                onSuccess();
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
