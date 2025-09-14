import 'dotenv/config';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { 
    fullStackQueue, 
    solutionsArchitectQueue, 
    devOpsQueue, 
    securityQueue, 
    qaQueue, 
    documentationQueue, 
    performanceQueue 
} from './queue';

import fullStackEngineerAgent from './agents/FullStackEngineerAgent';
import solutionsArchitectAgent from './agents/SolutionsArchitectAgent';
import devOpsEngineerAgent from './agents/DevOpsEngineerAgent';
import securityEngineerAgent from './agents/SecurityEngineerAgent';
import qaEngineerAgent from './agents/QAEngineerAgent';
import documentationSpecialistAgent from './agents/DocumentationSpecialistAgent';
import performanceEngineerAgent from './agents/PerformanceEngineerAgent';

import { managerAgent } from './agents/ManagerAgent';

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
});

console.log("Worker process started. Connecting to Redis...");

const createWorker = (queueName: string, agent: any) => {
    new Worker(queueName, async (job) => {
        console.log(`Processing job ${job.id} from queue ${queueName}`);
        const { projectId, taskId, task, mode } = job.data;

        try {
            const result = await agent.processTask(task, projectId, mode);
            console.log(`Job ${job.id} from ${queueName} completed with result:`, result);
            await managerAgent.processTaskResult(projectId, taskId, 'completed', JSON.stringify(result));
        } catch (error: any) {
            console.error(`Job ${job.id} from ${queueName} failed:`, error);
            await managerAgent.processTaskResult(projectId, taskId, 'failed', JSON.stringify({ error: error.message, stack: error.stack }));
        }
    }, {
        connection: redisConnection,
        concurrency: 5, // Process 5 jobs concurrently per worker
    });
    console.log(`Worker for ${queueName} registered.`);
};

// Register workers for each agent queue
createWorker(fullStackQueue.name, fullStackEngineerAgent);
createWorker(solutionsArchitectQueue.name, solutionsArchitectAgent);
createWorker(devOpsQueue.name, devOpsEngineerAgent);
createWorker(securityQueue.name, securityEngineerAgent);
createWorker(qaQueue.name, qaEngineerAgent);
createWorker(documentationQueue.name, documentationSpecialistAgent);
createWorker(performanceQueue.name, performanceEngineerAgent);

console.log("All workers registered.");
