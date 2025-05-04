import { Injectable } from '@nestjs/common';
import { ParsedRowDto } from './dto/parsed-row.dto';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

@Injectable()
export class ValidationService {
  private config = {
    allowSpacesInId: false, // Set to true if you want to allow spaces
    allowNegativeIds: false, // Set to true if you want to allow negative IDs
    standardizeDateFormat: true, // Convert all dates to standard format
    acceptableDateFormats: ['DD.MM.YYYY', 'DD/MM/YYYY', 'DD-MM-YYYY'],
    outputDateFormat: 'DD.MM.YYYY',
    minDate: '1900-01-01',
    maxDate: dayjs().format('YYYY-MM-DD'), // Today
  };

  private validateId(rawId: any): {
    isValid: boolean;
    error?: string;
    value?: number;
  } {
    const idStr = String(rawId).trim();

    if (!idStr) {
      return { isValid: false, error: 'ID cannot be empty' };
    }

    if (!this.config.allowSpacesInId && idStr.includes(' ')) {
      return { isValid: false, error: 'ID cannot contain spaces' };
    }

    const cleanId = idStr.replace(/\s/g, '');

    const numericId = Number(cleanId);

    if (isNaN(numericId)) {
      return { isValid: false, error: 'ID must be a valid number' };
    }

    if (!Number.isInteger(numericId)) {
      return { isValid: false, error: 'ID must be an integer' };
    }

    if (!this.config.allowNegativeIds && numericId < 0) {
      return { isValid: false, error: 'ID cannot be negative' };
    }

    if (numericId === 0) {
      return { isValid: false, error: 'ID cannot be zero' };
    }

    return { isValid: true, value: numericId };
  }

  private validateDate(rawDate: any): {
    isValid: boolean;
    error?: string;
    value?: Date;
  } {
    if (rawDate === null || rawDate === undefined) {
      return { isValid: false, error: 'Date cannot be empty' };
    }

    let dateStr: string;

    if (rawDate instanceof Date) {
      dateStr = dayjs(rawDate).format(this.config.outputDateFormat);
    } else if (typeof rawDate === 'string') {
      dateStr = rawDate.trim();
    } else if (typeof rawDate === 'object' && rawDate?.text) {
      dateStr = String(rawDate.text).trim();
    } else if (typeof rawDate === 'number') {
      try {
        const excelEpoch = dayjs('1899-12-30');
        const converted = excelEpoch.add(rawDate, 'day');
        if (converted.isValid()) {
          dateStr = converted.format(this.config.outputDateFormat);
        } else {
          return { isValid: false, error: 'Invalid Excel date value' };
        }
      } catch (error) {
        return { isValid: false, error: 'Failed to process Excel date' };
      }
    } else {
      dateStr = String(rawDate).trim();
    }

    if (!dateStr) {
      return { isValid: false, error: 'Date is empty after processing' };
    }

    let parsedDate: dayjs.Dayjs | null = null;

    for (const format of this.config.acceptableDateFormats) {
      const attemptedParse = dayjs(dateStr, format, true);
      if (attemptedParse.isValid()) {
        parsedDate = attemptedParse;
        break;
      }
    }
    if (!parsedDate || !parsedDate.isValid()) {
      const parts = dateStr.split(/[-./]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (month < 1 || month > 12) {
          return {
            isValid: false,
            error: `Invalid month '${month}' in date '${dateStr}'`,
          };
        }

        if (day === 29 && month === 2) {
          const isLeapYear =
            (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
          if (!isLeapYear) {
            return {
              isValid: false,
              error: `Invalid day 29 for February in a non-leap year (${year})`,
            };
          }
        }
      }

      return {
        isValid: false,
        error: `Invalid date format '${dateStr}'. Date must be in one of these formats: ${this.config.acceptableDateFormats.join(', ')}`,
      };
    }

    if (parsedDate.isAfter(dayjs())) {
      return { isValid: false, error: 'Date cannot be in the future' };
    }

    if (parsedDate.isBefore(dayjs(this.config.minDate))) {
      return {
        isValid: false,
        error: `Date cannot be before ${this.config.minDate}`,
      };
    }

    return {
      isValid: true,
      value: parsedDate.toDate(),
    };
  }

  validateRow(raw: { id: any; name: any; date: any }): {
    isValid: boolean;
    errors: string[];
    parsedRow?: ParsedRowDto;
  } {
    const errors: string[] = [];
    const parsedRow = new ParsedRowDto();

    const idResult = this.validateId(raw.id);
    if (!idResult.isValid) {
      errors.push(idResult.error);
    } else {
      parsedRow.id = idResult.value;
    }

    const name = String(raw.name ?? '').trim();
    if (!name) {
      errors.push('Name cannot be empty');
    } else {
      parsedRow.name = name;
    }

    const dateResult = this.validateDate(raw.date);
    if (!dateResult.isValid) {
      errors.push(dateResult.error);
    } else {
      parsedRow.date = dateResult.value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      parsedRow: errors.length === 0 ? parsedRow : undefined,
    };
  }
}
