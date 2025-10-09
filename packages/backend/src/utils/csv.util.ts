export interface CsvColumn {
  key: string;
  header?: string;
  transform?: (value: unknown, record: Record<string, unknown>) => unknown;
}

const escapeCsvValue = (rawValue: unknown): string => {
  if (rawValue === null || rawValue === undefined) {
    return '';
  }

  let value: string;

  if (rawValue instanceof Date) {
    value = rawValue.toISOString();
  } else if (typeof rawValue === 'object') {
    try {
      value = JSON.stringify(rawValue);
    } catch {
      value = String(rawValue);
    }
  } else {
    value = String(rawValue);
  }

  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

const getColumnValue = (record: Record<string, unknown>, path: string): unknown => {
  if (!path.includes('.')) {
    return record[path];
  }

  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
};

export const recordsToCsv = (records: Array<Record<string, unknown>>, columns: CsvColumn[]): string => {
  if (columns.length === 0) {
    return '';
  }

  const headerRow = columns.map((column) => escapeCsvValue(column.header ?? column.key)).join(',');

  const dataRows = records.map((record) => {
    const rowValues = columns.map((column) => {
      const value = column.transform
        ? column.transform(getColumnValue(record, column.key), record)
        : getColumnValue(record, column.key);
      return escapeCsvValue(value);
    });

    return rowValues.join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};
