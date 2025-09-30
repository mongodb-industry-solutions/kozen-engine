import { MongoRoleManager } from "@mongodb-solution-assurance/iam-util";
import { IRectificationOption, IRectificationResponse } from "../models/IAMRectification";

export class IAMRectificationScram {

    async rectify(options: IRectificationOption): Promise<IRectificationResponse> {
        // Collect options to carry out the rectification process
        let uri = options.uri || options.uriEnv && process.env[options.uriEnv] || "";
        if (!uri || uri.length === 0) {
            let dbUsername = options.username || "";
            let dbPassword = options.password || "";
            let dbHost = options.host || "solutionsassurance.mongodb.com";
            let dbApp = options.app || "MyLocalApp";
            let auth = (dbUsername && dbPassword) ? `${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@` : "";
            uri = options.uri || `mongodb+srv://${auth}${dbHost}/?retryWrites=true&w=majority&appName=${dbApp}`;
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

        try {
            // Create the role manager instance
            let roleManager = new MongoRoleManager(uri);

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