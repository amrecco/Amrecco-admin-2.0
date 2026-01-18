// app/api/shared-profile/[token]/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { findCandidateByShareTokenHash } from "@/src/lib/airtable/candidates";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Add the same parsing logic from your main route
function parseExperienceData(rawData: any) {
  if (!rawData) return '';
  
  try {
    if (typeof rawData === 'string' && (rawData.startsWith('[') || rawData.startsWith('{'))) {
      return JSON.parse(rawData);
    }
  } catch {
    // Keep as string if parse fails
  }
  
  return rawData;
}// app/api/shared-profile/[token]/route.ts
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params;
    const tokenHash = sha256(token);

    const rec = await findCandidateByShareTokenHash(tokenHash);
    if (!rec) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }

    const fields = rec.fields || {};
    
    // ✅ Add this debug logging
    console.log('🔍 Airtable fields:', Object.keys(fields));
    console.log('🔍 Interview Summary field value:', fields["Interviewsummary"]);
    
    const expiresRaw = fields["Share Token Expires"];
    const expires = expiresRaw ? new Date(expiresRaw).getTime() : 0;

    if (!expires || expires < Date.now()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    const hide = !!fields["Hide Personal Info"];

    const visibleTabsRaw = fields["Share Visible Tabs"] ?? "overview,experience,summary,video,availability";
    const visibleTabs = typeof visibleTabsRaw === 'string' 
      ? visibleTabsRaw.split(",").map((t: string) => t.trim()).filter(Boolean)
      : ["overview", "experience", "summary", "video", "availability"];

    const rawExperience = fields["Experience"];
    const rawEducation = fields["Education"];
    
    // ✅ Get the interview summary value
    const interviewSummaryValue = fields["Interviewsummary"] || fields["Interview Summary"] || "";
    console.log('🔍 Interview Summary value being sent:', interviewSummaryValue ? 'HAS VALUE' : 'EMPTY');
    
    return NextResponse.json({
      candidate: {
        id: rec.id,
        fullName: fields["Full Name"] ?? "",
        location: fields["Location"] ?? "",
        industry: fields["Industry"] ?? "",
        salesRoleType: fields["Sales Role Type"] ?? "",
        tradeLanes: fields["Trade Lanes"] ?? [],
        commodities: fields["Commodities"] ?? "",
        importExportFocus: fields["Import Export Focus"] ?? "",
        modeOfTransportation: fields["Mode of Transportation"] ?? [],
        summary: fields["Summary"] ?? "",
        experience: parseExperienceData(rawExperience),
        experienceText: fields["Experience Text"] ?? "",
        education: parseExperienceData(rawEducation),
        educationText: fields["Education Text"] ?? "",
        skills: fields["Skills"] ?? "",
        certifications: fields["Certifications"] ?? "",
        
        // ✅ Use the value we retrieved above
        InterviewSummary: interviewSummaryValue,
        
        // Other fields
        annualRevenue: fields["Annual Revenue"] ?? null,
        bookOfBusiness: fields["Book of Business"] ?? false,
        salaryExpectationMin: fields["Salary Expectation Min"] ?? null,
        salaryExpectationMax: fields["Salary Expectation Max"] ?? null,
        willingToRelocate: fields["Willing to Relocate"] ?? "No",
        candidatePreferences: fields["Candidate Preferences"] ?? [],

        email: hide ? "" : fields["Email"] ?? "",
        phone: hide ? "" : fields["Phone"] ?? "",
        linkedin: hide ? "" : fields["LinkedIn"] ?? "",
        hidePersonalInfo: hide,
      },
      visibleTabs,
    });
  } catch (e: any) {
    console.error('❌ Shared profile API error:', e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to load shared profile" },
      { status: 500 }
    );
  }
}