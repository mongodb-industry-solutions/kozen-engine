import { MongoRoleManager } from "@mongodb-solution-assurance/iam-util";
import { AuthOptions } from "@mongodb-solution-assurance/iam-util/dist/models/AuthOptions";
import tls from 'tls';
import { IRectificationOptionX509, IRectificationResponse } from "../models/IAMRectification";

export class IAMRectificationX509 {

    async rectify(options: IRectificationOptionX509): Promise<IRectificationResponse> {
        // Collect options to carry out the rectification process
        let uri = options.uri || options.uriEnv && process.env[options.uriEnv] || "";
        if (!uri || uri.length === 0) {
            let dbHost = options.host || "solutionsassurance.n0kts.mongodb.net";
            let dbApp = options.app || "MyLocalApp";
            uri = options.uri || `mongodb+srv://${dbHost}/?retryWrites=true&w=majority&appName=${dbApp}`;
        }

        if (!uri || uri.length === 0) {
            throw new Error("No connection string (uri) was provided");
        }

        let requiredPermissions = options.permissions || [
            "search",
            "read",
            "find",
            "insert",
            "update",
            "remove",
            "collMod",
        ];


        // Specify TLS options for MongoClient using the custom secure context
        const ops: AuthOptions = {
            tls: true,                      // Enable TLS encryption
            authMechanism: 'MONGODB-X509',  // Enable X.509 authentication,
            uri: options.uri
        };

        // Pass the custom secure context
        if (options.cert && options.key) {
            // Create a custom secure context for TLS using Node.js `tls` library
            ops.secureContext = tls.createSecureContext({
                cert: options.cert, // PEM-formatted certificate (includes private key)
                key: options.key, // Private key in PEM format
                ca: options.ca,  // CA certificate for validation (optional)
            });
        } else {

        }

        try {
            // Create the role manager instance
            let roleManager = new MongoRoleManager(ops as AuthOptions);

            // Perform the rectification acction
            const [permissions, username, roles] = await Promise.all([
                roleManager.verifyPermissions(requiredPermissions),
                roleManager.getUsername(),
                roleManager.getUserRoles()
            ]);

            if (!permissions.extra?.length && !permissions.missing?.length && !permissions.present?.length) {
                throw new Error("No roles or permissions were found for the provided connection string.");
            }

            return {
                permissions,
                username: username,
                roles: roles
            };
        } catch (error) {
            throw new Error(`Failed to perform rectification: ${(error as Error).message}`);
        }
    }
}