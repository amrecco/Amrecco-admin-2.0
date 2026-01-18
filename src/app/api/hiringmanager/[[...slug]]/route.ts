import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_TOKEN }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  try {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const path = slug.join('/');

    if (path === 'applications') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const applications = await base('Applications').select({
        filterByFormula: `{Candidate} = '${decoded.userId}'`,
        sort: [{ field: 'Applied Date', direction: 'desc' }]
      }).all();

      const applicationData = await Promise.all(
        applications.map(async (app) => {
          const jobField = app.get('Job');
          const jobId = Array.isArray(jobField) ? jobField[0] : jobField;
          let jobDetails = {};

          if (jobId) {
            try {
              const job = await base('Jobs').find(jobId);
              jobDetails = {
                title: job.get('Title') || '',
                company: job.get('Company') || '',
                location: job.get('Location') || '',
                salary: job.get('Salary Range') || ''
              };
            } catch (error) {
              console.error('Error fetching job details:', error);
            }
          }

          return {
            id: app.id,
            ...jobDetails,
            status: app.get('Status') || 'applied',
            appliedDate: app.get('Applied Date') || '',
            matchScore: app.get('Match Score') || 0,
            interviewDate: app.get('Interview Date') || null,
            interviewType: app.get('Interview Type') || null,
            interviewer: app.get('Interviewer') || null,
            notes: app.get('Notes') || ''
          };
        })
      );

      return NextResponse.json({
        success: true,
        applications: applicationData
      });
    } else if (path === 'jobs') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const applications = await base('Applications').select({
        filterByFormula: `{Candidate} = '${decoded.userId}'`
      }).all();

      const appliedJobIds = applications.map(app => {
        const jobField = app.get('Job');
        return Array.isArray(jobField) ? jobField[0] : jobField;
      });

      const jobs = await base('Jobs').select({
        filterByFormula: `{Status} = 'Active'`,
        sort: [{ field: 'Posted Date', direction: 'desc' }]
      }).all();

      const jobMatches = jobs.map(job => {
        const hasApplied = appliedJobIds.includes(job.id);
        const application = applications.find(app => {
          const jobField = app.get('Job');
          const jobId = Array.isArray(jobField) ? jobField[0] : jobField;
          return jobId === job.id;
        });

        return {
          id: job.id,
          title: job.get('Title') || '',
          company: job.get('Company') || '',
          location: job.get('Location') || '',
          salary: job.get('Salary Range') || '',
          description: job.get('Description') || '',
          postedDate: job.get('Posted Date') || '',
          matchScore: Math.floor(Math.random() * 20) + 80, 
          status: hasApplied ? (application?.get('Status') || 'applied') : 'new',
          jobType: job.get('Job Type') || '',
          experienceLevel: job.get('Experience Level') || '',
          skillsRequired: job.get('Skills Required') || ''
        };
      });

      return NextResponse.json({
        success: true,
        jobs: jobMatches
      });
    } else if (path === 'profile') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const record = await base('Candidates_V2').find(decoded.userId);

      if (!record) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      const rawExperience = record.get('Experience') as string || '';
      const rawEducation = record.get('Education') as string || '';

      let parsedExperience = rawExperience;
      let parsedEducation = rawEducation;

      try {
        if (rawExperience.startsWith('[') || rawExperience.startsWith('{')) {
          parsedExperience = JSON.parse(rawExperience);
          
          if (Array.isArray(parsedExperience)) {
            parsedExperience.sort((a, b) => {
              const getEndYear = (duration: string) => {
                const match = duration.match(/(\d{4})(?:-|\u2013|\u2014)?(present|\d{4})?/g);
                if (!match) return 0;
                const years = match[match.length - 1].match(/\d{4}/g);
                return years ? parseInt(years[years.length - 1]) : 0;
              };
              return getEndYear(b.duration) - getEndYear(a.duration);
            });
          }
        }
      } catch {
        
      }

      try {
        if (rawEducation.startsWith('[') || rawEducation.startsWith('{')) {
          parsedEducation = JSON.parse(rawEducation);
          
          if (Array.isArray(parsedEducation)) {
            parsedEducation.sort((a, b) => {
              const yearA = parseInt(a.graduationYear) || 0;
              const yearB = parseInt(b.graduationYear) || 0;
              return yearB - yearA;
            });
          }
        }
      } catch {
        
      }

      const userData = {
        id: record.id,
        email: record.get('Email') || '',
        fullName: record.get('Full Name') || '',
        phone: record.get('Phone') || '',
        location: record.get('Location') || '',
        linkedin: record.get('LinkedIn') || '',
        summary: record.get('Summary') || '',
        experience: parsedExperience,
        education: parsedEducation,
        skills: record.get('Skills') || '',
        certifications: record.get('Certifications') || '',
        status: record.get('Status') || 'New',
        resumeFile: record.get('Resume File') || [],
        applicationCount: record.get('Application Count') || 0,
        managerRating: record.get('Manager Rating') || 0,
        profileCreated: record.get('Profile Created') || false,
        lastLogin: record.get('Last Login') || '',
        createdDate: record.get('Created Date') || '',
        notes: record.get('Notes') || '',
        
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
        usBasedStatus: record.get('US Based') || false
      };

      return NextResponse.json({
        success: true,
        user: userData
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