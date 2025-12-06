// micro-services/src/utils/csv-schema.ts

// Os nomes aqui devem ser em minúsculo, igual ao header depois do toLowerCase().
export const REQUIRED_COLUMNS: string[] = [
  'guia',
  'item',
  'procedimento',
  'data',
  'valor_glosado'
];

// Colunas que devem ser numéricas
export const NUMERIC_COLUMNS: string[] = [
  'guia',
  'item',
  'valor_glosado'
];

// Colunas que devem ser datas válidas (ISO ou algo que o Date.parse aceite)
export const DATE_COLUMNS: string[] = [
  'data'
];
