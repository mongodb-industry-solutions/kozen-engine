export interface ITimeComponents {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

/**
 * Extract time components from a timestamp string.
 * @param timestamp - The timestamp string in 'YYYYMMDDHHMM' or 'YYYYMMDDHHMMSS' format.
 * @returns An object containing the extracted time components.
 */
export function strExtract(timestamp: string): ITimeComponents {
    if (timestamp.length !== 12 && timestamp.length !== 14) {
        throw new Error("Invalid timestamp format. Expected YYYYMMDDHHMM or YYYYMMDDHHMMSS.");
    }
    // Extract components from the timestamp string
    const year: number = parseInt(timestamp.slice(0, 4), 10);       // YYYY
    const month: number = parseInt(timestamp.slice(4, 6), 10) - 1;  // MM
    const day: number = parseInt(timestamp.slice(6, 8), 10);        // DD
    const hour: number = parseInt(timestamp.slice(8, 10), 10);      // HH
    const minute: number = parseInt(timestamp.slice(10, 12), 10);   // MM
    let second: number = 0;                                         // Default seconds to 0 if not provided
    if (timestamp.length === 14) {
        second = parseInt(timestamp.slice(12, 14), 10);             // Extract SS if available
    }

    // Validate the extracted components
    const isValidYear = year >= 1900 && year <= 3000; // Example range for valid years
    const isValidMonth = month >= 1 && month <= 12;
    const isValidDay = day >= 1 && day <= 31; // Further checks can be added for months with fewer days
    const isValidHour = hour >= 0 && hour < 24;
    const isValidMinute = minute >= 0 && minute < 60;
    const isValidSecond = second >= 0 && second < 60;

    // Return true only if all components are valid
    if (!(isValidYear && isValidMonth && isValidDay && isValidHour && isValidMinute && isValidSecond)) {
        throw new Error("Invalid timestamp format.");
    }

    return { year, month, day, hour, minute, second };
}

/**
 * Convert a timestamp string or ITimeComponents to a Date object.
 * @param timestamp - The timestamp string in 'YYYYMMDDHHMM' or 'YYYYMMDDHHMMSS' format, or an ITimeComponents object.
 * @returns A Date object representing the timestamp, or null if conversion fails.
 */
export function strToDate(timestamp: string | ITimeComponents): Date | null {
    try {
        const { year, month, day, hour, minute, second } = typeof timestamp === "string" ? strExtract(timestamp) : timestamp;
        // Create and return the Date object
        return new Date(year, month, day, hour, minute, second);
    } catch (error) {
        return null
    }
}

/**
 * Convert a Date object to a timestamp string in 'YYYYMMDDHHMMSS' format.
 * @param date - The Date object to convert. If not provided, the current date and time will be used.
 * @param extra - Whether to append a random two-digit number to the timestamp. Defaults to true.
 * @returns A timestamp string representing the date and time.
 */
export function dateToStr(date?: Date | null, extra: boolean = true): string {
    const now = date || new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = extra ? Math.floor(Math.random() * 100).toString().padStart(2, '0') : '';
    return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

/**
 * Convert the current time to a compact string format 'YYYYMMDDHHMMSS'.
 * @returns A timestamp string representing the current date and time.
 */
export function timeToStr(): string {
    return new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
}