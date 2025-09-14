import { getModel } from '../services/modelFactory';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import fs from 'fs/promises';
import db from '../db'; // Import the db module
import toposort from 'toposort'; // Import toposort
import BaseAgent from './BaseAgent'; // Import BaseAgent
import { UserProfileDetector, conceptTranslations, ProgressCommunicator, ErrorCommunicator } from '../services/userProfilingService';
import { projectDiscoveryManager, questionFlowManager, requirementsGenerator } from '../services/projectDiscoveryService';

interface UserProfile {
    technicalLevel: string;
    businessFocus: boolean;
    preferenceIndicators: boolean;
}


import {
    fullStackQueue,
    solutionsArchitectQueue,
    devOpsQueue,
    securityQueue,
    qaQueue,
    documentationQueue,
    performanceQueue
} from '../queue';

// Helper function for retrying promises
const retry = <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    return new Promise((resolve, reject) => {
        const attempt = (n: number) => {
            fn()
                .then(resolve)
                .catch(error => {
                    if (n === 1) {
                        reject(error);
                    } else {
                        console.log(`Attempt ${retries - n + 2} failed. Retrying in ${delay}ms...`);
                        setTimeout(() => attempt(n - 1), delay);
                    }
                });
        };
        attempt(retries);
    });
};

interface Task {
    task_id: string;
    description: string;
    agent: string;
    dependencies: string[];
    status: string;
}

interface Phase {
    phase_name: string;
    tasks: Task[];
}

const extractJson = (str: string): string | null => {
    const match = str.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
};

class ManagerAgent extends BaseAgent {
    private systemPrompt: string;
    private userProfileDetector: UserProfileDetector;
    private progressCommunicator: ProgressCommunicator;
    private errorCommunicator: ErrorCommunicator;
    private projectDiscoveryManager: typeof projectDiscoveryManager;
    private questionFlowManager: typeof questionFlowManager;

    constructor() {
        super();
        this.systemPrompt = ''; // Initialize with an empty string
        this.userProfileDetector = new UserProfileDetector();
        this.progressCommunicator = new ProgressCommunicator();
        this.errorCommunicator = new ErrorCommunicator();
        this.projectDiscoveryManager = projectDiscoveryManager;
        this.questionFlowManager = questionFlowManager;
        this.loadSystemPrompt();
    }

    private async loadSystemPrompt() {
        try {
            this.systemPrompt = await fs.readFile(__dirname + '/../prompts/manager_agent.prompt', 'utf-8');
        } catch (error) {
            console.error('Error loading manager agent system prompt', error);
            this.systemPrompt = 'You are a helpful assistant.'; // Fallback prompt
        }
    }

    async createNewProject(name: string, description: string | undefined, mode: string, initialPrompt: string, codebasePath?: string, userId?: number): Promise<{ projectId: number; response: string; }> {
        try {
            // 1. Determine user's technical level
            let userTechnicalLevel: string = 'unknown';
            let currentUserProfile: UserProfile | null = null;

            if (userId) {
                const userResult = await db.query('SELECT technical_level FROM users WHERE id = $1', [userId]);
                if (userResult.rows.length > 0) {
                    userTechnicalLevel = userResult.rows[0].technical_level;
                }
            }

            if (userTechnicalLevel === 'unknown') {
                currentUserProfile = this.userProfileDetector.analyzeUserProfile(initialPrompt, []);
                userTechnicalLevel = currentUserProfile.technicalLevel;
                if (userId) {
                    await db.query('UPDATE users SET technical_level = $1 WHERE id = $2', [userTechnicalLevel, userId]);
                }
            }

            // 2. Create a new project entry in the database, initially in 'discovery' status
            const projectResult = await db.query(
                'INSERT INTO projects (name, description, mode, status, codebase_path, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [name, description, mode, 'discovery', codebasePath, userId]
            );
            const projectId = projectResult.rows[0].id;

            // 3. Start project discovery process
            const discoveryOutput = await this.questionFlowManager.conductDiscovery(projectId, { technicalLevel: userTechnicalLevel }, initialPrompt);

            // Update project with initial project type and current question ID
            await db.query(
                'UPDATE projects SET project_type = $1, current_discovery_question_id = $2 WHERE id = $3',
                [discoveryOutput.projectType, discoveryOutput.sessionId, projectId] // Using sessionId as current_discovery_question_id for simplicity
            );

            return { projectId, response: `Project "${name}" created. Let's start by understanding your needs.\n${discoveryOutput.firstQuestion}` };
        } catch (error) {
            console.error('Error in ManagerAgent.createNewProject:', error);
            throw error; // Re-throw the error to be handled by the CLI
        }
    }

