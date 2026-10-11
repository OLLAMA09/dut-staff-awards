import { describe, expect, it } from "vitest";
import {
  canKeepAll,
  canKeepAlongside,
  groupCategories,
  groupDuplicates,
  needsDecision,
  type DuplicateFields,
} from "@/lib/nomination-duplicates";

type Nom = DuplicateFields & { categoryName?: string };

const nom = (id: string, fields: Partial<Nom>): Nom => ({
  id,
  categoryId: "living-values",
  status: "pending",
  ...fields,
});

describe("groupDuplicates", () => {
  it("groups the same person across different categories", () => {
    const noms = [
      nom("a", { categoryId: "best-performing-unit", categoryName: "Best Performing Unit Award", staffNumber: "40016537" }),
      nom("b", { categoryId: "living-values", categoryName: "Living the Values Staff Award", staffNumber: "40016537" }),
      nom("c", { staffNumber: "22489497" }),
    ];
    const groups = groupDuplicates(noms);

    expect(groups.get("a")?.map((n) => n.id)).toEqual(["a", "b"]);
    expect(groups.get("b")).toBe(groups.get("a"));
    expect(groups.has("c")).toBe(false);
    expect(groupCategories(groups.get("a")!)).toEqual([
      "Best Performing Unit Award",
      "Living the Values Staff Award",
    ]);
    expect(needsDecision(groups.get("a")!)).toBe(true);
  });

  it("still groups the same person within one category", () => {
    const groups = groupDuplicates([
      nom("a", { staffNumber: "21000000" }),
      nom("b", { staffNumber: "21000000" }),
    ]);
    expect(groups.get("a")?.length).toBe(2);
    expect(groupCategories(groups.get("a")!)).toEqual(["living-values"]);
  });

  it("links nominations by email or staff number, ignoring case and spaces", () => {
    const groups = groupDuplicates([
      nom("a", { nomineeEmail: "R.Ellary@dut.ac.za", staffNumber: "111" }),
      nom("b", { nomineeEmail: "r.ellary@dut.ac.za ", staffNumber: "999" }),
      nom("c", { staffNumber: " 999" }),
    ]);
    expect(groups.get("a")?.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("no longer needs a decision once only one nomination is still in the running", () => {
    const groups = groupDuplicates([
      nom("a", { staffNumber: "1", status: "shortlisted" }),
      nom("b", { staffNumber: "1", status: "rejected", duplicateOf: "a" }),
    ]);
    expect(needsDecision(groups.get("a")!)).toBe(false);
  });
});

describe("letting nominations in different categories go through together", () => {
  const bpu = { categoryId: "best-performing-unit", staffNumber: "1" };
  const values = { categoryId: "living-values", staffNumber: "1" };

  it("offers to keep them all only when each is in a different category", () => {
    expect(canKeepAll([nom("a", bpu), nom("b", values)])).toBe(true);
    expect(canKeepAll([nom("a", values), nom("b", values)])).toBe(false);
    expect(canKeepAll([nom("a", bpu), nom("b", values), nom("c", values)])).toBe(false);
  });

  it("needs no decision once every nomination still in the running is kept", () => {
    const group = [
      nom("a", { ...bpu, keptWithDuplicates: true }),
      nom("b", { ...values, keptWithDuplicates: true }),
    ];
    expect(needsDecision(group)).toBe(false);
  });

  it("needs a new decision when another nomination arrives after keeping them", () => {
    const group = [
      nom("a", { ...bpu, keptWithDuplicates: true }),
      nom("b", { ...values, keptWithDuplicates: true }),
      nom("c", { ...bpu, categoryId: "teaching-excellence" }),
    ];
    expect(needsDecision(group)).toBe(true);
    expect(canKeepAll(group)).toBe(true);
  });

  it("can also use a set-aside nomination only when its category is free", () => {
    const chosen = nom("a", bpu);
    const otherAward = nom("b", { ...values, status: "rejected", duplicateOf: "a" });
    const sameAward = nom("c", { ...bpu, status: "rejected", duplicateOf: "a" });
    const group = [chosen, otherAward, sameAward];
    expect(canKeepAlongside(otherAward, group)).toBe(true);
    expect(canKeepAlongside(sameAward, group)).toBe(false);
    expect(canKeepAlongside(chosen, group)).toBe(false);
  });
});
