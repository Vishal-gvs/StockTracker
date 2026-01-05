import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { config } from '../config/env';

const generateTokens = (user: any) => {
  const accessToken = jwt.sign({ id: user._id, role: user.role }, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });

    res.json({ 
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    // In a real app, verify google token here using google-auth-library
    // For now, assuming frontend sends valid email/googleId after client-side verification or simple payload
    const { name, email, googleId } = req.body;
    
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, googleId, role: 'user' }); // Default role user
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });

    res.json({ 
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
     res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

export const register = async (req: Request, res: Response) => {
   // Optional: For manually creating users if needed, or initial admin
    try {
      const { name, email, password, adminCode } = req.body;
      if (await User.findOne({ email })) return res.status(400).json({ message: 'User exists' });

      // Check for Admin Code
      let role = 'user';
      if (adminCode && adminCode === process.env.ADMIN_CODE) {
          role = 'admin';
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({ name, email, passwordHash, role });
      await user.save();

      const { accessToken, refreshToken } = generateTokens(user);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });

    res.json({ 
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
    } catch (error) {
      res.status(500).json({ message: 'Error registering user' });
    }
};
