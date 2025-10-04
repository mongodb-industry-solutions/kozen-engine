export type ITplVars = Record<string, string | null | undefined>;
export type ITplResolver = (variables: ITplVars) => string;

export class Tpl {
    /**
     * Resolves a template string using provided variables. If a variable is not found, the placeholder remains unchanged.
     * @param template - The string template (e.g., "{path}/{target}").
     * @param variables - An object containing the variables to inject into the template.
     * @returns The resolved string with variables replaced.
     *
     * @example
     * const tpl = new Tpl();
     * const result = tpl.resolveByRegExp("{path}/{target}", { path: "home/user", target: "myProject" });
     * console.log(result); // "home/user/myProject"
     *
     * @example
     * const result = tpl.resolveByRegExp("{path}/{missingKey}", { path: "home/user" });
     * console.log(result); // "home/user/{missingKey}"
     */
    resolveByRegExp(template: string, variables: ITplVars): string {
        return template.replace(/{(.*?)}/g, (_, key) => {
            return variables?.[key] ?? key; // Keep placeholder unchanged if variable is not found or is null/undefined.
        });
    }

    /**
     * Resolves a template string, allowing default values for missing variables. Default values can be specified using the syntax "{key:defaultValue}".
     * If a variable is not found, the default value will be used; if no default value is present, the placeholder remains unchanged.
     *
     * @param template - Template string (e.g., "{path}/{target}/{defaultValue}").
     * @param variables - Object containing variables to replace in the template.
     * @returns The resolved string.
     *
     * @example
     * const tpl = new Tpl();
     * const result = tpl.resolveByDefault("{path}/{target}/{key:default}", { path: "home/user" });
     * console.log(result); // "home/user/{target}/default"
     *
     * @example
     * const result = tpl.resolveByDefault("{key:defaultValue}", {});
     * console.log(result); // "defaultValue"
     */
    resolveByDefault(template: string, variables: ITplVars): string {
        return template.replace(/{(.*?)}/g, (_, key) => {
            const [variableName, defaultValue] = key.split(":").map((k: string) => typeof k === 'string' && k.trim() || "");
            return variables?.[variableName] ?? defaultValue ?? key;
        });
    }

    /**
     * Resolves a template string using provided variables. If a variable is not found, the placeholder remains unchanged.
     * @param template - The string template (e.g., "{path}/{target}").
     * @param variables - An object containing the variables to inject into the template.
     * @returns The resolved string with variables replaced.
     *
     * @example
     * const tpl = new Tpl();
     * const result = tpl.resolve("{path}/{target}", { path: "home/user", target: "myProject" });
     * console.log(result); // "home/user/myProject"
     *
     * @example
     * const result = tpl.resolve("{path}/{missingKey}", { path: "home/user" });
     * console.log(result); // "home/user/{missingKey}"
     */
    resolve(template: string, variables: ITplVars): string {
        const resolver: ITplResolver = this.compile(template);
        return resolver(variables);
    }

    /**
     * Compiles a template string into a highly performant resolver function.
     * The returned function resolves the template using provided variables.
     * @param template - Template string (e.g., "{path}/{target}").
     * @returns A function that resolves the template using provided variables.
     *
     * @example
     * const tpl = new Tpl();
     * const resolver = tpl.compile("{path}/{target}");
     * const result = resolver({ path: "home/user", target: "myProject" });
     * console.log(result); // "home/user/myProject"
     *
     * @example
     * const resolver = tpl.compile("{missingKey}");
     * const result = resolver({});
     * console.log(result); // "{missingKey}"
     */
    compile(template: string): ITplResolver {
        const functionBody = `
            return \`${template.replace(/{(.*?)}/g, (_, key) => `\${variables?.["${key}"] ?? "${key}"}`)}\`;
        `;
        return new Function("variables", functionBody) as ITplResolver;
    }
}
