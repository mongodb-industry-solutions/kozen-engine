/**
 * @fileoverview AWS Secret Manager Service - AWS Secrets Manager Implementation
 * @description AWS-specific implementation of the secret management bridge for AWS Secrets Manager integration
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 */
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { ISecretManagerOptions } from "../models/Secret";
import SecretManager from "./SecretManager";

/**
 * @class SecretManagerAWS
 * @extends SecretManager
 * @description AWS Secrets Manager implementation with authentication and JSON parsing support
 */
export class SecretManagerAWS extends SecretManager {

    /**
     * Resolves a secret value from AWS Secrets Manager
     * @public
     * @param {string} key - The name, ARN, or partial ARN of the secret to retrieve
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the parsed secret value
     * @throws {Error} When secret retrieval fails
     */
    public async resolve(key: string, options?: ISecretManagerOptions): Promise<string | null | undefined | number | boolean> {
        try {
            options = options || this.options;
            const client = this.createClient(this.options);
            const command = new GetSecretValueCommand({ SecretId: key });
            const data = await client.send(command);

            if (data.SecretString) {
                return JSON.parse(data.SecretString);
            }

            throw new Error(`Secret '${key}' was found but the SecretString is empty.`);
        } catch (error) {
            console.error(`Failed to retrieve secret '${key}' from AWS Secrets Manager.`, error);
            throw error;
        }
    }

    /**
     * Creates and configures a new AWS Secrets Manager client instance
     * @private
     * @param {ISecretManagerOptions} options - Configuration options for AWS client setup
     * @returns {SecretsManagerClient} Configured AWS Secrets Manager client instance
     * @throws {Error} When AWS configuration is invalid or credentials are missing
     */
    private createClient(options: ISecretManagerOptions): SecretsManagerClient {
        const accessKeyId = options.cloud?.accessKeyId || "AWS_ACCESS_KEY_ID";
        const secretAccessKey = options.cloud?.secretAccessKey || "AWS_SECRET_ACCESS_KEY";

        return new SecretsManagerClient({
            region: options.cloud?.region || process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env[accessKeyId] || "",
                secretAccessKey: process.env[secretAccessKey] || "",
            }
        });
    }

}

export default SecretManagerAWS;