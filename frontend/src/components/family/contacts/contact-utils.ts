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
  return parseDelimitedRows(line)[0] ?? [];
}

export function parseDelimitedRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function firstValue(
  row: Record<string, string>,
  names: string[],
): string | undefined {
  const key = names.find((name) => row[name]?.trim());
  return key ? row[key]?.trim() : undefined;
}

export function parseGoogleCsv(text: string): ImportedContact[] {
  const rows = parseDelimitedRows(text);
  if (rows.length < 2) return [];
  const headers = (rows[0] ?? []).map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header,
  );
  return rows.slice(1).flatMap((values) => {
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
    const structuredName = [
      firstValue(row, ["Name Prefix"]),
      firstValue(row, ["First Name", "Given Name"]),
      firstValue(row, ["Middle Name", "Additional Name"]),
      firstValue(row, ["Last Name", "Family Name"]),
      firstValue(row, ["Name Suffix"]),
    ]
      .filter(Boolean)
      .join(" ");
    const phoneticName = [
      firstValue(row, ["Phonetic First Name"]),
      firstValue(row, ["Phonetic Middle Name"]),
      firstValue(row, ["Phonetic Last Name"]),
    ]
      .filter(Boolean)
      .join(" ");
    const phoneNumber = firstValue(row, [
      "Phone 1 - Value",
      "Phone 2 - Value",
      "Phone 3 - Value",
    ]);
    const email = firstValue(row, ["E-mail 1 - Value", "E-mail 2 - Value"]);
    const organization = firstValue(row, [
      "Organization Name",
      "Organization 1 - Name",
    ]);
    const fullName =
      structuredName ||
      firstValue(row, ["Name", "File As", "Nickname"]) ||
      phoneticName ||
      organization ||
      phoneNumber ||
      email ||
      "";
    return fullName || phoneNumber || email
      ? [
          {
            fullName,
            phoneNumber,
            email,
            address: firstValue(row, ["Address 1 - Formatted", "Address"]),
            organization,
            notes: firstValue(row, ["Notes"]),
          },
        ]
      : [];
  });
}

export function detectContactFileFormat(
  fileName: string,
  text: string,
): "csv" | "vcard" {
  return fileName.toLowerCase().endsWith(".vcf") ||
    text.trimStart().toUpperCase().startsWith("BEGIN:VCARD")
    ? "vcard"
    : "csv";
}

export function parseContactFile(
  fileName: string,
  text: string,
): ImportedContact[] {
  return detectContactFileFormat(fileName, text) === "vcard"
    ? parseVcard(text)
    : parseGoogleCsv(text);
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
