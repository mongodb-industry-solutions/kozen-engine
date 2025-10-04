export class JSONTool {
    /**
     * Serializes a value into a JSON string.
     * @param val - The value to serialize.
     * @returns A JSON string or the primitive value as a string.
     */
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

    /**
     * Deserializes a JSON string into an object.
     * @param val - The JSON string to deserialize.
     * @returns The deserialized object or `null` if parsing fails.
     */
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

    /**
     * Cleans an object by removing non-serializable properties (symbols, functions, etc.)
     * and avoiding recursive references.
     * @param obj - The object to clean.
     * @returns A cleaned object that is JSON-serializable.
     */
    clean<T extends Record<string, any>>(obj: T): Record<string, any> {
        // To track circular references.
        const seen = new WeakSet();

        const clean = (input: any): any => {
            if (input === null || typeof input !== 'object') {
                // Primitive values are fine.
                return input;
            }

            if (seen.has(input)) {
                // Avoid circular references.
                return undefined;
            }
            seen.add(input);

            // If it's an array, clean each item.
            if (Array.isArray(input)) {
                return input.map(item => clean(item));
            }

            const result: Record<string, any> = {};
            for (const key of Object.keys(input)) {
                const value = input[key];
                if (typeof value !== 'function' && typeof value !== 'symbol') {
                    // Recursively clean properties.
                    result[key] = clean(value);
                }
            }
            return result;
        };

        return clean(obj);
    }

    /**
     * Clones an object deeply, removing non-serializable properties (symbols, functions, etc.)
     * and handling circular references gracefully.
     * @param obj - The object to clone deeply.
     * @returns A deeply cloned and cleaned object.
     */
    clone<T>(obj: T): T {
        // Track already visited objects to handle circular references.
        const seen = new WeakMap();

        const clone = (input: any): any => {
            if (input === null || typeof input !== 'object') {
                // Return primitives directly.
                return input;
            }

            if (seen.has(input)) {
                // Return cached reference for circular objects.
                return seen.get(input);
            }

            if (Array.isArray(input)) {
                // Clone arrays
                const newArray = input.map((item) => clone(item));
                seen.set(input, newArray);
                return newArray;
            }

            // Clone plain objects
            const newObject: Record<string, any> = {};
            seen.set(input, newObject);

            for (const [key, value] of Object.entries(input)) {
                if (typeof value !== 'function' && typeof value !== 'symbol') {
                    try {
                        newObject[key] = clone(value);
                    } catch {
                        // Recover gracefully if any non-serializable property causes issues
                        newObject[key] = undefined;
                    }
                }
            }

            return newObject;
        };
        return clone(obj);
    }
}
