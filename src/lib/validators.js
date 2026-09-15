/**
 * USN Format regex enforcing:
 * - Literal 1DB
 * - Admission year: 23, 24, or 25
 * - Branch code: CS, IS, AD, CI, EC, EE
 * - Roll number: 001 - 999
 * NOTE: The (23|24|25) year range is fest-specific and will need updating in future years.
 */
export const USN_REGEX = /^1DB(23|24|25)(CS|IS|AD|CI|EC|EE)(00[1-9]|0[1-9]\d|[1-9]\d{2})$/i;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;

/** Validate USN format */
export function isValidUSN(usn) {
  if (!usn || typeof usn !== 'string') return false;
  return USN_REGEX.test(usn.trim());
}

/**
 * Maps department IDs (as used in lockedDepartment.id) to the
 * branch code embedded in the USN (e.g. 1DB23CS001 → "CS").
 */
export const DEPT_USN_CODE = {
  aiml: 'CI',
  aids: 'AD',
  cse:  'CS',
  ise:  'IS',
  ece:  'EC',
  eee:  'EE',
};

/**
 * Returns true only if the USN is valid format AND the embedded branch
 * code matches the required department code for deptId.
 * Unknown deptId returns true (don't block; shouldn't happen for locked-dept events).
 */
export function isUSNEligibleForDept(usn, deptId) {
  if (!isValidUSN(usn)) return false;
  const requiredCode = DEPT_USN_CODE[deptId];
  if (!requiredCode) return true;
  const match = usn.trim().toUpperCase().match(/^1DB\d{2}([A-Z]{2})\d{3}$/);
  return !!(match && match[1] === requiredCode);
}

/** Validate Email format */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/** Validate 10-digit Mobile Phone */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

/** Check team size bounds */
export function isTeamSizeValid(size, min = 1, max = 4) {
  const n = Number(size);
  if (isNaN(n)) return false;
  if (min !== null && n < min) return false;
  if (max !== null && n > max) return false;
  return true;
}

/** Check if any duplicate USNs exist in a list of USN strings */
export function findDuplicateUSN(usnList) {
  const seen = new Set();
  for (const u of usnList) {
    if (!u) continue;
    const norm = u.trim().toUpperCase();
    if (seen.has(norm)) return norm;
    seen.add(norm);
  }
  return null;
}

