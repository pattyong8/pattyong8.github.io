/**
 * Load and compile a Handlebars template
 */
export declare function loadTemplate(templateName: string): HandlebarsTemplateDelegate;
/**
 * Render a template with data
 */
export declare function renderTemplate(templateName: string, data: Record<string, unknown>): string;
/**
 * Register Handlebars helpers
 */
export declare function registerHelpers(): void;
//# sourceMappingURL=template-loader.d.ts.map