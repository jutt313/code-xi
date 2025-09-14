export class ToolExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class FileNotFoundError extends ToolExecutionError {
  constructor(filePath: string) {
    super(`File not found at path: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

export class DirectoryCreationError extends ToolExecutionError {
  constructor(dirPath: string) {
    super(`Failed to create directory at path: ${dirPath}`);
    this.name = 'DirectoryCreationError';
  }
}

export class CommandExecutionError extends ToolExecutionError {
    constructor(message: string) {
        super(message);
        this.name = 'CommandExecutionError';
    }
}
