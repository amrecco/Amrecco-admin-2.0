// src/lib/airtable/candidates.ts
import { airtableFetch, getBaseId, getTableId } from "./client";

export type AirtableRecord<TFields = any> = { id: string; fields: TFields };

export type CandidateAirtableFields = Record<string, any>;

function basePath() {
  const baseId = getBaseId();
  const table = encodeURIComponent(getTableId());
  return `/${baseId}/${table}`;
}

export async function getCandidateRecordByRecordId(recordId: string) {
  const rec = await airtableFetch(`${basePath()}/${recordId}`);
  return rec as AirtableRecord<CandidateAirtableFields>;
}

export async function updateCandidateByRecordId(recordId: string, fields: Record<string, any>) {
  return airtableFetch(`${basePath()}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        ...fields,
        // If you have an "Updated At" field, keep it consistent:
        // "Updated At": new Date().toISOString(),
      },
    }),
  }) as Promise<AirtableRecord<CandidateAirtableFields>>;
}

export async function setShareLinkByRecordId(recordId: string, tokenHash: string, expiresIso: string) {
  return updateCandidateByRecordId(recordId, {
    "Profile Link Token": tokenHash,        // store hash here (recommended)
    "Profile Link Expires": expiresIso,     // ISO string
  });
}

export async function findCandidateByTokenHash(tokenHash: string) {
  const qs = new URLSearchParams({
    filterByFormula: `{Profile Link Token}='${tokenHash.replace(/'/g, "\\'")}'`,
    maxRecords: "1",
  });

  const data = await airtableFetch(`${basePath()}?${qs.toString()}`);
  const rec = (data.records?.[0] ?? null) as AirtableRecord<CandidateAirtableFields> | null;
  return rec;
}
export async function findCandidateByShareTokenHash(tokenHash: string) {
  const baseId = getBaseId();
  const table = encodeURIComponent(getTableId());

  const safe = tokenHash.replace(/'/g, "\\'");
  const qs = new URLSearchParams({
    filterByFormula: `{Share Token Hash}='${safe}'`,
    maxRecords: "1",
  });

  const data = await airtableFetch(`/${baseId}/${table}?${qs.toString()}`);
  return data.records?.[0] ?? null;
}
