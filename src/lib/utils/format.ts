/**
 * Formata valor monetário para o padrão brasileiro
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com R$ e pontos como separador de milhares
 * 
 * Exemplos:
 * formatCurrency(1234.56) => "R$ 1.234,56"
 * formatCurrency(1234567.89) => "R$ 1.234.567,89"
 * formatCurrency(123.45) => "R$ 123,45"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata número com separador de milhares
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com pontos como separador de milhares
 * 
 * Exemplos:
 * formatNumber(1234) => "1.234"
 * formatNumber(1234567) => "1.234.567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Formata porcentagem
 * @param value - Valor numérico a ser formatado (0-100)
 * @returns String formatada com símbolo de porcentagem
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`
}