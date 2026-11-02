import apiRequest from "@/service/api";
import type { ImportedContact } from "./contact-utils";

export const CONTACT_IMPORT_BATCH_SIZE = 250;

type ContactImportBatchResult = {
  created: number;
  merged: number;
};

type ContactImportBatchRequester = (
  familyId: string,
  contacts: ImportedContact[],
) => Promise<{
  ok: boolean;
  data?: ContactImportBatchResult;
  message?: string;
}>;

async function requestContactImportBatch(
  familyId: string,
  contacts: ImportedContact[],
) {
  return apiRequest<{ contacts: ImportedContact[] }, ContactImportBatchResult>(
    "post",
    `/families/${encodeURIComponent(familyId)}/contacts/import`,
    {
      contacts,
    },
  );
}

export async function importContactsInBatches(
  familyId: string,
  contacts: ImportedContact[],
  requestBatch: ContactImportBatchRequester = requestContactImportBatch,
) {
  let created = 0;
  let merged = 0;
  let processed = 0;

  for (
    let offset = 0;
    offset < contacts.length;
    offset += CONTACT_IMPORT_BATCH_SIZE
  ) {
    const batch = contacts.slice(offset, offset + CONTACT_IMPORT_BATCH_SIZE);
    const response = await requestBatch(familyId, batch);

    if (!response.ok || !response.data) {
      return {
        ok: false as const,
        created,
        merged,
        processed,
        message: response.message,
      };
    }

    created += response.data.created;
    merged += response.data.merged;
    processed += batch.length;
  }

  return { ok: true as const, created, merged, processed };
}
