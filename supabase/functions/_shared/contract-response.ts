import type { ZodError, ZodIssue } from "./zod.ts";

export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";

export interface ContractFieldError {
  path: string;
  message: string;
  code: string;
}

export interface ContractValidationError {
  code: typeof VALIDATION_ERROR_CODE;
  message: string;
  fields: ContractFieldError[];
}

function isZodError(value: unknown): value is ZodError {
  return typeof value === "object" && value !== null &&
    Array.isArray((value as { issues?: unknown }).issues);
}

function normalizeIssue(issue: ZodIssue): ContractFieldError {
  return {
    path: issue.path.length > 0 ? issue.path.join(".") : "$",
    message: issue.message,
    code: issue.code,
  };
}

export function normalizeValidationFields(
  error: unknown,
): ContractFieldError[] {
  if (isZodError(error)) return error.issues.map(normalizeIssue);

  if (Array.isArray(error)) {
    return error.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const candidate = item as Partial<ContractFieldError>;
      if (!candidate.message) return [];
      return [{
        path: candidate.path ?? "$",
        message: candidate.message,
        code: candidate.code ?? "custom",
      }];
    });
  }

  return [];
}

export function createValidationErrorResponse(
  error: unknown,
  headers: Record<string, string> = {},
  message = "Payload inválido",
): Response {
  const body: ContractValidationError = {
    code: VALIDATION_ERROR_CODE,
    message,
    fields: normalizeValidationFields(error),
  };

  return new Response(JSON.stringify(body), {
    status: 422,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
