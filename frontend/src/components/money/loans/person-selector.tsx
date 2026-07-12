"use client";

import { PlusIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import {
  type ContactFormValues,
  contactFormSchema,
  type FamilyContact,
} from "@/components/family/contacts/types-and-schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import {
  getPersonRelationship,
  type PersonalLoanFormValues,
} from "./types-and-schemas";

export function AddTrustedPersonDialog({
  familyId,
  onCreated,
  onOpenChange,
  open,
}: {
  familyId: string;
  onCreated: (person: FamilyContact) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    ContactFormValues,
    FamilyContact
  >({
    schema: contactFormSchema,
    formOptions: {
      defaultValues: {
        fullName: "",
        contactType: "RELATIVE",
        phoneNumber: "",
        email: "",
        address: "",
        relationshipToFamily: "",
        organization: "",
        notes: "",
        isEmergencyContact: false,
        isLoanContact: true,
        status: "ACTIVE",
      },
    },
    transform: (values) => ({
      ...values,
      phoneNumber: values.phoneNumber || null,
      email: values.email || null,
      address: values.address || null,
      relationshipToFamily: values.relationshipToFamily || null,
      organization: null,
      notes: values.notes || null,
      isLoanContact: true,
      status: "ACTIVE",
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/contacts`,
    },
    onSuccessMessage: "Person added",
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: (person) => {
      if (person) onCreated(person);
      form.reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add new person</DialogTitle>
          <DialogDescription>
            Save a trusted family member or friend, then continue the loan.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-trusted-person-form"
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <CommonFormField
            control={form.control}
            name="fullName"
            label="Full name"
            placeholder="e.g. Aline Uwase"
            required
          />
          <CommonFormField
            control={form.control}
            name="contactType"
            label="Relationship"
            fieldType="select"
            selectOptions={[
              { label: "Family", value: "RELATIVE" },
              { label: "Friend", value: "FAMILY_FRIEND" },
              { label: "Neighbor", value: "NEIGHBOR" },
              { label: "Other trusted person", value: "OTHER" },
            ]}
            required
          />
          <CommonFormField
            control={form.control}
            name="phoneNumber"
            label="Phone number"
            fieldType="phone"
            placeholder="+250 788 000 000"
          />
          <CommonFormField
            control={form.control}
            name="relationshipToFamily"
            label="Relationship details"
            placeholder="e.g. Aunt, cousin, close friend"
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="add-trusted-person-form"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
            {isPending ? "Adding..." : "Add person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PersonSelector({
  contacts,
  control,
  familyId,
  onPersonCreated,
}: {
  contacts: FamilyContact[];
  control: Control<PersonalLoanFormValues>;
  familyId: string;
  onPersonCreated: (person: FamilyContact) => void;
}) {
  const [openPerson, setOpenPerson] = useState(false);

  return (
    <>
      <CommonFormField
        control={control}
        name="personContactId"
        label="Person"
        fieldType="custom"
        required
        render={({ field, id, invalid }) => (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
            >
              <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
                <SelectValue placeholder="Choose a saved person" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.fullName} · {getPersonRelationship(contact)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPerson(true)}
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Add new person
            </Button>
          </div>
        )}
      />
      <AddTrustedPersonDialog
        familyId={familyId}
        open={openPerson}
        onOpenChange={setOpenPerson}
        onCreated={(person) => {
          onPersonCreated(person);
          setOpenPerson(false);
        }}
      />
    </>
  );
}
