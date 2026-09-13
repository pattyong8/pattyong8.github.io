export interface ValidationResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
}
export declare function validateTrip(projectRoot: string, manifestPath: string): ValidationResult;
export declare function printValidation(result: ValidationResult): void;
//# sourceMappingURL=validate-trip.d.ts.map