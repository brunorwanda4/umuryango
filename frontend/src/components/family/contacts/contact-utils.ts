import type {
  ContactFiltersState,
  ContactFormValues,
  FamilyContact,
} from "./types-and-schemas";

export type ImportedContact = {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  organization?: string;
  notes?: string;
};

export function getDefaultValues(
  contact?: FamilyContact | null,
): ContactFormValues {
  return {
    fullName: contact?.fullName ?? "",
    contactType: contact?.contactType ?? "OTHER",
    phoneNumber: contact?.phoneNumber ?? "",
    email: contact?.email ?? "",
    address: contact?.address ?? "",
    relationshipToFamily: contact?.relationshipToFamily ?? "",
    organization: contact?.organization ?? "",
    notes: contact?.notes ?? "",
    isEmergencyContact: contact?.isEmergencyContact ?? false,
    isLoanContact: contact?.isLoanContact ?? false,
    status: contact?.status ?? "ACTIVE",
  };
}

export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function parseDelimitedLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

export function firstValue(
  row: Record<string, string>,
  names: string[],
): string | undefined {
  const key = names.find((name) => row[name]?.trim());
  return key ? row[key]?.trim() : undefined;
}

export function parseGoogleCsv(text: string): ImportedContact[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseDelimitedLine(lines[0] ?? "");
  return lines.slice(1).flatMap((line) => {
    const values = parseDelimitedLine(line);
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
    const fullName =
      firstValue(row, ["Name", "First Name", "Given Name"]) ?? "";
    const phoneNumber = firstValue(row, [
      "Phone 1 - Value",
      "Phone 2 - Value",
      "Phone 3 - Value",
    ]);
    const email = firstValue(row, ["E-mail 1 - Value", "E-mail 2 - Value"]);
    return fullName || phoneNumber || email
      ? [
          {
            fullName: fullName || phoneNumber || email || "Imported contact",
            phoneNumber,
            email,
            address: firstValue(row, ["Address 1 - Formatted", "Address"]),
            organization: firstValue(row, [
              "Organization Name",
              "Organization 1 - Name",
            ]),
            notes: firstValue(row, ["Notes"]),
          },
        ]
      : [];
  });
}

export function parseVcard(text: string): ImportedContact[] {
  return text
    .split(/BEGIN:VCARD/i)
    .slice(1)
    .map((card): ImportedContact | null => {
      const get = (prefix: string) =>
        card
          .split(/\r?\n/)
          .find((line) => line.toUpperCase().startsWith(prefix))
          ?.split(":")
          .slice(1)
          .join(":")
          .trim()
          .replace(/\\n/g, "\n")
          .replace(/\\,/g, ",");
      const fullName = get("FN") ?? get("N") ?? "";
      const phoneNumber = get("TEL");
      const email = get("EMAIL");
      const organization = get("ORG");
      const notes = get("NOTE");
      return fullName || phoneNumber || email
        ? {
            fullName: fullName || phoneNumber || email || "Imported contact",
            phoneNumber,
            email,
            organization,
            notes,
          }
        : null;
    })
    .filter((contact): contact is ImportedContact => Boolean(contact));
}

export function filterContacts(
  contacts: FamilyContact[],
  filters: ContactFiltersState,
): FamilyContact[] {
  const search = filters.search.trim().toLowerCase();

  return contacts.filter((contact) => {
    const searchable = [
      contact.fullName,
      contact.phoneNumber,
      contact.email,
      contact.address,
      contact.relationshipToFamily,
      contact.organization,
      contact.notes,
      contact.contactType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!search || searchable.includes(search)) &&
      (filters.contactType === "all" ||
        contact.contactType === filters.contactType) &&
      (filters.status === "all" || contact.status === filters.status) &&
      (!filters.emergencyOnly || contact.isEmergencyContact) &&
      (!filters.loanOnly || contact.isLoanContact)
    );
  });
}
