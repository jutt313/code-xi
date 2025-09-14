import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    ToolExecutionError,
    FileNotFoundError,
    DirectoryCreationError,
    CommandExecutionError
} from '../lib/errors';

const execAsync = promisify(exec);

export const readFile = async (filePath: string): Promise<string> => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw new FileNotFoundError(filePath);
        }
        throw new ToolExecutionError(`Error reading file: ${error.message}`);
    }
};

export const writeFile = async (filePath: string, content: string): Promise<string> => {
    try {
        const dirname = path.dirname(filePath);
        await fs.mkdir(dirname, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return `Successfully wrote to ${filePath}`;
    } catch (error: any) {
        if (error.code === 'EACCES') {
            throw new DirectoryCreationError(filePath);
        }
        throw new ToolExecutionError(`Error writing to file: ${error.message}`);
    }
};

export const executeCommand = async (command: string): Promise<string> => {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            return `stdout:\n${stdout}\nstderr:\n${stderr}`;
        }
        return stdout;
    } catch (error: any) {
        throw new CommandExecutionError(`Error executing command "${command}": ${error.message}`);
    }
};

export const listDirectory = async (dirPath: string): Promise<string> => {
    try {
        const files = await fs.readdir(dirPath);
        return files.join('\n');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw new FileNotFoundError(dirPath);
        }
        throw new ToolExecutionError(`Error listing directory: ${error.message}`);
    }
};