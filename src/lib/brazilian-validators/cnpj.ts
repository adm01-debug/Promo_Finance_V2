/** Validates a Brazilian CNPJ */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cleanCNPJ.charAt(13));
}

export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return cnpj;
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function generateCNPJ(): string {
  const random = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 8 }, random);
  n.push(0, 0, 0, 1);

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += n[i] * weights1[i];
  let remainder = sum % 11;
  n.push(remainder < 2 ? 0 : 11 - remainder);

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += n[i] * weights2[i];
  remainder = sum % 11;
  n.push(remainder < 2 ? 0 : 11 - remainder);

  return formatCNPJ(n.join(''));
}
