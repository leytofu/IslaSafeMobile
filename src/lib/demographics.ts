export function ageGroup(age: number | null) {
  if (age === null || !Number.isFinite(age) || age < 0) return "Unknown age";
  return age <= 2 ? "Infant" : age <= 12 ? "Child" : age <= 17 ? "Teenager" : age <= 59 ? "Adult" : "Senior citizen";
}
export function ageFromBirthDate(value: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > today) return null;
  return today.getFullYear() - year - Number(today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day));
}
