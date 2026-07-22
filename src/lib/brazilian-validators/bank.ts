export function validateBankAccount(bank: string, agency: string, account: string): boolean {
  const cleanBank = bank.replace(/\D/g, '');
  const cleanAgency = agency.replace(/\D/g, '');
  const cleanAccount = account.replace(/\D/g, '');
  if (cleanBank.length !== 3) return false;
  if (cleanAgency.length < 4 || cleanAgency.length > 5) return false;
  if (cleanAccount.length < 5 || cleanAccount.length > 12) return false;
  return true;
}
