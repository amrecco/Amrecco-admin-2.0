import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_TOKEN,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export async function isUsernameUnique(username: string): Promise<boolean> {
  if (!username) return true;
  
  const normalizedUsername = username.toLowerCase().trim();
  
  try {
    const [candidateCheck, hmCheck] = await Promise.all([
      base('Candidates_V2').select({
        filterByFormula: `{Username} = '${normalizedUsername}'`,
        maxRecords: 1
      }).firstPage(),
      base('Hiring_Managers').select({
        filterByFormula: `{Username} = '${normalizedUsername}'`,
        maxRecords: 1
      }).firstPage()
    ]);
    
    return candidateCheck.length === 0 && hmCheck.length === 0;
  } catch (error) {
    console.error('Username uniqueness check error:', error);
    return false;
  }
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) return { valid: true }; 
  
  if (username.length < 3 || username.length > 30) {
    return { valid: false, error: 'Username must be 3-30 characters' };
  }
  
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(username)) {
    return { 
      valid: false, 
      error: 'Username can only contain letters, numbers, underscore, and dash' 
    };
  }
  
  return { valid: true };
}

export function getIdentifierType(identifier: string): 'email' | 'username' {
  return identifier.includes('@') ? 'email' : 'username';
}