export const MIN_PASSWORD_LENGTH = 12;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function getPasswordLengthError(): string {
  return `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens bevatten`;
}
