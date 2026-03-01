import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

// Get the templates directory path
function getTemplatesDir(): string {
  // Check if running from dist or src
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'templates'),
    path.join(__dirname, '..', 'templates'),
    path.join(process.cwd(), 'templates'),
    path.join(process.cwd(), 'travel-page-tool', 'templates'),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  throw new Error('Templates directory not found');
}

/**
 * Load and compile a Handlebars template
 */
export function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
  const templatesDir = getTemplatesDir();
  const templatePath = path.join(templatesDir, templateName);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateContent);
}

/**
 * Render a template with data
 */
export function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const template = loadTemplate(templateName);
  return template(data);
}

/**
 * Register Handlebars helpers
 */
export function registerHelpers(): void {
  // Helper to check equality
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
  
  // Helper to increment a number
  Handlebars.registerHelper('inc', function(value) {
    return parseInt(value) + 1;
  });
  
  // Helper to add numbers
  Handlebars.registerHelper('add', function(a, b) {
    return parseInt(a) + parseInt(b);
  });
  
  // Helper for conditional blocks
  Handlebars.registerHelper('ifCond', function(this: unknown, v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '===':
        return (v1 === v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '!=':
        return (v1 != v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '!==':
        return (v1 !== v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '<':
        return (v1 < v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '<=':
        return (v1 <= v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '>':
        return (v1 > v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      case '>=':
        return (v1 >= v2) ? (options as Handlebars.HelperOptions).fn(this) : (options as Handlebars.HelperOptions).inverse(this);
      default:
        return (options as Handlebars.HelperOptions).inverse(this);
    }
  });
}

// Register helpers on module load
registerHelpers();
