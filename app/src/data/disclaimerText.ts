// Mirrors docs/disclaimer-text.md. If you change the meaning of this text,
// update that file too and bump DISCLAIMER_VERSION in
// repositories/consentRepository.ts so existing users are asked to re-consent.

export const DISCLAIMER_TITLE = "Before we begin";

export const DISCLAIMER_INTRO =
  "Ashwalker is a wellness companion, not a medical provider. Please read this before we start.";

export const DISCLAIMER_POINTS: { lead: string; rest: string }[] = [
  {
    lead: "This is general wellness support, not medical advice.",
    rest: "The suggestions you'll hear here — around nutrition, lifestyle, and emotional wellbeing — are general in nature. They are not a diagnosis, a treatment plan, or a substitute for care from a licensed doctor, dietitian, or therapist.",
  },
  {
    lead: "For anything specific to your health, please see a professional.",
    rest: "If you're dealing with a diagnosed condition, concerning symptoms, or anything that feels urgent, this app will encourage you to bring it to a qualified professional rather than try to resolve it here.",
  },
  {
    lead: "Your information stays on your device.",
    rest: "What you share here — your goals, your answers, your conversation — is stored locally on your phone. It isn't sent anywhere except to generate the coach's replies in the moment.",
  },
  {
    lead: "You're always in control.",
    rest: "You can stop, skip a question, or come back later. Nothing here is a commitment beyond what feels right for you.",
  },
];

export const DISCLAIMER_FOOTER =
  "By continuing, you understand this is general wellness support, not medical advice, and that you'll seek a licensed professional for anything diagnostic or symptom-specific.";
