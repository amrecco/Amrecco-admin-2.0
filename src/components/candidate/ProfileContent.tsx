'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  Target, 
  Building2, 
  DollarSign, 
  Briefcase, 
  MapPin, 
  Award, 
  GraduationCap,
  Video,
  Calendar,
  MessageCircle,
  TrendingUp,
  Heart,
  ClipboardList,
  Upload,
  FileAudio,
  Scissors,
  CheckCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { CandidateDetail } from './types';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Type alias for Kanban stages
type KanbanStage =
  | "Initial Screening"
  | "Interviewed"
  | "Profile Shared"
  | "Final Decision";

interface ExpandableListProps {
  items: string[];
  maxInitialItems?: number;
}

const ExpandableList: React.FC<ExpandableListProps> = ({ items, maxInitialItems = 3 }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (items.length <= maxInitialItems) {
    // If at or under the limit, show all
    return (
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="text-sm">{item}</div>
        ))}
      </div>
    );
  }
  
  // If more than the limit, show with expand/collapse
  const visibleItems = showAll ? items : items.slice(0, maxInitialItems - 1);
  const hiddenCount = items.length - (maxInitialItems - 1);
  
  return (
    <div className="space-y-1">
      {visibleItems.map((item, index) => (
        <div key={index} className="text-sm">{item}</div>
      ))}
      <button
        onClick={() => setShowAll(!showAll)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors"
      >
        {showAll 
          ? 'Show Less' 
          : `+${hiddenCount} More`
        }
      </button>
    </div>
  );
};
interface ProfileContentProps {
  candidate: CandidateDetail;
  profileTab: string;
  setProfileTab: (tab: string) => void;
  isEditing?: boolean;
  onCandidateChange?: (candidate: CandidateDetail) => void;
  isSharedView?: boolean;
  visibleTabs?: string[]; // Add this
}

export default function ProfileContent({ 
  candidate, 
  profileTab, 
  setProfileTab, 
  isEditing = false, 
  onCandidateChange,
  isSharedView = false,
  visibleTabs = ["overview", "experience", "summary", "video", "availability"] // Default all tabs
}: ProfileContentProps) {
   // Audio processing states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioChunks, setAudioChunks] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [fullTranscription, setFullTranscription] = useState('');
  const [interviewAnalysis, setInterviewAnalysis] = useState<any>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<any>(null);
  


   const profileTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'summary', label: 'Summary', icon: ClipboardList },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'availability', label: 'Availability', icon: Calendar },
  ].filter(tab => visibleTabs.includes(tab.id));

  // Set initial tab to first visible tab
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(profileTab)) {
      setProfileTab(visibleTabs[0]);
    }
  }, [visibleTabs, profileTab, setProfileTab]);

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  // Load FFmpeg
  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return;
    
    try {
      setProgressMessage('Loading FFmpeg (one-time setup)...');
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }: any) => {
 
      });
      
      ffmpeg.on('progress', ({ progress }: any) => {
        if (isProcessing) {
          setProgressMessage(`Processing: ${Math.round(progress * 100)}%`);
        }
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      setProgressMessage('FFmpeg loaded successfully!');
      setTimeout(() => setProgressMessage(''), 2000);
    } catch (error: any) {
      console.error('Error loading FFmpeg:', error);
      setProgressMessage('Error loading FFmpeg: ' + error.message);
    }
  };

  // Split audio using FFmpeg
  const splitAudioWithFFmpeg = async (file: File, numChunks = 3) => {
    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error('FFmpeg not loaded');

      setProgressMessage('Loading audio file...');
      
      const fileData = await fetchFile(file);
      const inputName = 'input.mp3';
      
      await ffmpeg.writeFile(inputName, fileData);
      
      setProgressMessage('Analyzing audio duration...');
      
      let duration = 0;
      let durationDetected = false;
      
      const logHandler = ({ message }: any) => {
        const match = message.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (match && !durationDetected) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = parseFloat(match[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
          durationDetected = true;
        }
      };
      
      ffmpeg.on('log', logHandler);
      
      try {
        await ffmpeg.exec(['-i', inputName]);
      } catch (e) {
      }
      
      ffmpeg.off('log', logHandler);
      
      if (duration === 0) {
        setProgressMessage('Converting audio format...');
        
        await ffmpeg.exec([
          '-i', inputName,
          '-acodec', 'libmp3lame',
          '-b:a', '128k',
          '-ar', '44100',
          'converted.mp3'
        ]);
        
        ffmpeg.on('log', logHandler);
        try {
          await ffmpeg.exec(['-i', 'converted.mp3']);
        } catch (e) {
        }
        ffmpeg.off('log', logHandler);
        
        if (duration > 0) {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.rename('converted.mp3', inputName);
        } else {
          throw new Error('Could not detect audio duration. The file may be corrupted or in an unsupported format.');
        }
      }
      
      setProgressMessage(`Audio is ${Math.round(duration)}s long. Splitting into ${numChunks} chunks...`);
      
      const chunkDuration = duration / numChunks;
      const chunks = [];
      
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      
      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration;
        const outputName = `chunk_${i + 1}.mp3`;
        
        setProgressMessage(`Creating chunk ${i + 1} of ${numChunks}... (${Math.round(startTime)}s to ${Math.round(startTime + chunkDuration)}s)`);
        
        
        if (i === numChunks - 1) {
          await ffmpeg.exec([
            '-i', inputName,
            '-ss', startTime.toFixed(2),
            '-acodec', 'libmp3lame',
            '-b:a', '128k',
            outputName
          ]);
        } else {
          await ffmpeg.exec([
            '-i', inputName,
            '-ss', startTime.toFixed(2),
            '-t', chunkDuration.toFixed(2),
            '-acodec', 'libmp3lame',
            '-b:a', '128k',
            outputName
          ]);
        }
        
        const data = await ffmpeg.readFile(outputName);
        
        const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
        
        if (blob.size === 0) {
          console.error(`ERROR: Chunk ${i + 1} is empty!`);
          throw new Error(`Chunk ${i + 1} is empty. This may be due to an FFmpeg processing error.`);
        }
        
        chunks.push({
          blob: blob,
          name: `${fileNameWithoutExt}_part${i + 1}.mp3`,
          size: (blob.size / (1024 * 1024)).toFixed(2),
          index: i + 1,
          duration: i === numChunks - 1 ? (duration - startTime) : chunkDuration
        });
        
        await ffmpeg.deleteFile(outputName);
      }
      
      await ffmpeg.deleteFile(inputName);
      
      setProgressMessage('✓ Splitting complete!');
      return chunks;
      
    } catch (error: any) {
      console.error('Error splitting audio:', error);
      throw error;
    }
  };

  // Transcribe file using OpenAI Whisper
  const transcribeFile = async (fileBlob: Blob, fileName: string) => {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not set.');
      }

      const formData = new FormData();
      formData.append('file', fileBlob, fileName);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error: any) {
      console.error('Error transcribing:', error);
      throw error;
    }
  };

