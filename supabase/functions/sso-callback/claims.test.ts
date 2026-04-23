import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  resolveClaim,
  resolveClaimArray,
  normalizeTelefone,
  mergeProfileSafely,
  AVATAR_DEFAULTS,
  TELEFONE_DEFAULTS,
} from "./claims.ts";

// ============================================================================
// resolveClaim — defaults OIDC (picture, phone_number)
// ============================================================================

Deno.test("OIDC: extrai picture como avatar_url quando claim padrão presente", () => {
  const claims = { sub: "1", email: "u@x.com", picture: "https://cdn.x/u.png" };
  const v = resolveClaim([claims], {}, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, "https://cdn.x/u.png");
});

Deno.test("OIDC: extrai phone_number como telefone quando claim padrão presente", () => {
  const claims = { sub: "1", phone_number: "+5511988887777" };
  const v = resolveClaim([claims], {}, "telefone", TELEFONE_DEFAULTS);
  assertEquals(v, "+5511988887777");
});

Deno.test("OIDC: avatar_url vazio retorna null (não sobrescreve valor existente)", () => {
  const claims = { picture: "" };
  const v = resolveClaim([claims], {}, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, null);
});

Deno.test("OIDC: phone_number só com espaços retorna null", () => {
  const claims = { phone_number: "   " };
  const v = resolveClaim([claims], {}, "telefone", TELEFONE_DEFAULTS);
  assertEquals(v, null);
});

Deno.test("OIDC: claim ausente retorna null", () => {
  const v = resolveClaim([{ sub: "1" }], {}, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, null);
});

// ============================================================================
// resolveClaim — claim_mapping customizado (photoUrl, phoneNumber)
// ============================================================================

Deno.test("Mapping custom: photoUrl mapeado para avatar_url", () => {
  const claims = { photoUrl: "https://idp/avatar.jpg" };
  const v = resolveClaim([claims], { avatar_url: "photoUrl" }, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, "https://idp/avatar.jpg");
});

Deno.test("Mapping custom: phoneNumber mapeado para telefone", () => {
  const claims = { phoneNumber: "5511999998888" };
  const v = resolveClaim([claims], { telefone: "phoneNumber" }, "telefone", TELEFONE_DEFAULTS);
  assertEquals(v, "5511999998888");
});

Deno.test("Mapping custom: array de fallbacks usa o primeiro não-vazio", () => {
  const claims = { picture: "", photoUrl: "https://ok/a.png" };
  const v = resolveClaim(
    [claims],
    { avatar_url: ["picture", "photoUrl"] },
    "avatar_url",
    AVATAR_DEFAULTS,
  );
  assertEquals(v, "https://ok/a.png");
});

Deno.test("Mapping custom: caminho aninhado profile.photo.url", () => {
  const claims = { profile: { photo: { url: "https://nested/p.png" } } };
  const v = resolveClaim(
    [claims],
    { avatar_url: "profile.photo.url" },
    "avatar_url",
    AVATAR_DEFAULTS,
  );
  assertEquals(v, "https://nested/p.png");
});

Deno.test("Mapping custom: caminho aninhado vazio cai para defaults", () => {
  const claims = { profile: { photo: { url: "" } }, picture: "https://fb/d.png" };
  const v = resolveClaim(
    [claims],
    { avatar_url: "profile.photo.url" },
    "avatar_url",
    AVATAR_DEFAULTS,
  );
  assertEquals(v, "https://fb/d.png");
});

// ============================================================================
// SAML: claims tipicamente vivem em user_metadata / app_metadata
// ============================================================================

Deno.test("SAML: extrai avatar de user_metadata.picture", () => {
  const userMeta = { picture: "https://saml/u.png" };
  const appMeta = {};
  const v = resolveClaim([userMeta, appMeta], {}, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, "https://saml/u.png");
});

Deno.test("SAML: extrai telefone de app_metadata.mobile via mapping", () => {
  const userMeta = {};
  const appMeta = { mobile: "11988887777" };
  const v = resolveClaim(
    [userMeta, appMeta],
    { telefone: ["mobile", "phone_number"] },
    "telefone",
    TELEFONE_DEFAULTS,
  );
  assertEquals(v, "11988887777");
});

Deno.test("SAML: prioriza user_metadata sobre app_metadata quando ambos têm valor", () => {
  const userMeta = { picture: "https://primary.png" };
  const appMeta = { picture: "https://secondary.png" };
  const v = resolveClaim([userMeta, appMeta], {}, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, "https://primary.png");
});

Deno.test("SAML: user_metadata vazio cai para app_metadata", () => {
  const userMeta = { picture: "" };
  const appMeta = { picture: "https://app.png" };
  const v = resolveClaim([userMeta, appMeta], {}, "avatar_url", AVATAR_DEFAULTS);
  assertEquals(v, "https://app.png");
});

// ============================================================================
// resolveClaimArray (groups)
// ============================================================================

Deno.test("groups: lê array padrão", () => {
  const claims = { groups: ["admin", "fin"] };
  assertEquals(resolveClaimArray([claims], {}, "groups", ["groups"]), ["admin", "fin"]);
});

