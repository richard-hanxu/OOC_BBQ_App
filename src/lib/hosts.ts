export interface HostProfile {
  firstName: string;
  fullName: string | null;
  major: string | null;
  photoSrc: string | null;
}

// Public host bios only. Fill these in with details/photos supplied by the hosts;
// do not look up or expose attendee records on the unauthenticated welcome page.
export const HOSTS = {
  richard: { firstName: "Richard", fullName: "Richard Hanxu", major: "MSML", photoSrc: null },
  andrew: { firstName: "Andrew", fullName: "Andrew Wu", major: "MSR", photoSrc: null },
} satisfies Record<string, HostProfile>;
