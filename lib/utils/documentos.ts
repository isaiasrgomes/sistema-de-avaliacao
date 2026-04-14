function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function todosDigitosIguais(valor: string) {
  return /^(\d)\1+$/.test(valor);
}

export function validarCPF(valor: string) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || todosDigitosIguais(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(cpf[10]);
}

export function validarCNPJ(valor: string) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || todosDigitosIguais(cnpj)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i += 1) soma += Number(cnpj[i]) * pesos1[i];
  let resto = soma % 11;
  const dv1 = resto < 2 ? 0 : 11 - resto;
  if (dv1 !== Number(cnpj[12])) return false;

  soma = 0;
  for (let i = 0; i < 13; i += 1) soma += Number(cnpj[i]) * pesos2[i];
  resto = soma % 11;
  const dv2 = resto < 2 ? 0 : 11 - resto;
  return dv2 === Number(cnpj[13]);
}

export function validarTelefoneBR(valor: string) {
  const telefone = somenteDigitos(valor);
  return telefone.length === 10 || telefone.length === 11;
}

export function formatarTelefoneBR(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

