'use strict';

/**
 * Valida cédula ecuatoriana (10 dígitos) usando el algoritmo del módulo 10.
 */
function validateCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;

  const province = parseInt(cedula.substring(0, 2), 10);
  if (province < 1 || (province > 24 && province !== 30)) return false;

  const thirdDigit = parseInt(cedula[2], 10);
  if (thirdDigit >= 6) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = parseInt(cedula[i], 10) * coefficients[i];
    if (product >= 10) product -= 9;
    sum += product;
  }

  const verifier = (10 - (sum % 10)) % 10;
  return verifier === parseInt(cedula[9], 10);
}

/**
 * Valida RUC ecuatoriano (13 dígitos).
 * - Persona natural (3er dígito 0–5): primeros 10 deben ser cédula válida + "001"
 * - Entidad pública  (3er dígito = 6): módulo 11 sobre 8 coeficientes + "0001"
 * - Persona jurídica (3er dígito = 9): módulo 11 sobre 9 coeficientes + "001"
 */
function validateRuc(ruc) {
  if (!/^\d{13}$/.test(ruc)) return false;

  const province = parseInt(ruc.substring(0, 2), 10);
  if (province < 1 || (province > 24 && province !== 30)) return false;

  const thirdDigit = parseInt(ruc[2], 10);

  if (thirdDigit < 6) {
    if (ruc.substring(10) !== '001') return false;
    return validateCedula(ruc.substring(0, 10));
  }

  if (thirdDigit === 6) {
    if (ruc.substring(9) !== '0001') return false;
    const coeff = [3, 2, 7, 6, 5, 4, 3, 2];
    const sum = coeff.reduce((acc, c, i) => acc + parseInt(ruc[i], 10) * c, 0);
    const rem = sum % 11;
    const verifier = rem === 0 ? 0 : 11 - rem;
    return verifier === parseInt(ruc[8], 10);
  }

  if (thirdDigit === 9) {
    if (ruc.substring(10) !== '001') return false;
    const coeff = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const sum = coeff.reduce((acc, c, i) => acc + parseInt(ruc[i], 10) * c, 0);
    const rem = sum % 11;
    const verifier = rem === 0 ? 0 : 11 - rem;
    return verifier === parseInt(ruc[9], 10);
  }

  return false;
}

module.exports = { validateCedula, validateRuc };
