/**
 * Security utility for input sanitization and validation
 */

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: 8+ chars, 1 uppercase, 1 number, 1 special character
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Get password strength feedback
 */
export const getPasswordFeedback = (password: string): string => {
  if (!password) return '';
  if (password.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(password)) return 'Add uppercase letter';
  if (!/\d/.test(password)) return 'Add number';
  if (!/[!@#$%^&*]/.test(password)) return 'Add special character (!@#$%^&*)';
  return 'Strong password';
};

/**
 * Validate username
 */
export const isValidUsername = (username: string, minLength = 2, maxLength = 50): boolean => {
  const sanitized = sanitizeInput(username);
  return sanitized.length >= minLength && sanitized.length <= maxLength;
};

/**
 * Validate name
 */
export const isValidName = (name: string, minLength = 2, maxLength = 100): boolean => {
  const sanitized = sanitizeInput(name);
  return sanitized.length >= minLength && sanitized.length <= maxLength;
};

/**
 * Escape HTML entities for safe display
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};
