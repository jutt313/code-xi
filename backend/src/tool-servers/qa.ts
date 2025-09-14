import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runTests = async (): Promise<string> => {
    console.log('Running specialized tool: runTests');
    try {
        const { stdout } = await execAsync('cd backend && npm test');
        return `Tests passed successfully:\n${stdout}`;
    } catch (error: any) {
        // npm test exits with a non-zero code if tests failed.
        // The output is still useful.
        return `Tests failed. Output:\n${error.stdout || error.stderr || error.message}`;
    }
};
