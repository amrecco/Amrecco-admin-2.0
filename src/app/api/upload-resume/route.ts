import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { formatLinkedInUrl } from '@/src/Utils/urlHelpers';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY});

export async function POST(request: NextRequest) {
  try {
    const { extractedText, isImageBased, base64Image } = await request.json();
    
    let finalText = extractedText;

    if (isImageBased || !extractedText?.trim()) {
      if (!base64Image) {
        return NextResponse.json({ error: 'Image data required for OCR processing' }, { status: 400 });
      }

      const ocrResult = await processWithVisionAPI(base64Image);
      finalText = ocrResult;
    }
    
    if (!finalText || !finalText.trim()) {
      return NextResponse.json({ error: 'No text could be extracted from the file' }, { status: 400 });
    }

    const prompt = `
    Extract the following information from this resume text and return it as a JSON object:
    
    IMPORTANT INSTRUCTIONS:
    - For "experience": ONLY include actual work experience with companies/organizations where the person had a job title/role and was employed or contracted. List in reverse chronological order (most recent first).
    - DO NOT include personal projects, academic projects, or side projects in the experience section.
    - Projects should be ignored unless they were part of actual employment.
    - Work experience must have: company name, job title/position, and employment duration.
    - Internships and part-time jobs count as work experience if they have a company and role.
    - For "education": List education entries in reverse chronological order (most recent first). Use 4-digit years for graduationYear.
    
    {
      "personalInfo": {
        "fullName": "string",
        "email": "string", 
        "phone": "string",
        "location": "string (city, state/country)",
        "linkedin": "string (Full LinkedIn URL starting with https:
      },
      "summary": "string (professional summary or objective - if not explicitly stated, create a brief one based on experience and skills)",
      "experience": [
        {
          "company": "string (actual company/organization name - NOT personal projects)",
          "position": "string (job title/role - e.g., Software Engineer, Sales Manager, Intern)",
          "duration": "string (employment period - e.g., Jan 2020 - Dec 2022, 2020-2023, Summer 2021)",
          "description": "string (key responsibilities, achievements, and impact in this role)"
        }
      ],
      "education": [
        {
          "institution": "string (school/university name)",
          "degree": "string (degree type - e.g., Bachelor of Science, Master of Arts, High School Diploma)",
          "field": "string (field of study - e.g., Computer Science, Business Administration)",
          "graduationYear": "string (graduation year or expected graduation - use 4-digit year format)",
          "type": "string (highschool/bachelor/masters/phd/certificate)"
        }
      ],
      "skills": ["array of relevant technical and professional skills - extract from skills section and infer from experience"],
      "certifications": ["array of professional certifications, licenses, or credentials if mentioned"]
    }
    
    Resume text:
    ${finalText}
    
    Return only the JSON object, no additional text. Ensure all fields are properly filled based on the resume content.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a resume parser that extracts structured information from resume text. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(completion.choices[0].message.content || '{}');

    if (extractedData.personalInfo?.linkedin) {
      extractedData.personalInfo.linkedin = formatLinkedInUrl(extractedData.personalInfo.linkedin);
    }

    return NextResponse.json({
      success: true,
      extractedText: finalText,
      structuredData: extractedData,
      processingMethod: isImageBased ? 'ocr' : 'text'
    });

  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume. Please try again.' },
      { status: 500 }
    );
  }
}

async function processWithVisionAPI(base64Image: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Extract all text from this resume image. Return the complete text content exactly as it appears, maintaining the original structure and formatting as much as possible. Include all sections like contact information, work experience, education, skills, etc." 
          },
          { 
            type: "image_url", 
            image_url: { url: base64Image } 
          },
        ]},
    ],
    max_tokens: 4000,
    temperature: 0.1});

  const extractedText = completion.choices[0].message.content;
  
  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('Could not extract sufficient text from the image');
  }

  return extractedText.trim();
}