import * as fs from 'fs/promises';
import * as path from 'path';

export class FileService {
    private directoryPath: string;
    private extension: string;
    private encoding: BufferEncoding | undefined;

    constructor(options: { dir: string, extension?: string, encoding?: BufferEncoding }) {
        const { dir, extension, encoding } = options;
        this.directoryPath = dir || process.env.KOZEN_DOC_PATH || '';
        this.extension = extension || '.txt';
        this.encoding = encoding || 'utf-8';
    }

    /**
     * Selects and reads a specific file by name asynchronously.
     * @param fileName - The name of the file to read.
     * @returns The textual content of the file, or throws an error if the file does not exist.
     */
    async select(fileName: string): Promise<string> {
        try {
            const filePath = path.resolve(this.directoryPath, fileName + this.extension);
            const data = await fs.readFile(filePath, this.encoding);
            return data as string;
        } catch (error) {
            return `Error reading file "${fileName}": ${(error as Error).message}`;
        }
    }

    /**
     * Reads all text files in the directory asynchronously and returns their contents one by one.
     * @returns An async generator that yields each file's textual content.
     */
    async *list(): AsyncGenerator<string> {
        try {
            const files = await fs.readdir(this.directoryPath);
            for (const file of files) {
                const filePath = path.join(this.directoryPath, file);
                const fileStats = await fs.stat(filePath);
                if (fileStats.isFile() && path.extname(filePath) === this.extension) {
                    const data = await fs.readFile(filePath, this.encoding);
                    yield data as string;
                }
            }
        } catch (error) {
            return `Error listing files: ${(error as Error).message}` as any;
        }
    }
}
