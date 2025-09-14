import db from '../db';

interface MemoryContext {
    decision: string;
    reasoning: string;
    [key: string]: any; // Allow other properties
}

class MemoryService {
    /**
     * Saves a memory for a specific agent and project.
     * @param agentType The type of the agent (e.g., 'SolutionsArchitectAgent').
     * @param projectId The ID of the current project.
     * @param context An object containing the decision and reasoning.
     */
    async saveMemory(agentType: string, projectId: number, context: MemoryContext): Promise<void> {
        try {
            await db.query(
                'INSERT INTO agent_memory (agent_type, project_id, context) VALUES ($1, $2, $3)',
                [agentType, projectId, JSON.stringify(context)]
            );
            console.log(`Memory saved for ${agentType} in project ${projectId}.`);
        } catch (error) {
            console.error('Error saving agent memory:', error);
            // We don't re-throw here as failing to save a memory shouldn't halt the entire process.
        }
    }

    /**
     * Retrieves relevant memories for a given task description.
     * This simulates a vector search using keyword matching on the JSONB context.
     * @param taskDescription The description of the current task.
     * @param projectId The ID of the current project to scope the search.
     * @returns A string containing a summary of relevant memories.
     */
    async retrieveRelevantMemories(taskDescription: string, projectId: number): Promise<string> {
        try {
            // Extract keywords from the task description (simple split for simulation)
            const keywords = taskDescription.split(/\s+/).filter(k => k.length > 3);
            if (keywords.length === 0) {
                return '';
            }

            // Build a dynamic query to search for keywords in the context.
            // This is a simplified keyword search, not a true vector search.
            const searchConditions = keywords.map((_, i) => `(context->>'decision' ILIKE $${i + 2} OR context->>'reasoning' ILIKE $${i + 2})`).join(' OR ');
            const searchValues = keywords.map(k => `%${k}%`);

            const query = {
                text: `SELECT context FROM agent_memory WHERE project_id = $1 AND (${searchConditions}) ORDER BY created_at DESC LIMIT 5`,
                values: [projectId, ...searchValues],
            };

            const result = await db.query(query.text, query.values);

            if (result.rows.length === 0) {
                return '';
            }

            // Format the memories to be injected into the prompt
            const memories = result.rows.map((row, i) => `Past Decision ${i + 1}: ${row.context.decision}. Reasoning: ${row.context.reasoning}`).join('\n');
            
            const memoryContext = `
--- Relevant Past Decisions ---
Here are some relevant decisions from past projects that might be helpful:
${memories}
-----------------------------
`;
            console.log(`Retrieved ${result.rows.length} relevant memories for project ${projectId}.`);
            return memoryContext;

        } catch (error) {
            console.error('Error retrieving agent memories:', error);
            return ''; // Return empty string on error to not halt the process
        }
    }
}

export const memoryService = new MemoryService();
