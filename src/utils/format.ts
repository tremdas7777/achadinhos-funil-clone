export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatSoldCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')}mil+`;
  return String(count);
}

export function splitPrice(value: number): { reais: string; centavos: string } {
  const [reais, centavos = '00'] = formatPrice(value).split(',');
  return { reais, centavos };
}

export function installmentPrice(total: number, installments = 12): string {
  return formatPrice(total / installments);
}

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{0,3})/, '$1-$2');
}

export function maskNumber(value: string): string {
  return value.replace(/[^\dA-Za-z/\-]/g, '').slice(0, 10);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function getInitial(name: string): string {
  return (name.trim()[0] || '?').toUpperCase();
}

export async function fetchCep(cep: string) {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return null;
  }
}
