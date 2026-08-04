import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Hash plain password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare plain password with hashed password
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate JWT Token containing User ID and Role
export const generateToken = (payload: { userId: string; role: string; branchId?: string | null }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};