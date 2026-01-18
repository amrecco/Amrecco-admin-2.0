import { NextResponse } from "next/server";
import { airtableFetch } from "@/src/lib/airtable/client";
import { getBaseId, getTableId } from "@/src/lib/airtable/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { fields } = body;

  const baseId = getBaseId();
  const tableId = getTableId();

  try {
    // Map frontend field names to Airtable field names
    const airtableFields: Record<string, any> = {};
    
    if (fields.Summary !== undefined) {
      airtableFields["Summary"] = fields.Summary;
    }
    // Add other field mappings as needed...

    const updated = await airtableFetch(`/${baseId}/${tableId}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: airtableFields }),
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (e: any) {
    return new NextResponse(e?.message || "Update failed", { status: 500 });
  }
}
