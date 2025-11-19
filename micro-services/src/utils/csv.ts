import { parse } from 'csv-parse/sync';
import type { ImportRowError } from '../types/import.js';

export interface CsvAnalysis {
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errors: ImportRowError[];
  header: string[];
  missingColumns: string[];
}

export interface AnalyzeCsvOptions {
  requiredColumns?: string[];
  numericColumns?: string[];
  dateColumns?: string[];
  maxErrors?: number;
}

const DEFAULT_OPTIONS: Required<AnalyzeCsvOptions> = {
  requiredColumns: [],
  numericColumns: [],
  dateColumns: [],
  maxErrors: 25
};

const isISODate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const pushError = (errors: ImportRowError[], error: ImportRowError, limit: number) => {
  if (errors.length < limit) {
    errors.push(error);
  }
};

export const analyzeCsvBuffer = (buffer: Buffer, options: AnalyzeCsvOptions = {}): CsvAnalysis => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rows = parse(buffer, {
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  }) as string[][];

  if (!rows.length) {
    return { totalRows: 0, importedRows: 0, errorRows: 0, errors: [], header: [], missingColumns: [] };
  }

  const [headerRow, ...dataRows] = rows;
  const normalizedHeader = headerRow.map((col) => col?.trim?.().toLowerCase?.() ?? '');
  const header = headerRow.map((col) => col?.trim?.() ?? '');

  const headerMap = new Map<string, number>();
  normalizedHeader.forEach((value, index) => {
    if (!headerMap.has(value)) {
      headerMap.set(value, index);
    }
  });

  const missingColumns = opts.requiredColumns.filter((required) => !headerMap.has(required));

  const errors: ImportRowError[] = [];
  let errorRows = 0;

  if (missingColumns.length) {
    pushError(
      errors,
      {
        line: 1,
        reason: `Cabeçalho inválido. Colunas ausentes: ${missingColumns.join(', ')}.`,
        code: 'INVALID_HEADER',
        details: {
          missingColumns,
          expectedColumns: opts.requiredColumns,
          receivedColumns: header
        }
      },
      opts.maxErrors
    );
  }

  dataRows.forEach((row, index) => {
    const lineNumber = index + 2;
    let rowHasError = false;

    if (row.length !== header.length) {
      rowHasError = true;
      pushError(
        errors,
        {
          line: lineNumber,
          reason: 'Estrutura da linha não coincide com o cabeçalho.',
          code: 'ROW_PARSE_FAILURE',
          details: {
            expectedColumns: header.length,
            receivedColumns: row.length,
            raw_line_preview: row.join(',')
          }
        },
        opts.maxErrors
      );
    }

    opts.requiredColumns.forEach((column) => {
      const columnIndex = headerMap.get(column);
      if (columnIndex === undefined) {
        return;
      }

      const value = row[columnIndex]?.trim?.();
      if (!value) {
        rowHasError = true;
        pushError(
          errors,
          {
            line: lineNumber,
            reason: `Coluna obrigatória "${column}" vazia.`,
            code: 'MISSING_REQUIRED_FIELD',
            details: { column }
          },
          opts.maxErrors
        );
      }
    });

    opts.dateColumns.forEach((column) => {
      const columnIndex = headerMap.get(column);
      if (columnIndex === undefined) {
        return;
      }

      const value = row[columnIndex]?.trim?.();
      if (value && !isISODate(value)) {
        rowHasError = true;
        pushError(
          errors,
          {
            line: lineNumber,
            reason: `Formato de data inválido em "${column}".`,
            code: 'INVALID_DATE_FORMAT',
            details: {
              column,
              invalidValue: value,
              expectedFormat: 'YYYY-MM-DD'
            }
          },
          opts.maxErrors
        );
      }
    });

    opts.numericColumns.forEach((column) => {
      const columnIndex = headerMap.get(column);
      if (columnIndex === undefined) {
        return;
      }

      const value = row[columnIndex]?.trim?.();
      if (value && Number.isNaN(Number(value))) {
        rowHasError = true;
        pushError(
          errors,
          {
            line: lineNumber,
            reason: `Valor numérico inválido em "${column}".`,
            code: 'INVALID_NUMBER',
            details: {
              column,
              invalidValue: value
            }
          },
          opts.maxErrors
        );
      }
    });

    if (rowHasError) {
      errorRows += 1;
    }
  });

  const totalRows = dataRows.length;
  const importedRows = Math.max(totalRows - errorRows, 0);

  return {
    totalRows,
    importedRows,
    errorRows,
    errors,
    header,
    missingColumns
  };
};
