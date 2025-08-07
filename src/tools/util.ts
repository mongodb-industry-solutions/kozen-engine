
/**
 * Generates a unique ID with format YYYYMMDDDHHMMSSXX
 * @returns A unique identifier
 */
export function getID(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `K${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

const fs = require('fs').promises;

export async function readFrom(path: string, opts?: { format?: string, error?: { message?: string } }) {
    const { format = 'utf8', error = {} } = opts || {};
    try {
        return await fs.readFile(path, format);;
    } catch (err) {
        Object.assign(error, err);
    }
}