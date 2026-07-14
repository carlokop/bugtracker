import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const MIN_PASSWORD_LENGTH = 12;

export function validatePasswordLength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens bevatten`,
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordLength(password);
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
