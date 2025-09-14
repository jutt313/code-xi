import { managerAgent } from '../agents/ManagerAgent';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import db from '../db'; // Import the db module

import FullStackEngineerAgent from '../agents/FullStackEngineerAgent';
import SolutionsArchitectAgent from '../agents/SolutionsArchitectAgent';
import DevOpsEngineerAgent from '../agents/DevOpsEngineerAgent';
import SecurityEngineerAgent from '../agents/SecurityEngineerAgent';
import QAEngineerAgent from '../agents/QAEngineerAgent';
import DocumentationSpecialistAgent from '../agents/DocumentationSpecialistAgent';
import PerformanceEngineerAgent from '../agents/PerformanceEngineerAgent';

const connection = new Redis({
    host: 'localhost',
    port: 6379, // Default Redis port
    maxRetriesPerRequest: null,
});

export const fullStackQueue = new Queue('fullStackQueue', { connection });
export const solutionsArchitectQueue = new Queue('solutionsArchitectQueue', { connection });
export const devOpsQueue = new Queue('devOpsQueue', { connection });
export const securityQueue = new Queue('securityQueue', { connection });
export const qaQueue = new Queue('qaQueue', { connection });
export const documentationQueue = new Queue('documentationQueue', { connection });
export const performanceQueue = new Queue('performanceQueue', { connection });

const workerFactory = (queueName: string, agent: any, agentName: string) => {
    new Worker(queueName, async (job) => {
        console.log(`Processing ${agentName} job ${job.id}: ${job.data.task}`);
        let status = 'completed';
        let output = '';
        try {
            output = await agent.processTask(job.data.task, job.data.projectId, job.data.mode);
            try {
                const parsedOutput = JSON.parse(output);
                if (parsedOutput.type === 'TaskExecutionError') {
                    status = 'failed';
                }
            } catch (e) {
                // Not a JSON error object, proceed as completed
            }
        } catch (error: any) {
            status = 'failed';
            output = JSON.stringify({
                error: `Worker failed for ${agentName}.`,
                details: error.message,
                type: 'WorkerExecutionError'
            });
        }

        await managerAgent.processTaskResult(job.data.projectId, job.data.taskId, status, output);

        console.log(`${agentName} job ${job.id} completed with status: ${status}`);
    }, { connection });
};

workerFactory('fullStackQueue', FullStackEngineerAgent, 'FullStackEngineerAgent');
workerFactory('solutionsArchitectQueue', SolutionsArchitectAgent, 'SolutionsArchitectAgent');
workerFactory('devOpsQueue', DevOpsEngineerAgent, 'DevOpsEngineerAgent');
workerFactory('securityQueue', SecurityEngineerAgent, 'SecurityEngineerAgent');
workerFactory('qaQueue', QAEngineerAgent, 'QAEngineerAgent');
workerFactory('documentationQueue', DocumentationSpecialistAgent, 'DocumentationSpecialistAgent');
workerFactory('performanceQueue', PerformanceEngineerAgent, 'PerformanceEngineerAgent');
