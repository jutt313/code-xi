import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization to ensure env vars are loaded
let openai: OpenAI;
let anthropic: Anthropic;
let genAI: GoogleGenerativeAI;

const initializeClients = () => {
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (!anthropic) {
        anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    }
};
const ollama = new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama', // required but unused
});

const modelConfig = {
    'Code-XI': {
        ManagerAgent: 'gpt-4',
        FullStackEngineerAgent: 'claude-3-opus-20240229',
        SolutionsArchitectAgent: 'gpt-4',
        DevOpsEngineerAgent: 'gemini-pro',
        SecurityEngineerAgent: 'claude-3-opus-20240229',
        QAEngineerAgent: 'claude-3-sonnet-20240229',
        DocumentationSpecialistAgent: 'claude-3-sonnet-20240229',
        PerformanceEngineerAgent: 'gemini-pro',
    },
    'Code-XI-Pioneer': 'gpt-4',
    'Code-XI-Guardian': 'claude-3-opus-20240229',
    'Code-XI-Versatile': 'gemini-pro',
    'Code-XI-Local': 'ollama/llama3',
};

type ModelConfig = typeof modelConfig;
type CodeXIMode = keyof ModelConfig;
type AgentName = keyof (typeof modelConfig)['Code-XI'];

export const getModel = (mode: string, agent: string) => {
    // Initialize clients to ensure env vars are loaded
    initializeClients();
    
    let modelName: string;

    if (mode === 'Code-XI') {
        modelName = modelConfig[mode as 'Code-XI'][agent as AgentName];
    } else {
        const modelOrObject = modelConfig[mode as CodeXIMode];
        if (typeof modelOrObject === 'string') {
            modelName = modelOrObject;
        } else {
            // This should not happen based on the logic, but it's good to have a fallback
            throw new Error('Invalid mode configuration');
        }
    }

    if (modelName.startsWith('ollama/')) {
        return {
            type: 'openai', // Ollama uses an OpenAI-compatible API
            model: ollama,
            modelName: modelName.replace('ollama/', ''),
        };
    } else if (modelName.startsWith('gpt')) {
        return {
            type: 'openai',
            model: openai,
            modelName,
        };
    } else if (modelName.startsWith('claude')) {
        return {
            type: 'anthropic',
            model: anthropic,
            modelName,
        };
    } else if (modelName.startsWith('gemini')) {
        return {
            type: 'gemini',
            model: genAI.getGenerativeModel({ model: modelName }),
            modelName,
        };
    } else {
        throw new Error(`Unknown model: ${modelName}`);
    }
};
