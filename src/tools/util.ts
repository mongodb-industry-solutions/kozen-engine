/**
 * @fileoverview Utility functions for the Kozen Engine
 * Provides common utility functions including ID generation, file operations,
 * and enum utilities used throughout the Kozen Engine pipeline system.
 * 
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */

/**
 * Generates a unique timestamped identifier with format K + YYYYMMDDHHMMSSX
 * Creates IDs suitable for project names, flow tracking, and resource identification
 * 
 * @returns {string} Unique identifier with 'K' prefix followed by timestamp and random suffix
 * @example 'K20250101120530X' where X is a random 2-digit number
 * 
 * @example
 * ```typescript
 * const projectId = getID();
 * console.log(projectId); // Output: K20250101120530X
 * ```
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

/**
 * Reads content from a file with error handling and configurable encoding
 * Provides a safe way to read files with automatic error capture for debugging
 * 
 * @param {string} path - File system path to read from
 * @param {Object} [opts] - Optional configuration for file reading
 * @param {string} [opts.format='utf8'] - File encoding format (utf8, ascii, base64, etc.)
 * @param {Object} [opts.error] - Error object to populate if reading fails
 * @param {string} [opts.error.message] - Error message property to set on failure
 * @returns {Promise<string | undefined>} Promise resolving to file content or undefined if reading fails
 * 
 * @example
 * ```typescript
 * // Basic file reading
 * const content = await readFrom('./config.json');
 * 
 * // With error handling
 * const errorInfo = {};
 * const data = await readFrom('./data.txt', { 
 *   format: 'utf8', 
 *   error: errorInfo 
 * });
 * if (!data) {
 *   console.error('Read failed:', errorInfo);
 * }
 * ```
 */
export async function readFrom(path: string, opts?: { format?: string, error?: { message?: string } }) {
    const { format = 'utf8', error = {} } = opts || {};
    try {
        return await fs.readFile(path, format);;
    } catch (err) {
        Object.assign(error, err);
    }
}

/**
 * @class EnumUtl
 * @description Utility class for working with TypeScript enums and enum-like objects.
 * Provides methods for bidirectional enum lookups, supporting both numeric and string enums.
 * 
 * This utility is particularly useful when working with configuration files,
 * API responses, or user input that needs to be mapped to/from enum values.
 * 
 * @example
 * ```typescript
 * enum LogLevel {
 *   ERROR = 0,
 *   WARN = 1,
 *   INFO = 2,
 *   DEBUG = 3
 * }
 * 
 * // Get enum name from value
 * const levelName = EnumUtl.getNameFromValue(LogLevel, 2); // 'INFO'
 * 
 * // Get enum value from name
 * const levelValue = EnumUtl.getValueFromName(LogLevel, 'DEBUG'); // 3
 * ```
 */
export class EnumUtl {
    /**
     * Retrieves the string name (key) from a numeric enum value
     * Uses TypeScript's reverse mapping feature for efficient enum name lookup
     * 
     * @param {any} target - The enum object to search in
     * @param {number} value - The numeric value to find the name for
     * @returns {string | undefined} The enum key name or undefined if not found
     * 
     * @example
     * ```typescript
     * enum Status { PENDING = 0, ACTIVE = 1, INACTIVE = 2 }
     * const name = EnumUtl.getNameFromValue(Status, 1); // 'ACTIVE'
     * ```
     */
    static getNameFromValue(target: any, value: number): string | undefined {
        return target[value]; // Reverse mapping efficiently retrieves the name
    }

    /**
     * Retrieves the numeric value from an enum string name (key)
     * Provides type-safe lookup for converting enum names to their numeric values
     * 
     * @param {any} target - The enum object to search in
     * @param {string} name - The enum key name to find the value for
     * @returns {number | undefined} The numeric enum value or undefined if not found
     * 
     * @example
     * ```typescript
     * enum Priority { LOW = 1, MEDIUM = 5, HIGH = 10 }
     * const value = EnumUtl.getValueFromName(Priority, 'HIGH'); // 10
     * ```
     */
    static getValueFromName(target: any, name: string): number | undefined {
        return target[name as keyof typeof target]; // Type-safe lookup for numeric value
    }
}