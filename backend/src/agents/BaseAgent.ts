import { routeMcpCall } from '../mcp/router';

class BaseAgent {
    // MCP Tool Router
    async callMcpTool(toolName: string, args: any): Promise<string> {
        console.log(`Agent calling MCP tool: ${toolName} with args: ${JSON.stringify(args)}`);
        
        try {
            // Delegate the call to the central MCP router
            return await routeMcpCall(toolName, args);
        } catch (error) {
            // Re-throw the error to be caught by the specialist agent's processTask method
            console.error(`Error executing tool ${toolName}:`, error);
            throw error;
        }
    }
}

export default BaseAgent;
