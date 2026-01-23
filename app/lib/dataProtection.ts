// Data protection and sanitization helpers

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove script tags and other potentially dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateStringLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

export function validateNumberRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function sanitizeAndValidate(
  value: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
  } = {}
): string {
  const { minLength = 0, maxLength = 1000, allowEmpty = false } = options;

  const sanitized = sanitizeString(value);

  if (!allowEmpty && sanitized.length === 0) {
    throw new Error('השדה לא יכול להיות ריק');
  }

  if (sanitized.length < minLength) {
    throw new Error(`השדה חייב להכיל לפחות ${minLength} תווים`);
  }

  if (sanitized.length > maxLength) {
    throw new Error(`השדה לא יכול להכיל יותר מ-${maxLength} תווים`);
  }

  return sanitized;
}
