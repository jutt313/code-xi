import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runNpmAudit = async (): Promise<string> => {
    console.log('Running specialized tool: runNpmAudit');
    try {
        // Running audit in the backend directory
        const { stdout } = await execAsync('cd backend && npm audit --json');
        return stdout;
    } catch (error: any) {
        // npm audit exits with a non-zero code if vulnerabilities are found.
        // The JSON report is still printed to stdout, so we parse it from the error object.
        if (error.stdout) {
            const auditResult = JSON.parse(error.stdout);
            const summary = {
                vulnerabilities: auditResult.metadata.vulnerabilities,
                dependencies: auditResult.metadata.dependencies,
            };
            return `NPM audit found vulnerabilities. Summary: ${JSON.stringify(summary, null, 2)}`;
        } else {
            console.error('Error running npm audit:', error);
            throw new Error(`Failed to run npm audit: ${error.message}`);
        }
    }
};