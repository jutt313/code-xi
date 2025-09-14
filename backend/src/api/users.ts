import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface AuthenticatedRequest extends Request {
    userId?: number;
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );
    res.status(201).json({ 
      message: 'Registration successful! Please log in.',
      user: result.rows[0] 
    });
  } catch (error: any) {
    console.error('Error registering user', error);
    
    // Handle duplicate email error
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(400).json({ error: 'Email already exists. Please use a different email or try logging in.' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1h',
        });

        res.json({ token });
    } catch (error) {
        console.error('Error logging in user', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await db.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user profile', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;
