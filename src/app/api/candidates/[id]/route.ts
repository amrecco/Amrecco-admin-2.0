import { NextResponse } from "next/server";
import { airtableFetch } from "@/src/lib/airtable/client";
import { getBaseId, getTableId } from "@/src/lib/airtable/client";
// NOTE: params is Promise in your Next version
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const baseId = getBaseId();
  const tableId = getTableId();
  const recordId = id;

  try {
    const rec = await airtableFetch(`/${baseId}/${tableId}/${recordId}`);

    // map airtable -> candidate
    const candidate = {
      id: rec.id,
      fullName: rec.fields["Full Name"] ?? "",
      email: rec.fields["Email"] ?? "",
      phone: rec.fields["Phone"] ?? "",
      location: rec.fields["Location"] ?? "",
      linkedin: rec.fields["LinkedIn"] ?? "",
      status: rec.fields["Status"] ?? "Active",
      managerRating: rec.fields["Manager Rating"] ?? 0,
      industry: rec.fields["Industry"] ?? "",
      salesRoleType: rec.fields["Sales Role Type"] ?? "",
      annualRevenue: rec.fields["Annual Revenue Generated"] ?? 0,
      bookOfBusiness: rec.fields["Book of Business"] ?? false,
      tradeLanes: rec.fields["Trade Lanes"] ?? [],
      commodities: rec.fields["Commodities"] ?? "",
      importExportFocus: rec.fields["Import Export Focus"] ?? "",
      modeOfTransportation: rec.fields["Mode of Transportation"] ?? [],
      salaryExpectationMin: rec.fields["Salary Expectation Min"] ?? 0,
      salaryExpectationMax: rec.fields["Salary Expectation Max"] ?? 0,
      willingToRelocate: rec.fields["Willing to Relocate"] ?? "",
      candidatePreferences: rec.fields["Candidate Preferences"] ?? [],
      summary: rec.fields["Summary"] ?? "",
      experience: rec.fields["Experience"] ?? "",
      education: rec.fields["Education"] ?? "",
      skills: rec.fields["Skills"] ?? "",
      certifications: rec.fields["Certifications"] ?? "",
      interviewSummary: rec.fields["Interview Summary"] ?? "",
      interviewNotes: rec.fields["Interview Notes"] ?? "",
      strengths: rec.fields["Strengths"] ?? "",
      concerns: rec.fields["Concerns"] ?? "",
      hidePersonalInfo: rec.fields["Hide Personal Info"] ?? false,
    };

    return NextResponse.json({ candidate });
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed", { status: 500 });
  }
}
