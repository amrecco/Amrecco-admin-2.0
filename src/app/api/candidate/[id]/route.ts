// File: app/api/candidates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_TOKEN }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    throw new Error('Server configuration error: Missing JWT_SECRET');
  }

  const authHeader = request.headers.get('authorization');
  const accessTokenCookie = request.cookies.get('accessToken');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (accessTokenCookie) {
    token = accessTokenCookie.value;
  }

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Helper function to parse candidate data from Airtable record
function parseCandidateData(record: any) {
  const rawExperience = record.get('Experience') as string || '';
  const rawEducation = record.get('Education') as string || '';

  let parsedExperience = rawExperience;
  let parsedEducation = rawEducation;

  try {
    if (rawExperience.startsWith('[') || rawExperience.startsWith('{')) {
      parsedExperience = JSON.parse(rawExperience);
    }
  } catch {
    // Keep as string if parse fails
  }

  try {
    if (rawEducation.startsWith('[') || rawEducation.startsWith('{')) {
      parsedEducation = JSON.parse(rawEducation);
    }
  } catch {
    // Keep as string if parse fails
  }

  return {
    id: record.id,
    fullName: record.get('Full Name') || '',
    email: record.get('Email') || '',
    phone: record.get('Phone') || '',
    location: record.get('Location') || '',
    linkedin: record.get('LinkedIn') || '',
    summary: record.get('Summary') || '',
    experience: parsedExperience,
    education: parsedEducation,
    experienceText: typeof parsedExperience === 'string' ? parsedExperience : '',
    educationText: typeof parsedEducation === 'string' ? parsedEducation : '',
    skills: record.get('Skills') || '',
    certifications: record.get('Certifications') || '',
    status: record.get('Status') || 'New',
    stage: record.get('Stage') || 'Initial Screening',
    managerRating: record.get('Manager Rating') || 0,
    managerComments: record.get('Manager Comments') || '',
    salaryExpectationMin: record.get('Salary Expectation Min') || 0,
    salaryExpectationMax: record.get('Salary Expectation Max') || 0,
    candidatePreferences: record.get('Candidate Preferences') || [],
    willingToRelocate: record.get('Willing to Relocate') || 'No',
    industry: record.get('Industry') || '',
    salesRoleType: record.get('Sales Role Type') || '',
    annualRevenue: record.get('Annual Revenue Generated') || 0,
    bookOfBusiness: record.get('Book of Business') || false,
    tradeLanes: record.get('Trade Lanes') || [],
    commodities: record.get('Commodities') || '',
    importExportFocus: record.get('Import Export Focus') || '',
    modeOfTransportation: record.get('Mode of Transportation') || [],
    salesExperienceWithinLogistics: record.get('Sales Experience Within Logistics') || false,
    logisticsSalesExperience: record.get('Logistics Sales Experience') || false,
    usBasedStatus: record.get('US Based') || false,
    createdDate: record.get('Created Date') || '',
    lastLogin: record.get('Last Login') || '',
    applicationCount: record.get('Application Count') || 0,
    profileCreated: record.get('Profile Created') || false,
    profileVisibility: record.get('Profile Visibility') || 'Public',
    InterviewSummary: record.get('Interviewsummary') || ''
  };
}

