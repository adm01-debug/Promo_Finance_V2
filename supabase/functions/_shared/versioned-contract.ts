import type { ZodSchema } from "./zod.ts";
import { createValidationErrorResponse } from "./contract-response.ts";

export const CONTRACT_VERSION_HEADER = "x-contract-version";
export const SUPPORTED_CONTRACT_VERSIONS = ["v1", "v2"] as const;
export type ContractVersion = typeof SUPPORTED_CONTRACT_VERSIONS[number];

interface VersionedContractOptions<V1, V2> {
  v1: ZodSchema<V1>;
  v2: ZodSchema<V2>;
  functionName: string;
}

export type VersionedContractResult<V1, V2> =
  | { success: true; version: "v1"; data: V1; deprecated: true }
  | { success: true; version: "v2"; data: V2; deprecated: false }
  | { success: false; response: Response };

function requestedVersion(req: Request, payload: unknown): string {
  const fromHeader = req.headers.get(CONTRACT_VERSION_HEADER)?.trim()
    .toLowerCase();
  if (fromHeader) return fromHeader;
  if (typeof payload === "object" && payload !== null) {
    const fromBody =
      (payload as { contract_version?: unknown }).contract_version;
    if (typeof fromBody === "string" && fromBody.trim()) {
      return fromBody.trim().toLowerCase();
    }
  }
  return "v1";
}

function contractPayload(payload: unknown, version: string): unknown {
  if (typeof payload !== "object" || payload === null) return payload;
  const candidate = payload as { contract_version?: unknown; data?: unknown };
  return version === "v2" && candidate.data !== undefined
    ? candidate.data
    : payload;
}

export function validateVersionedContract<V1, V2>(
  req: Request,
  payload: unknown,
  options: VersionedContractOptions<V1, V2>,
): VersionedContractResult<V1, V2> {
  const version = requestedVersion(req, payload);
  if (!SUPPORTED_CONTRACT_VERSIONS.includes(version as ContractVersion)) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          code: "UNSUPPORTED_CONTRACT_VERSION",
          message: `Versão de contrato não suportada: ${version}`,
          fields: [{
            path: CONTRACT_VERSION_HEADER,
            message: "Use v1 ou v2",
            code: "invalid_enum_value",
          }],
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  const schema = version === "v2" ? options.v2 : options.v1;
  const result = schema.safeParse(contractPayload(payload, version));
  if (!result.success) {
    return {
      success: false,
      response: createValidationErrorResponse(result.error),
    };
  }

  if (version === "v2") {
    return {
      success: true,
      version,
      data: result.data as V2,
      deprecated: false,
    };
  }
  return {
    success: true,
    version: "v1",
    data: result.data as V1,
    deprecated: true,
  };
}

export function contractVersionHeaders(
  version: ContractVersion,
): Record<string, string> {
  return version === "v1"
    ? { "X-Contract-Version": version, Deprecation: "true" }
    : { "X-Contract-Version": version };
}
