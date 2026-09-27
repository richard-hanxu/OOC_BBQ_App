import { isCmu, type ProfileInput } from "../types";

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
  }
}

const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const opt = (v: unknown, max = 120) => {
  const s = str(v, max);
  return s ? s : null;
};

export function validateProfile(body: unknown, { partial = false } = {}): Partial<ProfileInput> & { consent?: boolean } {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: Partial<ProfileInput> & { consent?: boolean } = {};

  const has = (k: string) => !partial || b[k] !== undefined;

  if (has("firstName")) {
    out.firstName = str(b.firstName, 60);
    if (!out.firstName) throw new ValidationError("First name is required.", "firstName");
  }
  if (has("lastName")) {
    out.lastName = str(b.lastName, 60);
    if (!out.lastName) throw new ValidationError("Last name is required.", "lastName");
  }
  if (has("phone")) {
    out.phone = str(b.phone, 40);
    if (out.phone.replace(/\D/g, "").length < 7) throw new ValidationError("Enter a real phone number.", "phone");
  }
  if (has("email")) {
    out.email = str(b.email, 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new ValidationError("Enter a valid email.", "email");
  }
  if (b.undergraduateUniversity !== undefined) out.undergraduateUniversity = opt(b.undergraduateUniversity);
  if (b.graduateUniversity !== undefined) out.graduateUniversity = opt(b.graduateUniversity);
  if (b.cmuProgram !== undefined) out.cmuProgram = opt(b.cmuProgram, 240);
  if (b.contactVisibility !== undefined) {
    if (b.contactVisibility !== "guests" && b.contactVisibility !== "organizers") {
      throw new ValidationError("Choose who can see your contact info.", "contactVisibility");
    }
    out.contactVisibility = b.contactVisibility;
  }

  if (!partial) {
    if (b.consent !== true) {
      throw new ValidationError("Please confirm the contact and directory notice.", "consent");
    }
    if (!isCmu(out.undergraduateUniversity) && !isCmu(out.graduateUniversity)) out.cmuProgram = null;
  }
  return out;
}
