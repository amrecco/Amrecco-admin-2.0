import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Airtable from 'airtable';
import { getIdentifierType } from '@/src/Utils/username';
import { formatLinkedInUrl } from '@/src/Utils/urlHelpers';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_TOKEN }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  try {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const path = slug.join('/');

    if (path === 'login') {
      const { identifier, password } = await request.json();

      if (!identifier || !password) {
        return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
      }

      const identifierType = getIdentifierType(identifier);
      const filterFormula = identifierType === 'email'
        ? `{Email} = '${identifier}'`
        : `{Username} = '${identifier.toLowerCase()}'`;

      const records = await base('Candidates_V2').select({
        filterByFormula: filterFormula,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
      }

      const user = records[0];
      const hashedPassword = user.get('Password') as string;

      const isValidPassword = await bcrypt.compare(password, hashedPassword);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.get('Email'),
          username: user.get('Username') || null
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.get('Email'),
          fullName: user.get('Full Name'),
          username: user.get('Username') || null
        }
      });
    } else if (path === 'logout') {
      
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully. Please clear token client-side.'
      });
    } else if (path === 'register') {
      const body = await request.json();
      const { username, email, password, candidateData } = body;

      if (!password || !candidateData) {
        return NextResponse.json(
          { error: 'Password and candidate data are required' },
          { status: 400 }
        );
      }

      if (!username && !email) {
        return NextResponse.json(
          { error: 'Either username or email is required' },
          { status: 400 }
        );
      }

      if (username) {
        const { validateUsername, isUsernameUnique } = await import('@/src/Utils/username');

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
          return NextResponse.json(
            { error: usernameValidation.error },
            { status: 400 }
          );
        }

        const isUnique = await isUsernameUnique(username);
        if (!isUnique) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 409 }
          );
        }
      }

      if (email) {
        const existingRecords = await base('Candidates_V2').select({
          filterByFormula: `{Email} = '${email}'`
        }).all();

        if (existingRecords.length > 0) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 409 }
          );
        }
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const fields: Record<string, any> = {
        'Full Name': candidateData.personalInfo.fullName,
        'Password': hashedPassword,
        'Phone': candidateData.personalInfo.phone || '',
        'Location': candidateData.personalInfo.location || '',
        'Summary': candidateData.summary || '',
        'Skills': candidateData.skills?.join(', ') || '',
        'Status': 'Active', 
        'Profile Created': true,
      }

      if (username) {
        fields['Username'] = username.toLowerCase().trim();
      }

      if (email) {
        fields['Email'] = email;
      }

      if (candidateData.personalInfo.linkedin) {
        fields['LinkedIn'] = formatLinkedInUrl(candidateData.personalInfo.linkedin)
      }

      if (candidateData.experience && candidateData.experience.length > 0) {
        fields['Experience'] = JSON.stringify(candidateData.experience)
        
        fields['Work Experience JSON'] = JSON.stringify(candidateData.experience)
      }

      if (candidateData.education && candidateData.education.length > 0) {
        fields['Education'] = JSON.stringify(candidateData.education)
      }

      if (candidateData.certifications && candidateData.certifications.length > 0) {
        fields['Certifications'] = candidateData.certifications.join(', ')
      }

      if (candidateData.qualifyingQuestions) {
        fields['US Based'] = candidateData.qualifyingQuestions.isUSBased || false
        fields['Logistics Sales Experience'] = candidateData.qualifyingQuestions.hasLogisticsSalesExperience || false
      }

      if (candidateData.logisticsExperience) {
        const logistics = candidateData.logisticsExperience

        if (logistics.industry) {
          fields['Industry'] = logistics.industry
        }

        if (logistics.salesRoleType) {
          fields['Sales Role Type'] = logistics.salesRoleType
        }

        if (logistics.annualRevenueGenerated && logistics.annualRevenueGenerated > 0) {
          fields['Annual Revenue Generated'] = logistics.annualRevenueGenerated
        }

        if (logistics.bookOfBusiness !== undefined) {
          fields['Book of Business'] = logistics.bookOfBusiness
        }

        if (logistics.commodities) {
          fields['Commodities'] = logistics.commodities
        }

        if (logistics.importExportFocus) {
          fields['Import Export Focus'] = logistics.importExportFocus
        }

        if (logistics.salesExperienceWithinLogistics !== undefined) {
          fields['Sales Experience Within Logistics'] = logistics.salesExperienceWithinLogistics
        }

        if (logistics.tradeLanes && Array.isArray(logistics.tradeLanes) && logistics.tradeLanes.length > 0) {
          fields['Trade Lanes'] = logistics.tradeLanes
        }

        if (logistics.modesOfTransportation && Array.isArray(logistics.modesOfTransportation) && logistics.modesOfTransportation.length > 0) {
          fields['Mode of Transportation'] = logistics.modesOfTransportation
        }

        if (logistics.salaryExpectationMin && logistics.salaryExpectationMin > 0) {
          fields['Salary Expectation Min'] = logistics.salaryExpectationMin
        }

        if (logistics.salaryExpectationMax && logistics.salaryExpectationMax > 0) {
          fields['Salary Expectation Max'] = logistics.salaryExpectationMax
        }

        if (logistics.candidatePreferences && Array.isArray(logistics.candidatePreferences) && logistics.candidatePreferences.length > 0) {
          fields['Candidate Preferences'] = logistics.candidatePreferences
        }

        if (logistics.willingToRelocate) {
          fields['Willing to Relocate'] = logistics.willingToRelocate
        }
      }

      const record = await base('Candidates_V2').create([{ fields }]);

      const token = jwt.sign(
        {
          userId: record[0].id,
          email: email || null,
          username: username || null,
          fullName: candidateData.personalInfo.fullName
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          id: record[0].id,
          email: email || null,
          username: username || null,
          fullName: candidateData.personalInfo.fullName
        }
      });
    } else {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}