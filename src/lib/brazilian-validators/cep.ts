export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
}

export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return cep;
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
}
