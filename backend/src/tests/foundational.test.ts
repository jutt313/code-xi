import {
    writeFile,
    readFile,
    listDirectory,
    executeCommand
} from '../tool-servers/foundational';
import {
    FileNotFoundError,
    CommandExecutionError
} from '../lib/errors';
import fs from 'fs/promises';
import path from 'path';

describe('Foundational Tools', () => {
    const testFilePath = path.join(__dirname, 'test-file.txt');
    const nonExistentPath = path.join(__dirname, 'non-existent-file.txt');

    afterEach(async () => {
        try {
            await fs.unlink(testFilePath);
        } catch (error) {
            // Ignore errors if the file doesn't exist
        }
    });

    it('should write and read a file successfully', async () => {
        const testContent = 'Hello, World!';

        // Write the file
        const writeResult = await writeFile(testFilePath, testContent);
        expect(writeResult).toBe(`Successfully wrote to ${testFilePath}`);

        // Read the file
        const readResult = await readFile(testFilePath);
        expect(readResult).toBe(testContent);
    });

    it('readFile should throw FileNotFoundError for non-existent files', async () => {
        await expect(readFile(nonExistentPath)).rejects.toThrow(FileNotFoundError);
    });

    it('listDirectory should throw FileNotFoundError for non-existent directories', async () => {
        await expect(listDirectory(nonExistentPath)).rejects.toThrow(FileNotFoundError);
    });

    it('executeCommand should throw CommandExecutionError for invalid commands', async () => {
        // Using a command that is highly unlikely to exist
        const invalidCommand = 'this-is-not-a-real-command-xyz';
        await expect(executeCommand(invalidCommand)).rejects.toThrow(CommandExecutionError);
    });
});