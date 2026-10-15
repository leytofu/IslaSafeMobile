import { test } from "node:test";
import assert from "node:assert/strict";
import { ageFromBirthDate, ageGroup } from "../src/lib/demographics";
test("demographic boundary ages match evacuation classifications", () => {
  for (const [age, group] of [[0,"Infant"],[2,"Infant"],[3,"Child"],[12,"Child"],[13,"Teenager"],[17,"Teenager"],[18,"Adult"],[59,"Adult"],[60,"Senior citizen"],[125,"Senior citizen"]] as const) assert.equal(ageGroup(age), group);
  for (const age of [null, -1, NaN, Infinity]) assert.equal(ageGroup(age), "Unknown age");
});
test("birthdays determine the age on the registration date", () => {
  const today = new Date(2026, 9, 14);
  assert.equal(ageFromBirthDate("2008-10-14", today), 18);
  assert.equal(ageFromBirthDate("2008-10-15", today), 17);
  assert.equal(ageFromBirthDate("2026-10-14", today), 0);
});
test("invalid, future and non-leap birthdays remain unknown", () => {
  const today = new Date(2026, 9, 14);
  for (const value of ["", "2025-02-29", "2026-10-15", "2000-13-01", "2000-04-31", "14/10/2000"]) assert.equal(ageFromBirthDate(value, today), null);
  assert.equal(ageFromBirthDate("2024-02-29", today), 2);
});
