// micro-services/src/utils/csv-analyzer.ts
import { REQUIRED_COLUMNS, DATE_COLUMNS, NUMERIC_COLUMNS } from './csv-schema.js';

export interface CsvRowError {
  line: number;   // 1 = cabeçalho, 2+ = linhas de dados
  reason: string; // descrição do problema
}

export interface CsvAnalysisResult {
  totalRows: number;      // linhas de dados (sem o header)
  importedRows: number;   // totalRows - linhas com erro
  errorRows: number;      // quantidade de linhas com erro
  durationMs: number;     // tempo de análise
  errors: CsvRowError[];  // detalhes linha a linha
}

/**
 * Analisa um CSV em memória e retorna estatísticas + erros por linha.
 * Compatível com o contrato do front (ImportSummary + ImportRowError[]).
 */
export const analyzeCsvBuffer = (buffer: Buffer): CsvAnalysisResult => {
  const startedAt = Date.now();

  const text = buffer.toString('utf8');

  // Remove linhas completamente vazias
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Nenhuma linha => sem dados
  if (lines.length === 0) {
    return {
      totalRows: 0,
      importedRows: 0,
      errorRows: 0,
      durationMs: Date.now() - startedAt,
      errors: []
    };
  }

  // ===== Cabeçalho =====
  const headerLine = lines[0];
  const header = headerLine.split(',').map((h) => h.trim().toLowerCase());

  const errors: CsvRowError[] = [];

  // Valida colunas obrigatórias
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !header.includes(col.toLowerCase())
  );

  if (missingColumns.length > 0) {
    errors.push({
      line: 1,
      reason: `Cabeçalho não contém as colunas obrigatórias: ${missingColumns.join(', ')}.`
    });
  }

  // ===== Validação das linhas de dados =====
  const totalRows = lines.length - 1; // sem o cabeçalho

  // Vamos controlar erros por linha para não contar a mesma linha duas vezes
  const errorLines = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1; // +1 porque 1 é o cabeçalho
    const row = lines[i];
    const cols = row.split(',');

    // Número de colunas diferente do cabeçalho
    if (cols.length !== header.length) {
      errors.push({
        line: lineNumber,
        reason: `Número de colunas (${cols.length}) diferente do cabeçalho (${header.length}).`
      });
      errorLines.add(lineNumber);
      continue;
    }

    // Validação numérica
    for (const numCol of NUMERIC_COLUMNS) {
      const idx = header.indexOf(numCol.toLowerCase());
      if (idx >= 0) {
        const value = cols[idx].trim();
        if (value !== '' && isNaN(Number(value))) {
          errors.push({
            line: lineNumber,
            reason: `Coluna "${numCol}" deve ser numérica. Valor encontrado: "${value}".`
          });
          errorLines.add(lineNumber);
        }
      }
    }

    // Validação de datas
    for (const dateCol of DATE_COLUMNS) {
      const idx = header.indexOf(dateCol.toLowerCase());
      if (idx >= 0) {
        const value = cols[idx].trim();
        if (value && isNaN(Date.parse(value))) {
          errors.push({
            line: lineNumber,
            reason: `Coluna "${dateCol}" deve conter uma data válida. Valor encontrado: "${value}".`
          });
          errorLines.add(lineNumber);
        }
      }
    }
  }

  const errorRows = errorLines.size;
  const importedRows = Math.max(totalRows - errorRows, 0);
  const durationMs = Date.now() - startedAt;

  return {
    totalRows,
    importedRows,
    errorRows,
    durationMs,
    errors
  };
};
