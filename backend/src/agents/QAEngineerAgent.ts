import BaseAgent from './BaseAgent';
import { getModel } from '../services/modelFactory';
import { memoryService } from '../services/memoryService'; // Import MemoryService
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import fs from 'fs/promises';

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

class QAEngineerAgent extends BaseAgent {
    private systemPrompt: string;

    constructor() {
        super();
        this.systemPrompt = ''; // Initialize with an empty string
        this.loadSystemPrompt();
    }

    private async loadSystemPrompt() {
        try {
            this.systemPrompt = await fs.readFile(__dirname + '/../prompts/qa_engineer_agent.prompt', 'utf-8');
        } catch (error) {
            console.error('Error loading qa engineer agent system prompt', error);
            this.systemPrompt = 'You are a helpful assistant.'; // Fallback prompt
        }
    }

    async processTask(task: string, projectId: number, mode: string): Promise<string> {
        try {
            const { type, model, modelName } = getModel(mode, 'QAEngineerAgent');

            // 1. Retrieve relevant memories
            const relevantMemories = await memoryService.retrieveRelevantMemories(task, projectId);

            const userPrompt = `
                ${relevantMemories}

                Based on the following task, decide which tool to use and what the parameters should be. The output should be a JSON object with "tool": "executeCommand", "args": {"command": "npm test"}}. Task: ${task}
            `;

            const messages: { role: 'system' | 'user', content: string }[] = [
                { role: 'system' as const, content: this.systemPrompt },
                { role: 'user' as const, content: userPrompt }
            ];

            let modelResponse: string | null;

            const apiCall = () => {
                if (type === 'openai' && model instanceof OpenAI) {
                    return model.chat.completions.create({
                        messages: messages,
                        model: modelName,
                    }).then(completion => completion.choices[0].message.content);
                } else if (type === 'anthropic' && model instanceof Anthropic) {
                    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
                    const userMessages = messages.filter(m => m.role !== 'system') as { role: 'user', content: string }[];
                    return model.messages.create({
                        max_tokens: 1024,
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

            modelResponse = await retry(apiCall);

            if (modelResponse === null) {
                throw new Error('The model returned an empty response after multiple retries.');
            }

            // 2. Save the decision to memory
            try {
                const parsedResponse = JSON.parse(modelResponse);
                if (parsedResponse.tool && parsedResponse.args) {
                    const { tool, args } = parsedResponse;
                    // Don't save tool calls as decisions, only architectural plans.
                    return await this.callMcpTool(tool, args);
                } else {
                    // This is a direct response (e.g., code snippet or plan), save it.
                    await memoryService.saveMemory('QAEngineerAgent', projectId, {
                        decision: `Generated QA plan/action for task: "${task}"`,
                        reasoning: `The model generated the following response: ${modelResponse.substring(0, 500)}...`,
                        response: modelResponse
                    });
                    return modelResponse;
                }
            } catch (e) {
                 // If parsing fails, it's a direct text response (e.g., code snippet or plan).
                 await memoryService.saveMemory('QAEngineerAgent', projectId, {
                    decision: `Generated QA plan/action for task: "${task}"`,
                    reasoning: `The model generated the following response: ${modelResponse.substring(0, 500)}...`,
                    response: modelResponse
                });
                return modelResponse;
            }
        } catch (error) {
            console.error(`Error in QAEngineerAgent processTask:`, error);
            // Return a structured error object
            return JSON.stringify({
                error: `Task failed for QAEngineerAgent.`,
                details: (error as Error).message,
                type: 'TaskExecutionError'
            });
        }
    }
}

export default new QAEngineerAgent();