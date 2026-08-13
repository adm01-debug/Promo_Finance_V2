import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { 
  AsaasWebhookSchema, 
  BlingWebhookSchema, 
  Bitrix24WebhookSchema,
  AsaasProxySchema,
  AnalyzeDocumentSchema,
  validatePayload 
} from "../_shared/validation.ts";


Deno.test("Contract Test: Asaas Webhook Schema", () => {
  // Valid payload
  const validPayload = {
    event: "PAYMENT_RECEIVED",
    payment: {
      id: "pay_12345",
      status: "RECEIVED"
    }
  };
  const result = validatePayload(AsaasWebhookSchema, validPayload);
  assertEquals(result.success, true);

  // Invalid payload (missing event)
  const invalidPayload = {
    payment: {
      id: "pay_12345"
    }
  };
  const resultInvalid = validatePayload(AsaasWebhookSchema, invalidPayload);
  assertEquals(resultInvalid.success, false);
});

Deno.test("Contract Test: Bling Webhook Schema", () => {
  // Valid payload
  const validPayload = {
    event: "situacao:alterada",
    module: "Pedido de Venda",
    data: {
      id: "123456",
      situacao: { id: 6 }
    }
  };
  const result = validatePayload(BlingWebhookSchema, validPayload);
  assertEquals(result.success, true);

  // Invalid payload (wrong data type)
  const invalidPayload = {
    event: "situacao:alterada",
    data: "should be an object"
  };
  const resultInvalid = validatePayload(BlingWebhookSchema, invalidPayload);
  assertEquals(resultInvalid.success, false);
});

Deno.test("Contract Test: Bitrix24 Webhook Schema", () => {
  // Valid payload
  const validPayload = {
    event: "ONCRMDEALADD",
    data: {
      FIELDS: {
        ID: "123",
        TITLE: "New Deal"
      }
    }
  };
  const result = validatePayload(Bitrix24WebhookSchema, validPayload);
  assertEquals(result.success, true);

  // Invalid payload (missing FIELDS)
  const invalidPayload = {
    event: "ONCRMDEALADD",
    data: {}
  };
  const resultInvalid = validatePayload(Bitrix24WebhookSchema, invalidPayload);
  assertEquals(resultInvalid.success, false);
});

Deno.test("Contract Test: Asaas Proxy Schema", () => {
  // Valid payload
  const validPayload = {
    action: "criar_cliente",
    data: { nome: "John Doe", cpf_cnpj: "12345678901" }
  };
  const result = validatePayload(AsaasProxySchema, validPayload);
  assertEquals(result.success, true);

  // Invalid payload (missing action)
  const invalidPayload = {
    data: { nome: "John Doe" }
  };
  const resultInvalid = validatePayload(AsaasProxySchema, invalidPayload);
  assertEquals(resultInvalid.success, false);
});

Deno.test("Contract Test: Analyze Document Schema", () => {
  // Valid payload
  const validPayload = {
    fileName: "invoice.pdf",
    fileType: "application/pdf",
    fileContent: "SGVsbG8="
  };
  const result = validatePayload(AnalyzeDocumentSchema, validPayload);
  assertEquals(result.success, true);

  // Invalid payload (missing fileContent)
  const invalidPayload = {
    fileName: "invoice.pdf",
    fileType: "application/pdf"
  };
  const resultInvalid = validatePayload(AnalyzeDocumentSchema, invalidPayload);
  assertEquals(resultInvalid.success, false);
});

