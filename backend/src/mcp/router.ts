import {
    readFile,
    writeFile,
    executeCommand,
    listDirectory
} from '../tool-servers/foundational';
import { runNpmAudit } from '../tool-servers/security';
import { runTests } from '../tool-servers/qa';
import { lintCode } from '../tool-servers/fullstack';
import { buildDockerImage } from '../tool-servers/devops';
import { generateArchitectureDiagram } from '../tool-servers/solutions';
import { getProjectStructure } from '../tool-servers/documentation';
import { runBenchmark } from '../tool-servers/performance';

// The registry for all available tools.
const toolRegistry: { [key: string]: (...args: any[]) => Promise<string> } = {
    readFile,
    writeFile,
    executeCommand,
    listDirectory,
    // Specialized Tools
    runNpmAudit,
    runTests,
    lintCode,
    buildDockerImage,
    generateArchitectureDiagram,
    getProjectStructure,
    runBenchmark,
};

export const routeMcpCall = async (toolName: string, args: any): Promise<string> => {
    if (toolRegistry[toolName]) {
        // The 'args' object from the agent's JSON output is an object like { filePath: '...' }.
        // We need to pass the *values* of that object as arguments to the tool function.
        const toolFunction = toolRegistry[toolName];
        const functionArgs = args ? Object.values(args) : [];
        return await toolFunction(...functionArgs);
    } else {
        throw new Error(`Tool ${toolName} not found in registry.`);
    }
};