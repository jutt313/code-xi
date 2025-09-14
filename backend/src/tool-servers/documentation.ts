import fs from 'fs/promises';
import path from 'path';

export const getProjectStructure = async (dir: string = '.', level = 0): Promise<string> => {
    const ignore = ['node_modules', '.git', '.env'];
    const files = await fs.readdir(dir);
    let structure = '';
    for (const file of files) {
        if (ignore.includes(file)) continue;
        const fullPath = path.join(dir, file);
        const stats = await fs.stat(fullPath);
        structure += `${ '  '.repeat(level) }- ${file}\n`;
        if (stats.isDirectory()) {
            structure += await getProjectStructure(fullPath, level + 1);
        }
    }
    return structure;
};
