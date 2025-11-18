import { parse } from 'csv-parse/sync';

export interface CsvRowError {
  line: number;
  reason: string;
}

export interface CsvAnalysis {
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errors: CsvRowError[];
}

export const analyzeCsvBuffer = (buffer: Buffer): CsvAnalysis => {
  const rows = parse(buffer, {
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  }) as string[][];

  if (!rows.length) {
    return { totalRows: 0, importedRows: 0, errorRows: 0, errors: [] };
  }

  const [, ...dataRows] = rows;

  const errors: CsvRowError[] = [];
  let errorRows = 0;

  dataRows.forEach((row, index) => {
    const requiredA = row[0]?.trim();
    const requiredB = row[1]?.trim();
    const lineNumber = index + 2; // +2 considera cabeçalho e índice base 0

    if (!requiredA) {
      errorRows += 1;
      if (errors.length < 25) {
        errors.push({ line: lineNumber, reason: 'Coluna 1 obrigatória em branco.' });
      }
      return;
    }

    if (!requiredB) {
      errorRows += 1;
      if (errors.length < 25) {
        errors.push({ line: lineNumber, reason: 'Coluna 2 obrigatória em branco.' });
      }
    }
  });

  const totalRows = dataRows.length;
  const importedRows = Math.max(totalRows - errorRows, 0);

  return {
    totalRows,
    importedRows,
    errorRows,
    errors
  };
};