    async processProjectMessage(projectId: number, prompt: string): Promise<string> {
        try {
            // 1. Retrieve project context (plan, history) from DB
            const projectDataResult = await db.query('SELECT project_plan, mode, codebase_path, user_id FROM projects WHERE id = $1', [projectId]);
            if (projectDataResult.rows.length === 0) {
                throw new Error(`Project with ID ${projectId} not found.`);
            }
            const { project_plan: projectPlan, mode: projectMode, codebase_path: codebasePath, user_id: userId, status: projectStatus, current_discovery_question_id: currentDiscoveryQuestionId } = projectDataResult.rows[0];

            let userTechnicalLevel: string = 'unknown';
            let currentUserProfile: UserProfile | null = null;

            if (userId) {
                const userResult = await db.query('SELECT technical_level FROM users WHERE id = $1', [userId]);
                if (userResult.rows.length > 0) {
                    userTechnicalLevel = userResult.rows[0].technical_level;
                }
            }

            const conversationHistoryResult = await db.query(
                'SELECT role, message FROM conversations WHERE project_id = $1 ORDER BY created_at ASC',
                [projectId]
            );
            const conversationHistory = conversationHistoryResult.rows;

            // If technical level is unknown, try to detect it from current prompt and history
            if (userTechnicalLevel === 'unknown') {
                const historyMessages = conversationHistory.map(c => c.message);
                currentUserProfile = this.userProfileDetector.analyzeUserProfile(prompt, historyMessages);
                userTechnicalLevel = currentUserProfile.technicalLevel;
                if (userId) {
                    await db.query('UPDATE users SET technical_level = $1 WHERE id = $2', [userTechnicalLevel, userId]);
                }
            }

            // Save user's message to conversation history immediately, including detected user_profile
            await db.query('INSERT INTO conversations (project_id, role, message, user_profile) VALUES ($1, $2, $3, $4)', [projectId, 'user', prompt, currentUserProfile || {}]);

            // --- Project Discovery Flow ---
            if (projectStatus === 'discovery' && currentDiscoveryQuestionId) {
                const discoveryResult = await this.questionFlowManager.processAnswer(projectId, prompt);

                if (discoveryResult.type === 'question') {
                    // Update current question ID in projects table
                    await db.query(
                        'UPDATE projects SET current_discovery_question_id = $1 WHERE id = $2',
                        [discoveryResult.nextQuestionId, projectId]
                    );
                    return `Manager Agent: ${discoveryResult.content}`;
                } else if (discoveryResult.type === 'complete') {
                    // Discovery complete, generate project plan and update project status
                    const projectPlan = await this.generateProjectPlanFromRequirements(projectId, discoveryResult.requirements);
                    await db.query(
                        'UPDATE projects SET status = $1, project_plan = $2, current_discovery_question_id = NULL WHERE id = $3',
                        ['pending', projectPlan, projectId]
                    );
                    this.scheduleTasks(projectId);
                    return `Manager Agent: ${discoveryResult.content} Project plan generated and tasks scheduled.`;
                } else if (discoveryResult.type === 'clarification') {
                    return `Manager Agent: ${discoveryResult.content}`;
                }
            }
            // --- End Project Discovery Flow ---

            // If not in discovery phase, or discovery is complete, proceed with normal LLM interaction
            const { type, model, modelName } = getModel(projectMode, 'ManagerAgent');

            const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = [
                { role: 'system' as const, content: this.systemPrompt },
                // Add previous conversation history
                ...conversationHistory.map(c => ({ role: c.role as 'user' | 'assistant', content: c.message })),
                // Add current user prompt
                { role: 'user' as const, content: `
                    Project Plan: ${JSON.stringify(projectPlan)}
                    Codebase Path: ${codebasePath || 'Not provided'}
                    User's Technical Level: ${userTechnicalLevel}

                    User's current message: ${prompt}

                    Based on the project plan, conversation history, codebase path, and the user's technical level, determine the next action.
                    Adapt your response style to the user's technical level:
                    - If 'noCode': Focus on business outcomes, use simple analogies, avoid jargon.
                    - If 'business': Explain processes, show ROI, use some technical context.
                    - If 'technical': Provide architecture details, explain technology choices, show alternatives.
                    - If 'expert': Use deep technical specifications, implementation details, performance metrics.

                    Respond with a JSON object with the following structure:
                    {
                        "action": "answer_question" | "create_tasks" | "tool_call" | "update_plan" | "scan_codebase" | "progress_update" | "error_message",
                        "response"?: "string", // For answer_question, progress_update, error_message
                        "tasks"?: [], // For create_tasks (array of Task objects)
                        "tool"?: "string", // For tool_call (e.g., 'readFile', 'writeFile', 'executeCommand', 'listDirectory')
                        "args"?: {}, // For tool_call (arguments for the tool)
                        "updated_plan"?: {}, // For update_plan (the full updated project plan JSON)
                        "scan_options"?: "string", // For scan_codebase (e.g., 'full', 'structure_only', 'md_only')
                        "error_type"?: "string" // For error_message (e.g., 'api_rate_limit', 'dependency_conflict')
                    }
                    
                    If you are creating tasks, ensure they are valid Task objects as defined in the project plan structure.
                    If you are calling a tool, ensure the tool and args are correct.
                    If you are scanning the codebase, provide the scan_options.
                    If you are providing a progress update, set action to "progress_update".
                    If you are communicating an error, set action to "error_message" and provide error_type.
                    Always provide a response even if you are performing an action.
                ` }
            ];

            // LLM call logic (similar to createNewProject)
            const apiCall = () => {
                if (type === 'openai' && model instanceof OpenAI) {
                    return model.chat.completions.create({
                        messages: messages,
                        model: modelName,
                    }).then(completion => completion.choices[0].message.content);
                } else if (type === 'anthropic' && model instanceof Anthropic) {
                    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
                    const userMessages = messages.filter(m => m.role !== 'system') as { role: 'user' | 'assistant', content: string }[];
                    return model.messages.create({
                        max_tokens: 2048,
                        system: systemPrompt,
                        messages: userMessages,
                        model: modelName,
                    }).then(completion => {
                        const textBlock = completion.content.find(block => block.type === 'text');
                        return textBlock ? textBlock.text : 'No text response from Anthropic model.';
                    });
                } else if (type === 'gemini' && model instanceof GenerativeModel) {
                    const combinedPrompt = messages.map(m => m.content).join('\n');
                    return model.generateContent(combinedPrompt).then(async result => {
                        const response = await result.response;
                        return response.text();
                    });
                } else {
                    return Promise.reject(new Error('Unknown model type'));
                }
            };

            const managerResponseRaw = await retry(apiCall);

            if (!managerResponseRaw) {
                return 'Manager Agent: I received an empty response. Please try again or rephrase your request.';
            }

            // Save manager's raw response to conversation history
            await db.query('INSERT INTO conversations (project_id, role, message) VALUES ($1, $2, $3)', [projectId, 'assistant', managerResponseRaw]);

            // Parse the structured response
            const jsonString = extractJson(managerResponseRaw);
            if (!jsonString) {
                return `Manager Agent: I received a non-JSON response. Please try again or rephrase your request. Raw response: ${managerResponseRaw.substring(0, 200)}`;
            }

            let parsedResponse: any;
            try {
                parsedResponse = JSON.parse(jsonString);
            } catch (e) {
                return `Manager Agent: I received invalid JSON. Please try again. Raw JSON: ${jsonString.substring(0, 200)}`;
            }

            // Execute action based on parsedResponse.action
            switch (parsedResponse.action) {
                case 'answer_question':
                    let finalResponse = parsedResponse.response;
                    // Apply concept translations if available
                    for (const concept in conceptTranslations) {
                        if (finalResponse.includes(concept)) {
                            const translated = conceptTranslations[concept][userTechnicalLevel];
                            if (translated) {
                                finalResponse = finalResponse.replace(new RegExp(concept, 'g'), translated);
                            }
                        }
                    }
                    return `Manager Agent: ${finalResponse}`;
                case 'create_tasks':
                    if (parsedResponse.tasks && Array.isArray(parsedResponse.tasks)) {
                        for (const task of parsedResponse.tasks) {
                            await db.query(
                                'INSERT INTO agent_tasks (project_id, agent_type, task_description, status, task_id_ref) VALUES ($1, $2, $3, $4, $5)',
                                [projectId, task.agent, task.description, 'pending', task.task_id]
                            );
                        }
                        this.scheduleTasks(projectId);
                        return `Manager Agent: ${parsedResponse.response || 'Tasks created and scheduled.'}`;
                    } else {
                        return `Manager Agent: I was asked to create tasks, but the task list was invalid. Response: ${parsedResponse.response || 'No response.'}`;
                    }

                case 'tool_call':
                    if (parsedResponse.tool && parsedResponse.args) {
                        try {
                            const toolResult = await this.callMcpTool(parsedResponse.tool, parsedResponse.args);
                            return `Manager Agent: Tool '${parsedResponse.tool}' executed. Result: ${toolResult.substring(0, 500)}...`;
                        } catch (toolError: any) {
                            return `Manager Agent: Error executing tool '${parsedResponse.tool}': ${toolError.message.substring(0, 500)}...`;
                        }
                    } else {
                        return `Manager Agent: I was asked to call a tool, but the tool or arguments were missing. Response: ${parsedResponse.response || 'No response.'}`;
                    }

                case 'update_plan':
                    if (parsedResponse.updated_plan) {
                        await db.query(
                            'UPDATE projects SET project_plan = $1 WHERE id = $2',
                            [parsedResponse.updated_plan, projectId]
                        );
                        this.scheduleTasks(projectId); // Reschedule tasks based on updated plan
                        return `Manager Agent: ${parsedResponse.response || 'Project plan updated and tasks rescheduled.'}`;
                    } else {
                        return `Manager Agent: I was asked to update the plan, but no updated plan was provided. Response: ${parsedResponse.response || 'No response.'}`;
                    }
                
                case 'scan_codebase':
                    if (codebasePath && parsedResponse.scan_options) {
                        // This is where the actual codebase scanning logic would go.
                        // For now, we'll just acknowledge and list files if scan_options is 'full' or 'structure_only'
                        let scanResult = `Manager Agent: Initiating codebase scan for ${codebasePath} with options: ${parsedResponse.scan_options}.\n`;
                        if (parsedResponse.scan_options === 'full' || parsedResponse.scan_options === 'structure_only') {
                            try {
                                const files = await this.callMcpTool('listDirectory', { dirPath: codebasePath });
                                scanResult += `Files found: ${files.substring(0, 1000)}...`;
                            } catch (scanError: any) {
                                scanResult += `Error scanning directory: ${scanError.message.substring(0, 500)}...`;
                            }
                        }
                        // Future: Store scan result in agent_memory or project_files
                        return scanResult;
                    } else {
                        return `Manager Agent: Cannot scan codebase. Path not provided or scan options missing. Response: ${parsedResponse.response || 'No response.'}`;
                    }

                case 'progress_update':
                    return `Manager Agent: ${this.progressCommunicator.generateProgressUpdate({ technicalLevel: userTechnicalLevel }, [], [])}`;

                case 'error_message':
                    return `Manager Agent: ${this.errorCommunicator.explainError(parsedResponse.error_type || 'unknown_error', { technicalLevel: userTechnicalLevel })}`;

                default:
                    return `Manager Agent: I received an unknown action: '${parsedResponse.action}'. Response: ${parsedResponse.response || 'No response.'}`;
            }

        } catch (error) {
            console.error('Error in ManagerAgent.processProjectMessage:', error);
            throw error; // Re-throw for CLI to handle
        }
    }