Deno.test("groups: ausente retorna []", () => {
  assertEquals(resolveClaimArray([{}], {}, "groups", ["groups"]), []);
});

Deno.test("groups: mapping custom roles -> groups", () => {
  const claims = { roles: ["editor"] };
  assertEquals(
    resolveClaimArray([claims], { groups: "roles" }, "groups", ["groups"]),
    ["editor"],
  );
});

// ============================================================================
// normalizeTelefone
// ============================================================================

Deno.test("normalizeTelefone: remove parênteses, espaços e traços", () => {
  assertEquals(normalizeTelefone("(11) 98888-7777"), "11988887777");
});

Deno.test("normalizeTelefone: preserva o + inicial (E.164)", () => {
  assertEquals(normalizeTelefone("+55 (11) 98888-7777"), "+5511988887777");
});

Deno.test("normalizeTelefone: string vazia retorna null", () => {
  assertEquals(normalizeTelefone(""), null);
  assertEquals(normalizeTelefone("   "), null);
});

Deno.test("normalizeTelefone: apenas caracteres inválidos retorna null", () => {
  assertEquals(normalizeTelefone("---()"), null);
});

Deno.test("normalizeTelefone: null/undefined retornam null", () => {
  assertEquals(normalizeTelefone(null), null);
  assertEquals(normalizeTelefone(undefined), null);
});

// ============================================================================
// mergeProfileSafely — GARANTIA: nunca sobrescrever com vazio
// ============================================================================

Deno.test("merge: avatar vazio NÃO sobrescreve avatar existente", () => {
  const result = mergeProfileSafely(
    { avatar_url: "https://existing.png", telefone: "11988887777", full_name: "Maria" },
    { avatar_url: "", telefone: "11988887777", full_name: "Maria" },
  );
  assertEquals(result.avatar_url, "https://existing.png");
});

Deno.test("merge: telefone vazio NÃO sobrescreve telefone existente", () => {
  const result = mergeProfileSafely(
    { avatar_url: "https://a.png", telefone: "11988887777", full_name: "Maria" },
    { avatar_url: "https://a.png", telefone: "", full_name: "Maria" },
  );
  assertEquals(result.telefone, "11988887777");
});

Deno.test("merge: telefone null (claim ausente) NÃO sobrescreve existente", () => {
  const result = mergeProfileSafely(
    { telefone: "11988887777" },
    { telefone: null },
  );
  assertEquals(result.telefone, "11988887777");
});

Deno.test("merge: avatar novo válido SOBRESCREVE existente", () => {
  const result = mergeProfileSafely(
    { avatar_url: "https://old.png" },
    { avatar_url: "https://new.png" },
  );
  assertEquals(result.avatar_url, "https://new.png");
});

Deno.test("merge: telefone novo é normalizado antes de salvar", () => {
  const result = mergeProfileSafely(
    { telefone: null },
    { telefone: "(11) 98888-7777" },
  );
  assertEquals(result.telefone, "11988887777");
});

Deno.test("merge: full_name vazio NÃO sobrescreve full_name existente", () => {
  const result = mergeProfileSafely(
    { full_name: "Maria Silva" },
    { full_name: "   " },
  );
  assertEquals(result.full_name, "Maria Silva");
});

Deno.test("merge: campos sem valor anterior nem novo permanecem null", () => {
  const result = mergeProfileSafely({}, {});
  assertEquals(result, { full_name: null, avatar_url: null, telefone: null });
});

// ============================================================================
// Cenários compostos (regressão): IdP envia payload parcial
// ============================================================================

Deno.test("Regressão: IdP omite picture e phone_number — perfil não é zerado", () => {
  // Simula segunda autenticação onde o IdP esqueceu de enviar avatar/phone
  const claims = { sub: "1", email: "u@x.com", name: "Usuario X" };
  const cm = {};
  const incoming = {
    full_name: resolveClaim([claims], cm, "full_name", ["name", "full_name"]),
    avatar_url: resolveClaim([claims], cm, "avatar_url", AVATAR_DEFAULTS),
    telefone: resolveClaim([claims], cm, "telefone", TELEFONE_DEFAULTS),
  };
  const merged = mergeProfileSafely(
    { full_name: "Usuario X", avatar_url: "https://prev.png", telefone: "11988887777" },
    incoming,
  );
  assertEquals(merged.avatar_url, "https://prev.png");
  assertEquals(merged.telefone, "11988887777");
  assertEquals(merged.full_name, "Usuario X");
});

Deno.test("Regressão: IdP envia picture vazio explicitamente — perfil mantém avatar atual", () => {
  const claims = { picture: "", phone_number: "" };
  const incoming = {
    avatar_url: resolveClaim([claims], {}, "avatar_url", AVATAR_DEFAULTS),
    telefone: resolveClaim([claims], {}, "telefone", TELEFONE_DEFAULTS),
  };
  const merged = mergeProfileSafely(
    { avatar_url: "https://kept.png", telefone: "11988887777" },
    incoming,
  );
  assertEquals(merged.avatar_url, "https://kept.png");
  assertEquals(merged.telefone, "11988887777");
});
