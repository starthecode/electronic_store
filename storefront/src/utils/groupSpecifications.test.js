import assert from "node:assert/strict";
import test from "node:test";
import { groupProductSpecifications } from "./groupSpecifications.js";

test("groups product specifications by their backend specification group", () => {
  const groups = groupProductSpecifications([
    {
      id: "tv-panel",
      value: "OLED",
      specification: { name: "Panel Type", group: { id: "display", name: "Display" } },
    },
    {
      id: "tv-resolution",
      value: "4K",
      specification: { name: "Resolution", group: { id: "display", name: "Display" } },
    },
    {
      id: "router-wifi",
      value: "Wi-Fi 6",
      specification: { name: "Wi-Fi Standard", group: { id: "wireless", name: "Wireless" } },
    },
  ]);

  assert.deepEqual(
    groups.map(({ name, items }) => [name, items.map((item) => item.id)]),
    [
      ["Display", ["tv-panel", "tv-resolution"]],
      ["Wireless", ["router-wifi"]],
    ],
  );
});

test("keeps legacy specifications without a group visible", () => {
  const groups = groupProductSpecifications([
    { id: "legacy", value: "value", specification: { name: "Legacy spec" } },
  ]);

  assert.equal(groups[0].name, "Specifications");
  assert.equal(groups[0].items[0].id, "legacy");
});
