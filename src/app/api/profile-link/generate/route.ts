import { NextResponse } from "next/server";
import crypto from "crypto";
import { updateCandidateByRecordId } from "@/src/lib/airtable/candidates";

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const recordId: string = body.recordId;
    const expiresInDays: number = body.expiresInDays ?? 7;
    const visibleTabs: string[] = body.visibleTabs ?? ["overview", "experience","summary", "video", "availability"];

    if (!recordId) {
      return NextResponse.json({ error: "Missing recordId" }, { status: 400 });
    }

    // Validate visibleTabs
    const allowedTabs = ["overview", "experience","summary", "video", "availability"];
    const validTabs = visibleTabs.filter(tab => allowedTabs.includes(tab));
    
    if (validTabs.length === 0) {
      return NextResponse.json(
        { error: "At least one valid tab must be selected" },
        { status: 400 }
      );
    }

    const rawToken = base64url(crypto.randomBytes(32));
    const tokenHash = sha256(rawToken);

    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    // ✅ Save as comma-separated string instead of array
    await updateCandidateByRecordId(recordId, {
      "Share Token Hash": tokenHash,
      "Share Token Expires": expires.toISOString(),
      "Share Visible Tabs": validTabs.join(","), // ✅ Changed to string
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL;
    if (!origin) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: `${origin}/shared-profile/${rawToken}`,
      expiresAt: expires.toISOString(),
      visibleTabs: validTabs,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to generate link" },
      { status: 500 }
    );
  }
}