import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Standard schemas for common entities
 */
export const CommonSchemas = {
  UUID: z.string().uuid(),
  ISO_DATE: z.string().datetime(),
  CURRENCY: z.string().regex(/^\d+(\.\d{1,2})?$/),
  BRAZIL_STATE: z.enum(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']),
};

/**
 * Validates a payload against a schema and returns a consistent error response if it fails.
 */
export async function validateContract<T>(schema: z.ZodSchema<T>, payload: unknown): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const data = await schema.parseAsync(payload);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Contract Violation",
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
              code: e.code
            })),
            timestamp: new Date().toISOString()
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      };
    }
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Internal Validation Error", timestamp: new Date().toISOString() }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    };
  }
}

/**
 * Standard response helper
 */
export function contractSuccess(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
