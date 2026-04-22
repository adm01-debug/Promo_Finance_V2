/**
 * Helpers para gerar e validar payloads SCIM 2.0 User compatíveis
 * com o template do nosso endpoint /scim/v2/Users.
 *
 * Atributos suportados (espelham ATTR_MAPPINGS no ScimSetupGuide):
 *  - userName              (obrigatório, string não vazia, formato e-mail)
 *  - externalId            (obrigatório, string não vazia)
 *  - active                (obrigatório, boolean)
 *  - name.formatted        (opcional)
 *  - emails[work].value    (opcional, mas se presente deve ser e-mail válido)
 */

export const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User';

export interface ScimUserInput {
  userName: string;
  externalId: string;
  active: boolean;
  displayName?: string;
  workEmail?: string;
}

export interface ScimUserPayload {
  schemas: [typeof SCIM_USER_SCHEMA];
  userName: string;
  externalId: string;
  active: boolean;
  name?: { formatted: string };
  emails?: Array<{ value: string; type: 'work'; primary: true }>;
}

export interface ValidationIssue {
  field: keyof ScimUserInput | 'schema';
  level: 'error' | 'warning';
  message: string;
}

export interface BuildResult {
  payload: ScimUserPayload;
  json: string;
  issues: ValidationIssue[];
  adjustments: string[];
  isValid: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sanitiza e ajusta o input antes de validar. Retorna o input ajustado + lista de ajustes aplicados. */
function preAdjust(input: Partial<ScimUserInput>): { adjusted: ScimUserInput; adjustments: string[] } {
  const adjustments: string[] = [];

  let userName = (input.userName ?? '').trim();
  let externalId = (input.externalId ?? '').trim();
  const displayName = input.displayName?.trim();
  let workEmail = input.workEmail?.trim();
  const active = input.active ?? true;

  if (userName && userName !== input.userName) adjustments.push('userName: removidos espaços ao redor');
  if (externalId && externalId !== input.externalId) adjustments.push('externalId: removidos espaços ao redor');

  // Lowercase para userName/email (padrão SCIM e maioria dos IdPs)
  if (userName && userName !== userName.toLowerCase()) {
    userName = userName.toLowerCase();
    adjustments.push('userName: convertido para minúsculas');
  }
  if (workEmail && workEmail !== workEmail.toLowerCase()) {
    workEmail = workEmail.toLowerCase();
    adjustments.push('emails[work].value: convertido para minúsculas');
  }

  // Auto-preenchimento: se workEmail vazio mas userName parece e-mail, usar como e-mail de trabalho
  if (!workEmail && EMAIL_RE.test(userName)) {
    workEmail = userName;
    adjustments.push('emails[work].value: preenchido automaticamente a partir de userName');
  }

  // Auto-preenchimento: se externalId vazio, derivar do userName (estável o suficiente para preview)
  if (!externalId && userName) {
    externalId = userName;
    adjustments.push('externalId: preenchido automaticamente a partir de userName (substitua pelo objectId real)');
  }

  return {
    adjusted: { userName, externalId, active, displayName, workEmail },
    adjustments,
  };
}

function validate(input: ScimUserInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.userName) {
    issues.push({ field: 'userName', level: 'error', message: 'userName é obrigatório.' });
  } else if (!EMAIL_RE.test(input.userName)) {
    issues.push({
      field: 'userName',
      level: 'warning',
      message: 'userName não parece um e-mail (UPN). A maioria dos IdPs envia o UPN/e-mail aqui.',
    });
  }

  if (!input.externalId) {
    issues.push({ field: 'externalId', level: 'error', message: 'externalId é obrigatório (use objectId / user.id).' });
  }

  if (typeof input.active !== 'boolean') {
    issues.push({ field: 'active', level: 'error', message: 'active deve ser boolean (true/false).' });
  }

  if (input.workEmail && !EMAIL_RE.test(input.workEmail)) {
    issues.push({ field: 'workEmail', level: 'error', message: 'emails[work].value não é um e-mail válido.' });
  }

  return issues;
}

export function buildScimUserPayload(input: Partial<ScimUserInput>): BuildResult {
  const { adjusted, adjustments } = preAdjust(input);
  const issues = validate(adjusted);

  const payload: ScimUserPayload = {
    schemas: [SCIM_USER_SCHEMA],
    userName: adjusted.userName,
    externalId: adjusted.externalId,
    active: adjusted.active,
  };

  if (adjusted.displayName) {
    payload.name = { formatted: adjusted.displayName };
  }
  if (adjusted.workEmail) {
    payload.emails = [{ value: adjusted.workEmail, type: 'work', primary: true }];
  }

  return {
    payload,
    json: JSON.stringify(payload, null, 2),
    issues,
    adjustments,
    isValid: !issues.some((i) => i.level === 'error'),
  };
}
