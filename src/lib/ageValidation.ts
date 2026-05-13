// Grade level → [minAge, maxAge]
const GRADE_AGE_RULES: Record<number, [number, number]> = {
  1: [6, 7],
  2: [7, 8],
  3: [8, 9],
  4: [9, 10],
  5: [10, 11],
  6: [11, 12],
  7: [12, 13],
};

export const getAgeFromDOB = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const validateStudentAge = (
  dob: string,
  gradeLevel: number
): { valid: boolean; message: string } => {
  const age = getAgeFromDOB(dob);
  const rule = GRADE_AGE_RULES[gradeLevel];

  if (!rule) return { valid: true, message: "" };

  const [min, max] = rule;
  if (age < min) return {
    valid: false,
    message: `Student must be at least ${min} years old for Grade ${gradeLevel}`,
  };
  if (age > max + 2) return { // +2 tolerance for repeaters
    valid: false,
    message: `Student seems too old for Grade ${gradeLevel} (max ~${max + 2} years)`,
  };
  return { valid: true, message: "" };
};

// Max DOB = today (no future dates)
export const getMaxDOB = (): string =>
  new Date().toISOString().split('T')[0];

// Min DOB based on grade (must be old enough)
export const getMinDOB = (gradeLevel: number): string => {
  const rule = GRADE_AGE_RULES[gradeLevel];
  if (!rule) return "";
  const minAge = rule[0];
  const d = new Date();
  d.setFullYear(d.getFullYear() - (minAge + 3)); // buffer for older students
  return d.toISOString().split('T')[0];
};