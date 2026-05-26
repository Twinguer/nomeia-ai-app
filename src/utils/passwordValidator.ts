export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

export class PasswordValidator {
  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    } else {
      score += 25;
    }

    if (password.length > 128) {
      errors.push('Senha deve ter no máximo 128 caracteres');
    }

    if (!/[A-Z]/.test(password)) errors.push('Inclua uma letra maiúscula');
    else score += 20;

    if (!/[a-z]/.test(password)) errors.push('Inclua uma letra minúscula');
    else score += 20;

    if (!/[0-9]/.test(password)) errors.push('Inclua um número');
    else score += 20;

    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Inclua um caractere especial');
    else score += 15;

    return {
      isValid: errors.length === 0,
      score: Math.min(100, score),
      errors,
      suggestions: [],
    };
  }
}
