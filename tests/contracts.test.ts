import { test } from "node:test";
import assert from "node:assert/strict";
import {
  failurePhase,
  SosBody,
  sosPayload,
  supportedRole,
  validateSos,
} from "../src/lib/contracts";
const valid: SosBody = {
  name: "Resident",
  contact: "09123456789",
  location: "Known landmark",
  latitude: 10.109,
  longitude: 124.562,
  type: "Injury",
  category: "Medical",
  priority: "High",
  description: "Need medical help.",
};
test("mobile accepts exact backend roles and rejects admin / invented aliases", () => {
  assert.ok(supportedRole("residents"));
  assert.ok(supportedRole("campmanager"));
  for (const role of ["admin", "resident", "camp_manager", null])
    assert.equal(supportedRole(role), false);
});
test("SOS field whitelist never sends caller-controlled status or local metadata", () => {
  const result = sosPayload({
    ...valid,
    status: "Resolved",
    localId: "test",
  } as SosBody);
  assert.equal("status" in result, false);
  assert.equal("localId" in result, false);
  assert.deepEqual(
    Object.keys(result).sort(),
    [
      "name",
      "contact",
      "location",
      "latitude",
      "longitude",
      "type",
      "category",
      "priority",
      "description",
    ].sort(),
  );
});
test("GPS range, non-finite coordinates and required details are validated", () => {
  assert.equal(validateSos(valid), null);
  for (const latitude of [NaN, Infinity, -91, 91])
    assert.ok(validateSos({ ...valid, latitude }));
  assert.ok(validateSos({ ...valid, longitude: 181 }));
  assert.ok(validateSos({ ...valid, contact: " " }));
  assert.ok(validateSos({ ...valid, description: "x".repeat(2001) }));
});
test("timeouts and server failures remain uncertain; only known rejection is pending", () => {
  for (const status of [undefined, 400, 401, 403, 408, 500, 502, 504])
    assert.equal(failurePhase(status), "uncertain");
  assert.equal(failurePhase(422), "pending");
  assert.equal(failurePhase(429), "pending");
});
