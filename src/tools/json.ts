export class JSONTool {
    encode<T = any>(val: T): string {
        try {
            if (typeof val === 'string') {
                return val;
            }
            if (typeof val === 'boolean' || typeof val === 'number') {
                return String(val).trim();
            }
            return JSON.stringify(val);
        }
        catch (error) {
            return String(val).trim();
        }
    }

    decode<T = any>(val: string): T | null {
        try {
            if (typeof val === 'object') {
                return val as T;
            }
            return JSON.parse(val) as T;
        }
        catch (error) {
            return null;
        }
    }
}