    private async scheduleTasks(projectId: number) {
        const allProjectTasks = await db.query(
            'SELECT task_id_ref, agent_type, task_description, status FROM agent_tasks WHERE project_id = $1',
            [projectId]
        );
        const projectData = await db.query(
            'SELECT project_plan, mode FROM projects WHERE id = $1',
            [projectId]
        );

        if (projectData.rows.length === 0) {
            console.error(`Project with ID ${projectId} not found.`);
            return;
        }

        const { project_plan: projectPlan, mode: projectMode } = projectData.rows[0];

        if (!projectPlan) {
            console.warn(`Project ${projectId} has no project plan. Cannot schedule tasks.`);
            return;
        }

        const completedTasks = allProjectTasks.rows.filter(t => t.status === 'completed' || t.status === 'failed').map(t => t.task_id_ref);
        const pendingTasks = allProjectTasks.rows.filter(t => t.status === 'pending' || t.status === 'queued');

        for (const task of pendingTasks) {
            const originalTask = projectPlan.phases.flatMap((p: Phase) => p.tasks).find((t: Task) => t.task_id === task.task_id_ref);
            if (originalTask && originalTask.dependencies.every((dep: string) => completedTasks.includes(dep))) {
                if (task.status === 'pending') {
                    const jobPayload = { projectId, taskId: task.task_id_ref, task: task.task_description, mode: projectMode };
                    switch (task.agent_type) {
                        case 'FullStackEngineerAgent':
                            await fullStackQueue.add(task.task_id_ref, jobPayload);
                            break;
                        case 'SolutionsArchitectAgent':
                            await solutionsArchitectQueue.add(task.task_id_ref, jobPayload);
                            break;
                        case 'DevOpsEngineerAgent':
                            await devOpsQueue.add(task.task_id_ref, jobPayload);
                            break;
                        case 'SecurityEngineerAgent':
                            await securityQueue.add(task.task_id_ref, jobPayload);
                            break;
                        case 'QAEngineerAgent':
                            await qaQueue.add(task.task_id_ref, jobPayload);
                            break;
                        case 'DocumentationSpecialistAgent':
                            await documentationQueue.add(task.task_id_ref, jobPayload);
                            break;
                        case 'PerformanceEngineerAgent':
                            await performanceQueue.add(task.task_id_ref, jobPayload);
                            break;
                        default:
                            console.warn(`Unknown agent type for scheduling: ${task.agent_type}`);
                    }
                    await db.query(
                        'UPDATE agent_tasks SET status = $1 WHERE project_id = $2 AND task_id_ref = $3',
                        ['queued', projectId, task.task_id_ref]
                    );
                }
            }
        }
    }

