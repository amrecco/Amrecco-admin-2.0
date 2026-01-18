import { NextResponse } from "next/server";
import { airtableFetch, getBaseId, getTableId } from "@/src/lib/airtable/client";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

export async function GET() {
  const baseId = getBaseId();
  const tableId = getTableId();

  // Fetch records (handles first page; add pagination if you have >100)
  const data = await airtableFetch(`/${baseId}/${tableId}?pageSize=100`);
  const records: AirtableRecord[] = data.records ?? [];

  const candidates = records.map((r) => {
    const f = r.fields || {};
    return {
      id: r.id,
      fullName: f["Full Name"] || "",
      email: f["Email"] || "",
      phone: f["Phone"] || "",
      location: f["Location"] || "",
      linkedin: f["LinkedIn"] || "",
      summary: f["Summary"] || "",
      experience: f["Experience"] || "",
      education: f["Education"] || "",
      skills: f["Skills"] || "",
      certifications: f["Certifications"] || "",
      status: f["Status"] || "",
      managerRating: f["Manager Rating"] || 0,
      industry: f["Industry"] || "",
      salesRoleType: f["Sales Role Type"] || "",
      annualRevenue: f["Annual Revenue Generated"] || 0,
      salaryExpectationMin: f["Salary Expectation Min"] || 0,
      salaryExpectationMax: f["Salary Expectation Max"] || 0,
      bookOfBusiness: f["Book of Business"] || false,
      tradeLanes: f["Trade Lanes"] || [],
      commodities: f["Commodities"] || "",
      importExportFocus: f["Import Export Focus"] || "",
      willingToRelocate: f["Willing to Relocate"] || "",
      candidatePreferences: f["Candidate Preferences"] || [],
      modeOfTransportation: f["Mode of Transportation"] || [],

      // These may not exist on Candidates table; keep as optional:
      requestDate: f["Request Date"] || null,
      requestStatus: f["Request Status"] || null,
      jobTitle: f["Job Title"] || null,
      hidePersonalInfo: f["Hide Personal Info"] || false,

      // ✅ FORCE everyone into Initial Screening in UI:
      stage: f["Stage"] || null,
    };
  });

  return NextResponse.json({ candidates });
}
