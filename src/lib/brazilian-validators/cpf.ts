/** Validates a Brazilian CPF */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleanCPF.charAt(10));
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return cpf;
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function generateCPF(): string {
  const random = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 9 }, random);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += n[i] * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  n.push(remainder);

  sum = 0;
  for (let i = 0; i < 10; i++) sum += n[i] * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  n.push(remainder);

  return formatCPF(n.join(''));
}
