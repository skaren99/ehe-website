import test from "node:test";
import assert from "node:assert/strict";
import logic from "../src/pricing.js";
import { tallinnInstant } from "../src/time.mjs";
test("preserved wedding pricing and no extra VAT", () => {
  const v = {
    event: "wedding",
    guests: 100,
    location: "local",
    package: "full",
    decor: "none",
    styling: false,
    dinner: false,
    visit: false,
    website: false,
    extraHours: 0,
    lateHours: 0,
  };
  assert.equal(logic.estimate(v).total, 2520);
  assert.equal(logic.estimate({ ...v, guests: 99 }).total, 2020);
  assert.equal(logic.estimate({ ...v, dinner: true }).total, 3320);
});
test("rentals preserve 36h use, 48h reservation and 10 percent extra day", () => {
  const p = logic.rentalPeriod("2027-06-19T07:00:00Z", 1);
  assert.equal(p.customerEnd, "2027-06-21T19:00:00.000Z");
  assert.equal(p.blockedUntil, "2027-06-22T07:00:00.000Z");
  assert.equal(logic.rentalPrice(70, 2, 1).total, 154);
});
test("pickup is Estonia local time in winter and summer", () => {
  assert.equal(
    tallinnInstant("2027-01-15", "10:00"),
    "2027-01-15T08:00:00.000Z",
  );
  assert.equal(
    tallinnInstant("2027-07-15", "10:00"),
    "2027-07-15T07:00:00.000Z",
  );
});