// Analyze transcription using OpenAI GPT
const analyzeInterview = async (transcription: string) => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set.');
    }

    setIsAnalyzing(true);
    setProgressMessage('Analyzing interview with AI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales recruiter analyzing candidate interview transcriptions. You MUST respond with valid JSON only. Do not include any text before or after the JSON object. Extract all candidate information directly from the interview audio transcription.'
          },
          {
            role: 'user',
            content: `Analyze the following interview transcription and provide a comprehensive summary in JSON format.

Interview Transcription:
${transcription}

IMPORTANT: Extract ALL information from the transcription itself. Listen carefully to what the candidate says about themselves.

Provide your analysis in this exact JSON structure:
{
  "overallSummary": "A 2-3 sentence overview of the candidate",
  "strengths": ["List 4-6 key strengths with specific examples from the interview"],
  "weaknesses": ["List 3-5 areas for improvement or concerns mentioned"],
  "keySkills": ["List 5-8 relevant skills the candidate mentioned"],
  "cultureFit": "Assessment of cultural fit and soft skills based on the interview",
  "recommendationScore": 85,
  "recommendation": "Brief recommendation (Highly Recommend/Recommend/Consider/Not Recommended)",
  "notableQuotes": ["2-3 impactful quotes from the candidate"],
  "redFlags": ["Any concerns or red flags mentioned, empty array if none"],
  "candidateProfile": {
    "tradeLane": "Extract trade lanes/routes mentioned by candidate (e.g., 'Asia-US', 'Europe-Asia') or 'Not mentioned'",
    "preferredCompanyType": "Extract preferred company type mentioned (e.g., 'NVOCC', 'Freight Forwarder', '3PL') or 'Not mentioned'",
    "preferredLocation": "Extract preferred work location mentioned or 'Not mentioned'",
    "willingToRelocate": "Extract if candidate mentioned willingness to relocate (Yes/No/Not mentioned)",
    "currentRole": "Extract current or most recent sales role mentioned or 'Not mentioned'",
    "currentRevenue": "Extract annual revenue/sales figures mentioned or 'Not mentioned'",
    "salaryExpectation": "Extract salary expectations mentioned or 'Not mentioned'",
    "bookOfBusiness": "Extract if candidate mentioned having a book of business (Yes/No/Not mentioned)",
    "yearsOfExperience": "Extract total years of experience mentioned or 'Not mentioned'",
    "importExportFocus": "Extract import/export focus mentioned (Import/Export/Both/Not mentioned)",
    "industry": "Extract industry/vertical mentioned (e.g., 'Logistics', 'Freight Forwarding') or 'Not mentioned'",
    "modeOfTransportation": "Extract transportation modes mentioned (e.g., 'Ocean', 'Air', 'Ground', 'Rail') or 'Not mentioned'"
  }
}

Remember: All information in candidateProfile should come from what the candidate actually said in the interview, not from external data.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
      
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    // Get response text first
    const responseText = await response.text();
    
    // Parse the response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    const analysisText = result.choices?.[0]?.message?.content;
    
    if (!analysisText) {
      console.error('No content in OpenAI response:', result);
      throw new Error('No content received from OpenAI');
    }
    
    
    // Parse JSON from response - handle potential markdown code blocks
    let analysis;
    try {
      // Remove potential markdown code blocks
      const cleanedText = analysisText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedText);
    } catch (jsonError) {
      console.error('Failed to parse analysis JSON:', analysisText);
      throw new Error('Invalid JSON in analysis response');
    }
    
    setInterviewAnalysis(analysis);
    setProgressMessage('✓ Analysis complete! Saving to database...');
    
    // Save to Airtable via API
const summaryString = JSON.stringify(analysis);

try {
  
  // First try POST (for new summary)
  const saveResponse = await fetch(`/api/candidate/${candidate.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      InterviewSummary: summaryString
    })
  });


  // If POST fails, handle the error
  if (!saveResponse.ok) {
    // Get response as text first to see what we're dealing with
    const errorText = await saveResponse.text();
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (parseError) {
      console.error('Failed to parse error response as JSON:', parseError);
      throw new Error(`API error (${saveResponse.status}): ${errorText || saveResponse.statusText}`);
    }
    
    if (saveResponse.status === 409 || errorData.hasExistingSummary) {

      
      const updateResponse = await fetch(`/api/candidate/${candidate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          InterviewSummary: summaryString
        })
      });


      if (!updateResponse.ok) {
        const updateErrorText = await updateResponse.text();
        
        let updateError;
        try {
          updateError = JSON.parse(updateErrorText);
        } catch (parseError) {
          console.error('Failed to parse PUT error response:', parseError);
          throw new Error(`Failed to update (${updateResponse.status}): ${updateErrorText || updateResponse.statusText}`);
        }
        
        throw new Error(`Failed to update: ${updateError.error || updateResponse.statusText}`);
      }
      
      // Parse successful PUT response
      const updateText = await updateResponse.text();
      
      let updateData;
      try {
        updateData = JSON.parse(updateText);
      } catch (parseError) {
        console.error('Failed to parse PUT success response:', parseError);
        console.error('Response text:', updateText);
        throw new Error('Invalid JSON in PUT response');
      }
      
      
      // Update local state
      if (onCandidateChange && updateData.candidate) {
        onCandidateChange(updateData.candidate);
      }
    } else {
      throw new Error(`Failed to save: ${errorData.error || saveResponse.statusText}`);
    }
  } else {
    // Parse successful POST response
    const saveText = await saveResponse.text();
    
    let saveData;
    try {
      saveData = JSON.parse(saveText);
    } catch (parseError) {
      console.error('Failed to parse POST success response:', parseError);
      console.error('Response text:', saveText);
      throw new Error('Invalid JSON in POST response');
    }
    
    
    // Update local state
    if (onCandidateChange && saveData.candidate) {
      onCandidateChange(saveData.candidate);
    }
  }
  
  setProgressMessage('✓ Analysis saved successfully!');
  
} catch (saveError) {
  console.error('Error stack:', saveError instanceof Error ? saveError.stack : 'No stack');
  
  setProgressMessage('⚠️ Analysis complete but failed to save to database');
  alert(`Analysis complete but failed to save: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
  // Still show the analysis even if save fails
}    
    return analysis;
  } catch (error: any) {
    console.error('Error analyzing interview:', error);
    setProgressMessage(`Analysis error: ${error.message}`);
    alert(`Error analyzing interview: ${error.message}`);
    throw error;
  } finally {
    setIsAnalyzing(false);
  }
};
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;


    if (!selectedFile.type.startsWith('audio/')) {
      alert('Please select a valid audio file');
      return;
    }

    setAudioFile(selectedFile);
    setAudioChunks([]);
    setProgressMessage('');
    setFullTranscription('');
    setInterviewAnalysis(null);
    
    if (!ffmpegLoaded) {
      await loadFFmpeg();
    }
  };

  // Handle split and transcribe
  const handleProcessAudio = async () => {
    if (!audioFile) return;
    
    if (!ffmpegLoaded) {
      await loadFFmpeg();
    }

    try {
      // Step 1: Split audio
      setIsProcessing(true);
      setProgressMessage('Starting split process...');
      
      const splitChunks = await splitAudioWithFFmpeg(audioFile, 3);
      setAudioChunks(splitChunks);
      setProgressMessage('✓ Splitting complete!');
      
      // Step 2: Transcribe all chunks
      setIsTranscribing(true);
      setProgressMessage(`Transcribing ${splitChunks.length} chunks...`);

      const transcriptions = [];
      
      for (let i = 0; i < splitChunks.length; i++) {
        setProgressMessage(`Transcribing chunk ${i + 1} of ${splitChunks.length}...`);
        const text = await transcribeFile(splitChunks[i].blob, splitChunks[i].name);
        transcriptions.push(text);
      }
      
      const combined = transcriptions.join(' ');
      setFullTranscription(combined);
      setProgressMessage(`✓ All ${splitChunks.length} chunks transcribed successfully!`);
      
      // Step 3: Analyze with AI
      await analyzeInterview(combined);
      
    } catch (error: any) {
      console.error('Processing error:', error);
      setProgressMessage('Error: ' + error.message);
      alert('Error processing audio: ' + error.message);
    } finally {
      setIsProcessing(false);
      setIsTranscribing(false);
    }
  };

  // Load existing interview summary if available
  useEffect(() => {
    if (candidate.InterviewSummary) {
      try {
        const analysis = JSON.parse(candidate.InterviewSummary);
        setInterviewAnalysis(analysis);
      } catch (error) {
        console.error('Error parsing existing interview summary:', error);
      }
    }
  }, [candidate.InterviewSummary]);

  const renderProfileTabContent = () => {
    switch (profileTab) {
      case 'overview':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6">
            
            {/* Sales Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Sales Summary</h2>
                  <p className="text-gray-600 text-sm">Professional overview and achievements</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">
                  {candidate.summary || 'No sales summary available.'}
                </p>
              </div>
            </div>

            {/* Sales Details */}
            <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-1">Sales Performance</h2>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium">Key metrics and specializations</p>
                </div>
              </div>
              
              {/* Unified Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-xl p-6 border border-blue-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Industry</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight">
                    {candidate.industry || 'Not Specified'}
                  </p>
                </div>
                
                <div className="group bg-gradient-to-br from-purple-50 to-purple-100/70 rounded-xl p-6 border border-purple-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Sales Role</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight">
                    {candidate.salesRoleType || 'Not Specified'}
                  </p>
                </div>
                
                <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-xl p-6 border border-emerald-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Revenue</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight">
                    {candidate.annualRevenue ? `$${candidate.annualRevenue.toLocaleString()}` : 'Not Specified'}
                  </p>
                </div>
                
                <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-xl p-6 border border-emerald-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Book of Business</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight">
                    {candidate.bookOfBusiness ? 'Yes ✅' : 'No ❌'}
                  </p>
                </div>
              </div>
              
              {/* Unified Three Columns -> Four Columns */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-xl p-6 border border-blue-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Trade Lanes</p>
                  <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight">
                    {candidate.tradeLanes && candidate.tradeLanes.length > 0 ? (
                      <ExpandableList items={candidate.tradeLanes} maxInitialItems={3} />
                    ) : (
                      'Not Specified'
                    )}
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-orange-50 to-orange-100/70 rounded-xl p-6 border border-orange-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Commodities</p>
                  <div className="text-sm">
                    {candidate.commodities || 'Not Specified'}
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-xl p-6 border border-emerald-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Import/Export Focus</p>
                  <div className="text-sm">
                    {candidate.importExportFocus || 'Not Specified'}
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-purple-50 to-purple-100/70 rounded-xl p-6 border border-purple-200/60 text-center transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3 uppercase">Transportation</p>
                  <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight">
                    {candidate.modeOfTransportation && candidate.modeOfTransportation.length > 0 ? (
                      <ExpandableList items={candidate.modeOfTransportation} maxInitialItems={3} />
                    ) : (
                      'Not Specified'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Career Expectations */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-1">Career Expectations</h2>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium">Salary expectations and preferences</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Salary Range - Enhanced */}
                <div className="lg:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-xl p-6 border border-emerald-200/60">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mr-3 shadow-md">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-xl">Salary Range</h3>
                  </div>
                  {candidate.salaryExpectationMin && candidate.salaryExpectationMax ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/60 shadow-sm text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-700 mb-2">
                          ${candidate.salaryExpectationMin.toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-600 uppercase tracking-wide">Minimum</p>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/60 shadow-sm text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-700 mb-2">
                          ${candidate.salaryExpectationMax.toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-600 uppercase tracking-wide">Maximum</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/70 rounded-xl p-6 text-center border border-emerald-200/40">
                      <p className="text-slate-500 font-medium">Not specified</p>
                    </div>
                  )}
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  {/* Relocation Card */}
                  <div className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-md ${
                    candidate.willingToRelocate === 'Yes'
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100/70 border-blue-200/60'
                      : 'bg-gradient-to-br from-red-50 to-red-100/70 border-red-200/60'
                  }`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                        candidate.willingToRelocate === 'Yes' 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
                          : 'bg-gradient-to-br from-red-600 to-red-700'
                      }`}>
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">Relocation</h3>
                    </div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm ${
                      candidate.willingToRelocate === 'Yes'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300/50'
                        : 'bg-red-100 text-red-800 border border-red-300/50'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        candidate.willingToRelocate === 'Yes' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      {candidate.willingToRelocate || 'No'}
                    </div>
                  </div>
                  
                  {/* Preferences Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 rounded-xl p-4 border border-purple-200/60 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">Preferences</h3>
                    </div>
                      {/* Full Transcription (Collapsible) */}
                      {fullTranscription && (
                        <details className="bg-gradient-to-br from-white to-slate-50/30 rounded-xl p-6 border border-slate-200/60 shadow-sm">
                          <summary className="cursor-pointer font-bold text-slate-900 text-lg mb-4 flex items-center gap-3">
                            <ClipboardList className="w-6 h-6 text-slate-600" />
                            Full Interview Transcription
                          </summary>
                          <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {fullTranscription}
                            </p>
                          </div>
                        </details>
                      )}
                    {candidate.candidatePreferences && candidate.candidatePreferences.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {candidate.candidatePreferences.map((pref, index) => (
                          <div key={index} className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full border border-purple-300/50">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                            {pref}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-300/50">
                        No preferences specified
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'experience':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6">
            {/* Work Experience */}
            <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-1">Work Experience</h2>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium">Professional career journey</p>
                </div>
              </div>
              
              <div className="relative">
                {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 ? (
                  <div className="space-y-8">
                    {candidate.experience
                      .sort((a, b) => {
                        // Extract years from duration strings for sorting
                        const getEndYear = (duration: string) => {
                          const match = duration.match(/(\d{4})(?:-|–|—)?(present|\d{4})?/g);
                          if (!match) return 0;
                          const years = match[match.length - 1].match(/\d{4}/g);
                          return years ? parseInt(years[years.length - 1]) : 0;
                        };
                        return getEndYear(b.duration) - getEndYear(a.duration);
                      })
                      .map((exp, index) => (
                      <div key={index} className="relative pl-8">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                        {/* Timeline line */}
                        {index < candidate.experience.length - 1 && (
                          <div className="absolute left-2 top-6 w-0.5 h-16 bg-gradient-to-b from-blue-200 to-slate-200"></div>
                        )}
                        
                        <div className="bg-gradient-to-r from-white to-slate-50/50 rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-1">
                                {exp.company}
                              </h3>
                              <p className="text-sm sm:text-base lg:text-lg font-semibold text-blue-700 mb-2">{exp.position}</p>
                            </div>
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm font-bold rounded-full border border-blue-300/50">
                                {exp.duration}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg p-5 border border-slate-200/50">
                            <p className="text-slate-700 leading-relaxed text-sm font-medium">
                              {exp.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : candidate.experienceText ? (
                  <div className="bg-gradient-to-r from-white to-slate-50/50 rounded-xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="prose prose-slate max-w-none">
                      <div className="text-slate-800 leading-relaxed whitespace-pre-line font-medium text-sm">
                        {candidate.experienceText.split('\n').map((line, index) => {
                          const trimmedLine = line.trim();
                          if (!trimmedLine) return <br key={index} />;
                          
                          // Check if line looks like a company/position header (contains years or dates)
                          const isHeader = /\b(19|20)\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(trimmedLine);
                          
                          if (isHeader) {
                            return (
                              <div key={index} className="mb-4 mt-6 first:mt-0">
                                <h4 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">
                                  {trimmedLine}
                                </h4>
                              </div>
                            );
                          }
                          
                          // Check if line starts with bullet point or dash
                          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                            return (
                              <div key={index} className="flex items-start mb-2">
                                <span className="text-blue-600 mr-2 mt-1">•</span>
                                <span>{trimmedLine.substring(1).trim()}</span>
                              </div>
                            );
                          }
                          
                          return (
                            <p key={index} className="mb-3">
                              {trimmedLine}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-8 border border-slate-200/50 text-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      No work experience added yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Education</h2>
                  <p className="text-slate-600 text-sm font-medium">Academic background</p>
                </div>
              </div>
              
              <div className="relative">
                {candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0 ? (
                  <div className="space-y-6">
                    {candidate.education
                      .sort((a, b) => {
                        const yearA = parseInt(a.graduationYear) || 0;
                        const yearB = parseInt(b.graduationYear) || 0;
                        return yearB - yearA; // Sort descending (newest first)
                      })
                      .map((edu, index) => (
                      <div key={index} className="relative pl-8">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 w-4 h-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full border-4 border-white shadow-lg"></div>
                        {/* Timeline line */}
                        {index < candidate.education.length - 1 && (
                          <div className="absolute left-2 top-6 w-0.5 h-12 bg-gradient-to-b from-emerald-200 to-slate-200"></div>
                        )}
                        
                        <div className="bg-gradient-to-r from-white to-emerald-50/30 rounded-xl p-6 border border-emerald-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-slate-900 mb-1">
                                {edu.institution}
                              </h3>
                              <p className="text-lg font-semibold text-emerald-700 mb-2">
                                {edu.degree} in {edu.field}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-full border border-emerald-300/50">
                                {edu.type}
                              </span>
                              <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 text-sm font-bold rounded-full border border-emerald-300/50">
                                {edu.graduationYear}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : candidate.educationText ? (
                  <div className="bg-gradient-to-r from-white to-emerald-50/30 rounded-xl p-6 border border-emerald-200/60 shadow-sm">
                    <div className="prose prose-slate max-w-none">
                      <div className="text-slate-800 leading-relaxed whitespace-pre-line font-medium text-sm">
                        {candidate.educationText.split('\n').map((line, index) => {
                          const trimmedLine = line.trim();
                          if (!trimmedLine) return <br key={index} />;
                          
                          // Check if line looks like a school/degree header (contains years or degree keywords)
                          const isHeader = /\b(19|20)\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(Bachelor|Master|PhD|Associate|Diploma|Certificate|University|College|School)\b/i.test(trimmedLine);
                          
                          if (isHeader) {
                            return (
                              <div key={index} className="mb-4 mt-6 first:mt-0">
                                <h4 className="text-lg font-bold text-slate-900 mb-2 border-b border-emerald-200 pb-2">
                                  {trimmedLine}
                                </h4>
                              </div>
                            );
                          }
                          
                          // Check if line starts with bullet point or dash
                          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                            return (
                              <div key={index} className="flex items-start mb-2">
                                <span className="text-emerald-600 mr-2 mt-1">•</span>
                                <span>{trimmedLine.substring(1).trim()}</span>
                              </div>
                            );
                          }
                          
                          return (
                            <p key={index} className="mb-3">
                              {trimmedLine}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-xl p-8 border border-slate-200/50 text-center">
                    <div className="w-16 h-16 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      No education information added yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Certifications</h2>
                  <p className="text-slate-600 text-sm font-medium">Professional credentials</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-slate-50 to-purple-50/30 rounded-xl p-6 border border-slate-200/50">
                <p className="text-slate-800 leading-relaxed whitespace-pre-line text-base font-medium">
                  {candidate.certifications || 'No certifications added yet.'}
                </p>
              </div>
            </div>
          </motion.div>
        );

case 'summary':
  const interviewedStages: KanbanStage[] = ['Interviewed', 'Profile Shared', 'Final Decision'];
  const currentStage = (candidate as any).stage as KanbanStage | undefined;
  const isInterviewed = currentStage ? interviewedStages.includes(currentStage) : false;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6">
      
      {/* Interview Summary Section */}
      <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Interview Summary</h2>
              <p className="text-slate-600 text-sm font-medium">
                {isSharedView ? 'AI-powered analysis' : 'Audio upload and AI-powered analysis'}
              </p>
            </div>
          </div>
          
          {/* Re-upload Button - Only show if NOT shared view and analysis exists */}
          {!isSharedView && interviewAnalysis && (
            <button
              onClick={() => {
                setInterviewAnalysis(null);
                setFullTranscription('');
                setAudioFile(null);
                setAudioChunks([]);
                setProgressMessage('Ready to upload new interview audio');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Re-upload Interview
            </button>
          )}
        </div>
        
        {/* Main Content Logic */}
        {(isSharedView || isInterviewed) ? (
          <div className="space-y-6">
            {/* Upload Section - Only show for non-shared view without existing analysis */}
            {!isSharedView && !interviewAnalysis && (
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-8 border border-slate-200/50">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileAudio className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-800">Upload Interview Audio</h3>
                  <p className="text-slate-600 font-medium mb-6">Upload the interview recording to generate an AI-powered summary</p>
                </div>
                
                {!OPENAI_API_KEY && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ API Keys Required</p>
                        <p className="text-sm text-yellow-700">
                          Set NEXT_PUBLIC_OPENAI_API_KEY environment variable to enable transcription and analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* File Upload */}
                <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 mb-6 text-center hover:border-indigo-400 transition-colors bg-white/50">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="audio-upload"
                    disabled={isProcessing || isTranscribing}
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Click to upload audio file
                    </p>
                    <p className="text-sm text-gray-500">Supported: MP3, WAV, M4A, OGG, etc.</p>
                  </label>
                </div>

                {/* Selected File Display */}
                {audioFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <FileAudio className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800">{audioFile.name}</p>
                      <p className="text-sm text-gray-600">
                        Size: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Type: {audioFile.type}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Message */}
                {progressMessage && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      {(isProcessing || isTranscribing || isAnalyzing) && (
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      )}
                      <p className="text-sm text-gray-700">{progressMessage}</p>
                    </div>
                  </div>
                )}

                {/* Process Button */}
                {audioFile && !interviewAnalysis && (
                  <button
                    onClick={handleProcessAudio}
                    disabled={isProcessing || isTranscribing || isAnalyzing || !ffmpegLoaded || !OPENAI_API_KEY}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isProcessing || isTranscribing || isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isProcessing && 'Splitting Audio...'}
                        {isTranscribing && 'Transcribing...'}
                        {isAnalyzing && 'Analyzing with AI...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {ffmpegLoaded ? 'Process & Analyze Interview' : 'Loading FFmpeg...'}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Analysis Results Display - Show for both shared and regular views */}
            {interviewAnalysis && (
              <div className="space-y-6">
                {/* Overall Summary */}
                <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-6 border border-blue-200/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Overall Summary</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{interviewAnalysis.overallSummary}</p>
                </div>

                {/* Recommendation Score */}
                <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-xl p-6 border border-emerald-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Recommendation</h3>
                        <p className="text-sm text-slate-600">{interviewAnalysis.recommendation}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-700 mb-1">
                        {interviewAnalysis.recommendationScore}
                      </div>
                      <div className="text-xs text-slate-600 font-semibold">out of 100</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${interviewAnalysis.recommendationScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Strengths & Weaknesses Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl p-6 border border-green-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                        <ThumbsUp className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Strengths</h3>
                    </div>
                    <ul className="space-y-3">
                      {interviewAnalysis.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-slate-700 leading-relaxed">{strength}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-6 border border-orange-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-md">
                        <ThumbsDown className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Areas for Improvement</h3>
                    </div>
                    <ul className="space-y-3">
                      {interviewAnalysis.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-slate-700 leading-relaxed">{weakness}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Skills */}
                <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl p-6 border border-purple-200/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Key Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interviewAnalysis.keySkills.map((skill: string, index: number) => (
                      <div key={index} className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 text-sm font-bold rounded-full border border-purple-300/50">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Culture Fit */}
                <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-6 border border-blue-200/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Culture Fit Assessment</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{interviewAnalysis.cultureFit}</p>
                </div>

                {/* Notable Quotes */}
                {interviewAnalysis.notableQuotes && interviewAnalysis.notableQuotes.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl p-6 border border-indigo-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Notable Quotes</h3>
                    </div>
                    <div className="space-y-4">
                      {interviewAnalysis.notableQuotes.map((quote: string, index: number) => (
                        <div key={index} className="bg-indigo-50/50 border-l-4 border-indigo-600 rounded-r-lg p-4">
                          <p className="text-slate-700 italic leading-relaxed">"{quote}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
               
                {/* Red Flags */}
                {interviewAnalysis.redFlags && interviewAnalysis.redFlags.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl p-6 border border-red-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-md">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Concerns & Red Flags</h3>
                    </div>
                    <ul className="space-y-3">
                      {interviewAnalysis.redFlags.map((flag: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-slate-700 leading-relaxed">{flag}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Candidate Profile Summary Section */}
                {interviewAnalysis.candidateProfile && (
                  <div className="bg-gradient-to-br from-white to-slate-50/30 rounded-xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Candidate Profile Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Trade Lane */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-lg p-4 border border-blue-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Trade Lane</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.tradeLane}</p>
                      </div>
                      
                      {/* Preferred Company Type */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 rounded-lg p-4 border border-purple-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Preferred Company</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.preferredCompanyType}</p>
                      </div>
                      
                      {/* Location */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-lg p-4 border border-emerald-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Preferred Location</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.preferredLocation}</p>
                      </div>
                      
                      {/* Willing to Relocate */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100/70 rounded-lg p-4 border border-orange-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Willing to Relocate</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.willingToRelocate}</p>
                      </div>
                      
                      {/* Current Role */}
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/70 rounded-lg p-4 border border-indigo-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Current Role</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.currentRole}</p>
                      </div>
                      
                      {/* Current Revenue */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100/70 rounded-lg p-4 border border-green-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Current Revenue</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.currentRevenue}</p>
                      </div>
                      
                      {/* Salary Expectation */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-lg p-4 border border-emerald-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Salary Expectation</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.salaryExpectation}</p>
                      </div>
                      
                      {/* Book of Business */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-lg p-4 border border-blue-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Book of Business</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.bookOfBusiness}</p>
                      </div>
                      
                      {/* Years of Experience */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 rounded-lg p-4 border border-purple-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Years of Experience</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.yearsOfExperience}</p>
                      </div>
                      
                      {/* Import/Export Focus */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100/70 rounded-lg p-4 border border-orange-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Import/Export Focus</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.importExportFocus}</p>
                      </div>
                      
                      {/* Industry */}
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/70 rounded-lg p-4 border border-indigo-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Industry</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.industry}</p>
                      </div>
                      
                      {/* Mode of Transportation */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100/70 rounded-lg p-4 border border-green-200/60">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Mode of Transportation</p>
                        <p className="text-sm font-bold text-slate-900">{interviewAnalysis.candidateProfile.modeOfTransportation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Transcription (Collapsible) - Only show in non-shared view */}
                {!isSharedView && fullTranscription && (
                  <details className="bg-gradient-to-br from-white to-slate-50/30 rounded-xl p-6 border border-slate-200/60 shadow-sm">
                    <summary className="cursor-pointer font-bold text-slate-900 text-lg mb-4 flex items-center gap-3">
                      <ClipboardList className="w-6 h-6 text-slate-600" />
                      Full Interview Transcription
                    </summary>
                    <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {fullTranscription}
                      </p>
                    </div>
                  </details>
                )}
              </div>
            )}
            
            {/* No summary available message - Only for shared view without analysis */}
            {isSharedView && !interviewAnalysis && (
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-12 border border-slate-200/50 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">No Interview Summary Available</h3>
                <p className="text-slate-600 font-medium">Interview summary will be available once the candidate is interviewed</p>
              </div>
            )}
          </div>
        ) : (
          /* Not interviewed message - Only for non-shared view */
          <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-xl p-12 border border-orange-200/50 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Candidate Not Interviewed</h3>
            <p className="text-slate-600 font-medium mb-4">This candidate must be in the "Interviewed" stage or beyond to upload interview summaries</p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 text-sm font-bold rounded-full border border-orange-300/50">
              Current Stage: {currentStage || 'Initial Screening'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
      case 'video':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6">
            {/* Intro Video */}
            <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Introduction Video</h2>
                  <p className="text-slate-600 text-sm font-medium">Personal introduction and presentation</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-red-50/30 rounded-xl p-12 border border-slate-200/50 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">No intro video available</h3>
                <p className="text-slate-600 font-medium">No introduction video has been uploaded for this candidate</p>
              </div>
            </div>
            
            {/* Feedback Section */}
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Feedback</h2>
                  <p className="text-slate-600 text-sm font-medium">Employer and recruiter feedback</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-green-50/30 rounded-xl p-12 border border-slate-200/50 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">No feedback yet</h3>
                <p className="text-slate-600 font-medium">Feedback from employers and recruiters will appear here</p>
              </div>
            </div>
          </motion.div>
        );
        case 'availability':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6">
            
            {/* Calendar/Availability */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Availability</h2>
                  <p className="text-slate-600 text-sm font-medium">Interview scheduling and calendar</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-12 border border-slate-200/50 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">No calendar link available</h3>
                <p className="text-slate-600 font-medium">No calendar link has been provided by this candidate</p>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Enhanced Profile Sub-tabs - Mobile Optimized */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-slate-100 to-slate-200/50 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2 lg:gap-3">
          {profileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = profileTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setProfileTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-3 rounded-lg sm:rounded-xl text-sm sm:text-sm font-bold transition-all duration-300 shadow-sm justify-center sm:justify-start ${
                  isActive
                    ? 'bg-gradient-to-r from-white to-slate-50 text-[#001e4f] shadow-md border border-slate-200/60'
                    : 'text-slate-600 hover:text-[#001e4f] hover:bg-white/70 hover:shadow-md border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderProfileTabContent()}
    </div>
  );
}