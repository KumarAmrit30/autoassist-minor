// Secure password hashing utilities

import bcrypt from "bcryptjs";

// Salt rounds for bcrypt (12 is a good balance of security and performance)
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with salt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    throw new Error("Failed to verify password");
  }
}

/**
 * Check if a password needs to be rehashed (if salt rounds have increased)
 */
export async function isPasswordOutdated(
  hashedPassword: string
): Promise<boolean> {
  try {
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    console.error("Error checking password rounds:", error);
    return false;
  }
}

/**
 * Generate a secure random password for testing or temporary use
 */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "@$!%*?&";

  const allChars = lowercase + uppercase + numbers + symbols;

  let password = "";

  // Ensure at least one character from each required category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to randomize the order
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-4, where 4 is strongest
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Password should be at least 8 characters long");
  }

  if (password.length >= 12) {
    score += 1;
  } else if (password.length >= 8) {
    feedback.push("Consider using 12+ characters for better security");
  }

  // Check character types
  if (/[a-z]/.test(password)) {
    score += 0.25;
  } else {
    feedback.push("Add lowercase letters");
  }

  if (/[A-Z]/.test(password)) {
    score += 0.25;
  } else {
    feedback.push("Add uppercase letters");
  }

  if (/\d/.test(password)) {
    score += 0.25;
  } else {
    feedback.push("Add numbers");
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 0.25;
  } else {
    feedback.push("Add special characters (@$!%*?&)");
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push("Avoid repeating characters");
  }

  if (/12345|abcde|qwerty/i.test(password)) {
    score -= 1;
    feedback.push("Avoid common patterns");
  }

  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, score));

  return {
    isValid: score >= 2,
    score: Math.round(score),
    feedback,
  };
}
