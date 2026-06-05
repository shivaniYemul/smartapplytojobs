export interface PwChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

export function checkPassword(pw: string): PwChecks {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function pwScore(c: PwChecks) {
  return Object.values(c).filter(Boolean).length;
}

export function pwValid(c: PwChecks) {
  return pwScore(c) === 5;
}
