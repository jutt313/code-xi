import express, { Request, Response } from 'express';
import { managerAgent } from '../agents/ManagerAgent';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface AuthenticatedRequest extends Request {
    userId?: number;
}

// Create a new project
router.post('/create', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, mode, initialPrompt, codebasePath } = req.body;
    const userId = req.userId; // From authenticateToken middleware

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found.' });
    }

    if (!name || !mode || !initialPrompt) {
        return res.status(400).json({ error: 'Project name, mode, and initial prompt are required.' });
    }

    try {
        const { projectId, response } = await managerAgent.createNewProject(
            name,
            description,
            mode,
            initialPrompt,
            codebasePath,
            userId // Pass userId to managerAgent
        );
        res.status(201).json({ projectId, message: response });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project.', details: (error as Error).message });
    }
});

// Send a message to an existing project (continue conversation)
router.post('/:projectId/message', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const { prompt } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found.' });
    }

    if (!prompt) {
        return res.status(400).json({ error: 'Message prompt is required.' });
    }

    try {
        // Basic authorization: check if project belongs to user
        const projectResult = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
        if (projectResult.rows.length === 0 || projectResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: Project not found or does not belong to user.' });
        }

        const response = await managerAgent.processProjectMessage(parseInt(projectId), prompt);
        res.json({ message: response });
    } catch (error) {
        console.error(`Error processing message for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to process message.', details: (error as Error).message });
    }
});

// Get a list of projects for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found.' });
    }

    try {
        const result = await db.query('SELECT id, name, description, status, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects.', details: (error as Error).message });
    }
});

export default router;
