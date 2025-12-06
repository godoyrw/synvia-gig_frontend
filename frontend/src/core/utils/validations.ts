// --- Helpers base ---
export const sanitizeDigits = (value: string | number | null | undefined): string =>
    value ? String(value).replace(/\D+/g, '') : '';

export const onlyDigitKey = (event: KeyboardEvent): void => {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];

    if (allowedKeys.includes(event.key)) return;

    if (!/[0-9]/.test(event.key)) {
        event.preventDefault();
    }
};

// --- E-mail ---
export const validateEmail = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const emailPattern = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i;
    return emailPattern.test(String(value).trim());
};

// --- CNPJ ---
export const formatCnpj = (digits: string): string => {
    digits = sanitizeDigits(digits).slice(0, 14);

    const parts: string[] = [];
    if (digits.length) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 8));

    const branch = digits.slice(8, 12);
    const suffix = digits.slice(12, 14);

    let formatted = '';
    if (parts.length) formatted = parts[0];
    if (parts.length > 1) formatted = `${parts[0]}.${parts[1]}`;
    if (parts.length > 2) formatted = `${formatted}.${parts[2]}`;
    if (branch) formatted = `${formatted}/${branch}`;
    if (suffix) formatted = `${formatted}-${suffix}`;

    return formatted;
};

export const validateCnpj = (value: string | null | undefined): boolean => {
    if (!value) return false;

    const digits = sanitizeDigits(value);

    if (!/^\d{14}$/.test(digits)) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;

    const numbers = digits.split('').map(Number);

    const calcCheckDigit = (base: number[], factors: number[]): number => {
        const sum = base.reduce((acc, digit, index) => acc + digit * factors[index], 0);
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    const factors1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const factors2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const d1 = calcCheckDigit(numbers.slice(0, 12), factors1);
    if (numbers[12] !== d1) return false;

    const d2 = calcCheckDigit(numbers.slice(0, 13), factors2);
    return numbers[13] === d2;
};

// --- Telefone ---
export const formatPhone = (digits: string): string => {
    digits = sanitizeDigits(digits).slice(0, 13);

    if (!digits.length) return '';

    const country = digits.slice(0, 2);
    const area = digits.slice(2, 4);
    const local = digits.slice(4);

    let formatted = `+${country}`;

    if (area) {
        formatted += ` (${area})`;
    }

    if (local.length) {
        const left = local.length > 5 ? local.slice(0, 5) : local;
        const right = local.length > 5 ? local.slice(5, 9) : '';
        formatted += ` ${right ? `${left}-${right}` : left}`;
    }

    return formatted.trim().replace(/\s+/g, ' ');
};

export const validatePhone = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const digits = sanitizeDigits(value);
    return digits.length >= 12 && digits.length <= 13;
};
