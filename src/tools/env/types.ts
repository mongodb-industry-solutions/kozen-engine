export interface IEnvOptions {
    flow?: string;
    prefix?: string;
    logger?: Console;
}

export interface IShellVariables {
    key: string;
    value: string;
}

export interface IEnv {
    /**
     * Logger service instance for recording service operations and errors.
     */
    logger?: Console | null;

    /**
     * Expose a set of variables globally for inter-process communication.
     * @param content - An object containing key-value pairs to be exposed as environment variables.
     * @param opts - Options for prefix and flow.
     */
    expose(content: Record<string, any>, opts?: IEnvOptions): Promise<void>;

    /**
     * Load environment variables from `.env` file.
     */
    load(): void;
}
