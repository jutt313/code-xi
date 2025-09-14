import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const lintCode = async (filePath: string): Promise<string> => {
    console.log(`Running real tool: lintCode on ${filePath} using ESLint`);
    try {
        // Assuming ESLint is installed globally or locally in node_modules
        // and a .eslintrc config exists in the project root or parent directories.
        // We run it from the project root to ensure it finds the config.
        const { stdout, stderr } = await execAsync(`npx eslint ${filePath}`, { cwd: process.cwd() });
        if (stderr) {
            return `ESLint found issues:\n${stderr}\n${stdout}`;
        }
        return `Successfully linted ${filePath}. No issues found.`
    } catch (error: any) {
        // ESLint exits with a non-zero code if linting errors are found.
        // The output is still useful.
        return `ESLint failed or found errors:\n${error.stdout || error.stderr || error.message}`;
    }
};