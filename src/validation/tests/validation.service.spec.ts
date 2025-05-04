import { ParsedRowDto } from '../dto/parsed-row.dto';
import { ValidationService } from '../validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validateRow', () => {
    it('should validate a correct row', () => {
      const input = {
        id: '123',
        name: 'John Doe',
        date: '01.01.2020',
      };

      const result = service.validateRow(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.parsedRow).toBeInstanceOf(ParsedRowDto);
      expect(result.parsedRow?.id).toBe(123);
      expect(result.parsedRow?.name).toBe('John Doe');
      expect(result.parsedRow?.date).toBeInstanceOf(Date);
    });

    it('should return errors for empty ID, name, and date', () => {
      const input = {
        id: '',
        name: '',
        date: '',
      };

      const result = service.validateRow(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID cannot be empty');
      expect(result.errors).toContain('Name cannot be empty');
      expect(
        result.errors.some((err) => err.toLowerCase().includes('date')),
      ).toBe(true);
    });

    it('should reject non-integer ID', () => {
      const input = {
        id: '12.5',
        name: 'Test',
        date: '02.02.2020',
      };

      const result = service.validateRow(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID must be an integer');
    });

    it('should reject invalid date format', () => {
      const input = {
        id: '1',
        name: 'Name',
        date: '2020-31-12',
      };

      const result = service.validateRow(input);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/invalid/i);
    });

    it('should reject future dates', () => {
      const futureDate = '31.12.3000';
      const input = {
        id: '10',
        name: 'Future',
        date: futureDate,
      };

      const result = service.validateRow(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date cannot be in the future');
    });

    it('should reject zero ID', () => {
      const input = {
        id: '0',
        name: 'Zero',
        date: '01.01.2020',
      };

      const result = service.validateRow(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID cannot be zero');
    });
  });
});
