"use client";

import { CheckIcon, PlusIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { ContactImportPanel } from "@/components/family/contacts/contact-import-panel";
import {
  type ContactFormValues,
  contactFormSchema,
  type FamilyContact,
} from "@/components/family/contacts/types-and-schemas";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import {
  getPersonRelationship,
  type PersonalLoanFormValues,
} from "./types-and-schemas";

export function AddTrustedPersonDialog({
  familyId,
  onCreated,
  onContactsImported,
  onOpenChange,
  open,
}: {
  familyId: string;
  onCreated: (person: FamilyContact) => void;
  onContactsImported?: () => void;
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
        if (!nextOpen) {
          resetMessages();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add new person</DialogTitle>
          <DialogDescription>
            Save a trusted family member or friend, then continue the loan.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="form" className="gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Add manually</TabsTrigger>
            <TabsTrigger value="file">Upload file</TabsTrigger>
          </TabsList>
          <TabsContent value="form">
            <form
              id="add-trusted-person-form"
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
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
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
                  {isPending ? "Adding..." : "Add person"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="file" className="flex flex-col gap-3 min-h-60">
            <ContactImportPanel
              familyId={familyId}
              onImported={() => {
                onContactsImported?.();
                onOpenChange(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function PersonSelector({
  contacts,
  control,
  familyId,
  onContactsImported,
  onPersonCreated,
}: {
  contacts: FamilyContact[];
  control: Control<PersonalLoanFormValues>;
  familyId: string;
  onContactsImported: () => void;
  onPersonCreated: (person: FamilyContact) => void;
}) {
  const [openPerson, setOpenPerson] = useState(false);
  const [personPickerOpen, setPersonPickerOpen] = useState(false);

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
            <Popover open={personPickerOpen} onOpenChange={setPersonPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  aria-expanded={personPickerOpen}
                  aria-invalid={invalid}
                  className=" justify-between font-normal"
                  id={id}
                  type="button"
                  variant="outline"
                >
                  {contacts.find((contact) => contact.id === field.value)
                    ?.fullName ?? "Choose a saved person"}
                  <span className="text-muted-foreground text-xs">
                    {contacts.find((contact) => contact.id === field.value)
                      ?.phoneNumber ?? ""}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command className="h-auto min-h-0">
                  <CommandInput placeholder="Search by name or phone..." />
                  <CommandList>
                    <CommandEmpty>No person found.</CommandEmpty>
                    {contacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        className="min-w-0"
                        value={`${contact.fullName} ${contact.phoneNumber ?? ""} ${getPersonRelationship(contact)}`}
                        onSelect={() => {
                          field.onChange(contact.id);
                          setPersonPickerOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={`mr-2 size-4 ${
                            field.value === contact.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        <span className="min-w-0 truncate">
                          {contact.fullName} · {getPersonRelationship(contact)}
                          {contact.phoneNumber
                            ? ` · ${contact.phoneNumber}`
                            : ""}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
        onContactsImported={onContactsImported}
        onCreated={(person) => {
          onPersonCreated(person);
          setOpenPerson(false);
        }}
      />
    </>
  );
}
