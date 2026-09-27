/** Shared with public.party_phone_key in the database migration. */
export function phoneKey(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  // US/Canadian numbers match with or without the +1 country code.
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export const emailKey = (email: string) => email.trim().toLowerCase();

export class DuplicateContactError extends Error {
  constructor() {
    super("That phone number or email is already registered. Sign in with your existing details instead.");
  }
}

export class SignInRateLimitError extends Error {
  constructor() { super("Too many sign-in attempts. Please wait 15 minutes and try again."); }
}