// GET - Fetch candidate by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('API Route: Fetching candidate ID:', id);

    await verifyToken(request);

    // Fetch candidate from Airtable
    const record = await base('Candidates_V2').find(id);

    if (!record) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const candidateData = parseCandidateData(record);

    console.log('API Route: Successfully fetched candidate:', candidateData.fullName);

    return NextResponse.json({
      success: true,
      candidate: candidateData
    });
  } catch (error) {
    console.error('API Route Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create interview summary (first time)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    await verifyToken(request);
    const existingRecord = await base('Candidates_V2').find(id);
    
    if (!existingRecord) {
      console.error('❌ Candidate not found in Airtable');
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    console.log('✅ Candidate found:', existingRecord.get('Full Name'));

    const existingSummary = existingRecord.get('Interviewsummary');
    console.log('Existing Summary:', existingSummary ? 'EXISTS' : 'EMPTY');
    
    if (existingSummary) {
      console.log('⚠️ Interview summary already exists, should use PUT');
      return NextResponse.json({ 
        error: 'Interview summary already exists. Use PUT method to update.',
        hasExistingSummary: true 
      }, { status: 409 });
    }

    // Create new interview summary
    const updateFields: any = {};
    
    if (body.InterviewSummary !== undefined) {
      updateFields['Interviewsummary'] = body.InterviewSummary;
      console.log('✅ Prepared update fields');
    } else {
      console.error('❌ No InterviewSummary in request body');
      return NextResponse.json({ error: 'InterviewSummary is required' }, { status: 400 });
    }

    console.log('Updating Airtable record...');
    await base('Candidates_V2').update(id, updateFields);
    console.log('✅ Airtable update successful!');

    // Fetch updated record
    const record = await base('Candidates_V2').find(id);

    if (!record) {
      console.error('❌ Candidate not found after update');
      return NextResponse.json({ error: 'Candidate not found after update' }, { status: 404 });
    }

    const candidateData = parseCandidateData(record);
    console.log('✅ POST REQUEST COMPLETED SUCCESSFULLY');

    return NextResponse.json({
      success: true,
      candidate: candidateData,
      message: 'Interview summary created successfully',
      isNew: true
    });
  } catch (error) {
    console.error('❌ POST REQUEST ERROR:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// PUT - Update candidate profile (including interview summary)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    console.log('========================================');
    console.log('PUT REQUEST - Updating Candidate Profile');
    console.log('========================================');
    console.log('Candidate ID:', id);

    await verifyToken(request);
    console.log('✅ Token verified successfully');

    // Helper function to check if value is valid (not empty, null, or undefined)
    const isValidValue = (value: any): boolean => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    };

    // Build update fields object - only include non-empty values
    const updateFields: any = {};
    
    // Personal Information
    if (isValidValue(body.fullName)) updateFields['Full Name'] = body.fullName;
    if (isValidValue(body.email)) updateFields['Email'] = body.email;
    if (isValidValue(body.phone)) updateFields['Phone'] = body.phone;
    if (isValidValue(body.location)) updateFields['Location'] = body.location;
    if (isValidValue(body.linkedin)) updateFields['LinkedIn'] = body.linkedin;
    if (isValidValue(body.summary)) updateFields['Summary'] = body.summary;
    
    // Experience and Education (handle both string and array)
    if (isValidValue(body.experience)) {
      updateFields['Experience'] = typeof body.experience === 'string' 
        ? body.experience 
        : JSON.stringify(body.experience);
    }
    if (isValidValue(body.education)) {
      updateFields['Education'] = typeof body.education === 'string'
        ? body.education
        : JSON.stringify(body.education);
    }
    
    // Skills and Certifications (handle both string and array)
    if (isValidValue(body.skills)) {
      const skillsValue = Array.isArray(body.skills) 
        ? body.skills.filter((s: string) => s.trim() !== '').join(', ') 
        : body.skills;
      if (skillsValue) updateFields['Skills'] = skillsValue;
    }
    if (isValidValue(body.certifications)) {
      const certsValue = Array.isArray(body.certifications)
        ? body.certifications.filter((c: string) => c.trim() !== '').join(', ')
        : body.certifications;
      if (certsValue) updateFields['Certifications'] = certsValue;
    }
    
    // Sales Details - Single/Multiple Select fields (must not be empty strings)
    if (isValidValue(body.industry)) updateFields['Industry'] = body.industry;
    if (isValidValue(body.salesRoleType)) updateFields['Sales Role Type'] = body.salesRoleType;
    if (body.annualRevenue !== undefined && body.annualRevenue !== null) {
      updateFields['Annual Revenue Generated'] = body.annualRevenue;
    }
    if (body.bookOfBusiness !== undefined && body.bookOfBusiness !== null) {
      updateFields['Book of Business'] = body.bookOfBusiness;
    }
    if (isValidValue(body.importExportFocus)) updateFields['Import Export Focus'] = body.importExportFocus;
    
    // Salary & Preferences
    if (body.salaryExpectationMin !== undefined && body.salaryExpectationMin !== null) {
      updateFields['Salary Expectation Min'] = body.salaryExpectationMin;
    }
    if (body.salaryExpectationMax !== undefined && body.salaryExpectationMax !== null) {
      updateFields['Salary Expectation Max'] = body.salaryExpectationMax;
    }
    if (isValidValue(body.willingToRelocate)) updateFields['Willing to Relocate'] = body.willingToRelocate;
    
    // Arrays - filter out empty values
    if (isValidValue(body.candidatePreferences)) {
      const validPrefs = Array.isArray(body.candidatePreferences) 
        ? body.candidatePreferences.filter((p: string) => p && p.trim() !== '')
        : body.candidatePreferences;
      if (validPrefs.length > 0) updateFields['Candidate Preferences'] = validPrefs;
    }
    if (isValidValue(body.tradeLanes)) {
      const validLanes = Array.isArray(body.tradeLanes)
        ? body.tradeLanes.filter((l: string) => l && l.trim() !== '')
        : body.tradeLanes;
      if (validLanes.length > 0) updateFields['Trade Lanes'] = validLanes;
    }
    if (isValidValue(body.modeOfTransportation)) {
      const validModes = Array.isArray(body.modeOfTransportation)
        ? body.modeOfTransportation.filter((m: string) => m && m.trim() !== '')
        : body.modeOfTransportation;
      if (validModes.length > 0) updateFields['Mode of Transportation'] = validModes;
    }
    
    // Other fields
    if (isValidValue(body.commodities)) updateFields['Commodities'] = body.commodities;
    if (isValidValue(body.InterviewSummary)) updateFields['Interviewsummary'] = body.InterviewSummary;

    console.log('Updating Airtable record with fields:', Object.keys(updateFields));
    
    // Only update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      console.log('⚠️ No valid fields to update');
      return NextResponse.json({
        success: false,
        message: 'No valid fields to update'
      }, { status: 400 });
    }

    await base('Candidates_V2').update(id, updateFields);
    console.log('✅ Airtable update successful!');

    // Fetch updated record
    const record = await base('Candidates_V2').find(id);

    if (!record) {
      console.error('❌ Candidate not found after update');
      return NextResponse.json({ error: 'Candidate not found after update' }, { status: 404 });
    }

    const candidateData = parseCandidateData(record);
    console.log('✅ PUT REQUEST COMPLETED SUCCESSFULLY');

    return NextResponse.json({
      success: true,
      candidate: candidateData,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ PUT REQUEST ERROR:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes('INVALID_MULTIPLE_CHOICE_OPTIONS')) {
        return NextResponse.json({ 
          error: 'Invalid field value',
          message: 'One or more fields contain invalid options. Please check your selections.'
        }, { status: 422 });
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}