    private async generateProjectPlanFromRequirements(projectId: number, requirements: any): Promise<any> {
        // This is a simplified conversion. A real implementation would use an LLM to create a detailed plan.
        const projectPlan = {
            project_name: `Project ${projectId}`,
            description: 'Generated from discovery requirements.',
            phases: [
                {
                    phase_name: 'Discovery & Planning',
                    tasks: [] as Task[]
                },
                {
                    phase_name: 'Development',
                    tasks: [] as Task[]
                },
                {
                    phase_name: 'Deployment',
                    tasks: [] as Task[]
                }
            ]
        };

        // Populate tasks based on requirements
        let taskIdCounter = 1;
        for (const category in requirements) {
            for (const req of requirements[category]) {
                const taskId = `TASK_${taskIdCounter++}`;
                projectPlan.phases[1].tasks.push({
                    task_id: taskId,
                    description: req.description,
                    agent: req.agents && req.agents.length > 0 ? req.agents[0] : 'FullStackEngineerAgent', // Default agent
                    dependencies: [],
                    status: 'pending'
                });
            }
        }

        return projectPlan;
    }

    async processTaskResult(projectId: number, taskIdRef: string, status: string, output: string) {
        await db.query(
            'UPDATE agent_tasks SET status = $1, output_data = $2, completed_at = NOW() WHERE project_id = $3 AND task_id_ref = $4',
            [status, output, projectId, taskIdRef]
        );

        await this.scheduleTasks(projectId);

        if (status === 'failed') {
            try {
                const errorDetails = JSON.parse(output);
                console.error(`Task ${taskIdRef} for project ${projectId} failed with error: ${errorDetails.details}`);
            } catch (e) {
                console.error(`Task ${taskIdRef} for project ${projectId} failed. Raw output: ${output}`);
            }
        } else {
            console.log(`Task ${taskIdRef} for project ${projectId} updated to ${status}.`);
        }
    }
}

export const managerAgent = new ManagerAgent();
