"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTemplate = loadTemplate;
exports.renderTemplate = renderTemplate;
exports.registerHelpers = registerHelpers;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
// Get the templates directory path
function getTemplatesDir() {
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
function loadTemplate(templateName) {
    const templatesDir = getTemplatesDir();
    const templatePath = path.join(templatesDir, templateName);
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    return handlebars_1.default.compile(templateContent);
}
/**
 * Render a template with data
 */
function renderTemplate(templateName, data) {
    const template = loadTemplate(templateName);
    return template(data);
}
/**
 * Register Handlebars helpers
 */
function registerHelpers() {
    // Helper to check equality
    handlebars_1.default.registerHelper('eq', function (a, b) {
        return a === b;
    });
    // Helper to increment a number
    handlebars_1.default.registerHelper('inc', function (value) {
        return parseInt(value) + 1;
    });
    // Helper to add numbers
    handlebars_1.default.registerHelper('add', function (a, b) {
        return parseInt(a) + parseInt(b);
    });
    // Helper for conditional blocks
    handlebars_1.default.registerHelper('ifCond', function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });
}
// Register helpers on module load
registerHelpers();
//# sourceMappingURL=template-loader.js.map