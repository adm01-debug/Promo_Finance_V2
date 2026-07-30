export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false;
  return true;
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  if (cleanPhone.length === 11) return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  return phone;
}
