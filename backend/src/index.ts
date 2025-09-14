import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bearerToken from 'express-bearer-token';
import db from './db';
import usersRoutes from './api/users';
import projectsRoutes from './api/projects';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(bearerToken());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);

const startServer = async () => {
  try {
    // The following line is commented out because we are not testing the DB connection here.
    // We will test it when we create the first endpoint.
    // await db.query('SELECT NOW()');
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
};

startServer();
