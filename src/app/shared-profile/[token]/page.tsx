// app/shared-profile/[token]/page.tsx
'use client';

import { use } from 'react';
import CandidateDetailPage from '@/src/app/candidate/[id]/page';

export default function SharedProfilePage({ 
  params 
}: { 
  params: Promise<{ token: string }> 
}) {
  const { token } = use(params);

  return (
    <CandidateDetailPage 
      token={token} 
      shared={true} 
    />
  );
}