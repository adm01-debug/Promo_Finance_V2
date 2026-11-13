import { invokeEdge, EdgeFunctionError } from '@/lib/edge-function-error';

export async function invokeAsaas<T = unknown>(
  action: string,
  data: Record<string, unknown>
): Promise<T> {
  const result = await invokeEdge<T>('asaas-proxy', { action, data });
  if (result && typeof result === 'object') {
    const errors = (result as { errors?: Array<{ description: string }> }).errors;
    if (Array.isArray(errors)) {
      throw new EdgeFunctionError({
        functionName: 'asaas-proxy',
        status: 400,
        code: 'ASAAS_VALIDATION',
        message: errors.map((e) => e.description).join(', '),
        body: { details: errors },
      });
    }
  }
  return result;
}
