"use client";

import { useEffect } from "react";
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
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { getDefaultValues } from "./contact-utils";
import {
  type ContactFormValues,
  contactFormSchema,
  contactStatusOptions,
  contactTypeOptions,
  type FamilyContact,
} from "./types-and-schemas";

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
    onSuccessMessage:
      mode === "create" ? "Contact saved successfully" : "Contact updated",
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
            {mode === "create" ? "Add Contact" : "Edit Contact"}
          </DialogTitle>
          <DialogDescription>
            Save trusted people and organizations connected to this family.
          </DialogDescription>
        </DialogHeader>
        <form
          id={`${mode}-contact-form`}
          className="flex flex-col gap-4 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <div className="text-destructive text-sm font-medium">{error}</div>
          ) : null}
          <CommonFormField
            control={form.control}
            name="fullName"
            label="Full name"
            placeholder="e.g. Dr. Aline Uwase"
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="contactType"
              label="Contact type"
              fieldType="select"
              selectOptions={contactTypeOptions}
              required
            />
            <CommonFormField
              control={form.control}
              name="status"
              label="Status"
              fieldType="select"
              selectOptions={contactStatusOptions}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="phoneNumber"
              label="Phone number"
              fieldType="phone"
              placeholder="+250 788 000 000"
            />
            <CommonFormField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="name@example.com"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="relationshipToFamily"
              label="Relationship to family"
              placeholder="Family doctor, neighbor, aunt, lender"
            />
            <CommonFormField
              control={form.control}
              name="organization"
              label="Organization/company"
              placeholder="Clinic, bank, SACCO, school, business"
            />
          </div>
          <CommonFormField
            control={form.control}
            name="address"
            label="Address"
            placeholder="Street, cell, sector, district, or city"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="isEmergencyContact"
              label="Emergency contact"
              fieldType="checkbox"
            />
            <CommonFormField
              control={form.control}
              name="isLoanContact"
              label="Loan contact"
              fieldType="checkbox"
            />
          </div>
          <CommonFormField
            control={form.control}
            name="notes"
            label="Notes"
            fieldType="textarea"
            placeholder="Useful context, availability, lending terms, or emergency notes"
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form={`${mode}-contact-form`}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
