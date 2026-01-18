import { NextResponse } from "next/server";
import { airtableFetch, getBaseId, getTableId } from "@/src/lib/airtable/client";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const id = body?.id as string | undefined;
  const stage = body?.stage as string | undefined;

  if (!id || !stage) {
    return NextResponse.json(
      { error: "Missing id or stage" },
      { status: 400 }
    );
  }

  const baseId = getBaseId();
  const tableId = getTableId();

  // PATCH record in Airtable
  const updated = await airtableFetch(`/${baseId}/${tableId}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        Stage: stage,
      },
    }),
  });

  return NextResponse.json({ ok: true, updated });
}
