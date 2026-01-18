import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET 
);

interface TokenPayload {
  username: string;
  role: string;
}

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7days
    .sign(JWT_SECRET);

  return token;
}

export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(JWT_REFRESH_SECRET);

  return token;
}

export async function verifyToken(
  token: string, 
  isRefreshToken = false
): Promise<TokenPayload> {
  const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
  
  const { payload } = await jwtVerify(token, secret);
  
  return payload as unknown as TokenPayload;
}

export async function decodeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}