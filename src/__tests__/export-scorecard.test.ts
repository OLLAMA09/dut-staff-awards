/**
 * Evaluation Committee scorecard — grouping, evaluator columns and placings
 */
import { describe, it, expect } from "vitest";
import { buildScorecard, type ScorecardNomination, type ScorecardScore } from "@/lib/export-scorecard";

const nom = (id: string, nomineeName: string, categoryId: string): ScorecardNomination => ({
  id,
  nomineeName,
  categoryId,
  categoryName: categoryId,
});

const score = (nominationId: string, judge: string, value: number): ScorecardScore => ({
  nominationId,
  judgeUid: `uid-${judge}`,
  judgeEmail: `${judge}@dut.ac.za`,
  score: value,
});

describe("buildScorecard", () => {
  it("numbers evaluators alphabetically by email and places each score in its judge's column", () => {
    const { groups, evaluators } = buildScorecard(
      [nom("n1", "Thandeka", "living-values")],
      [score("n1", "zanele", 4), score("n1", "amahle", 3)],
    );
    expect(evaluators.map((e) => e.email)).toEqual(["amahle@dut.ac.za", "zanele@dut.ac.za"]);
    expect(groups[0].rows[0].scores).toEqual([3, 4]);
  });

  it("averages only the evaluators who scored and expresses Final as a percentage of 5", () => {
    const { groups } = buildScorecard(
      [nom("n1", "A", "living-values"), nom("n2", "B", "living-values")],
      [score("n1", "j1", 4), score("n1", "j2", 5), score("n2", "j1", 3)],
    );
    const [a, b] = groups[0].rows;
    expect(a.scores).toEqual([4, 5]);
    expect(a.average).toBe(4.5);
    expect(a.final).toBe(90);
    expect(b.scores).toEqual([3, null]);
    expect(b.average).toBe(3);
    expect(b.final).toBe(60);
  });

  it("orders categories as on the awards page and lists nominees alphabetically with counts", () => {
    const { groups } = buildScorecard(
      [
        nom("n1", "Zola", "rising-star"),
        nom("n2", "Bongani", "living-values"),
        nom("n3", "Ayanda", "rising-star"),
      ],
      [],
    );
    expect(groups.map((g) => g.name)).toEqual(["Living the Values Staff Award", "Rising Star Staff Award"]);
    expect(groups[1].rows.map((r) => r.nomineeName)).toEqual(["Ayanda", "Zola"]);
  });

  it("ranks within each category, gives tied Finals the same place and leaves unscored rows unplaced", () => {
    const { groups } = buildScorecard(
      [
        nom("n1", "A", "living-values"),
        nom("n2", "B", "living-values"),
        nom("n3", "C", "living-values"),
        nom("n4", "D", "living-values"),
        nom("n5", "E", "living-values"),
      ],
      [score("n1", "j1", 5), score("n2", "j1", 4), score("n3", "j1", 4), score("n4", "j1", 3)],
    );
    const places = Object.fromEntries(groups[0].rows.map((r) => [r.nomineeName, r.place]));
    // Two-way tie for 2nd means the next nominee is 4th (no 3rd place).
    expect(places).toEqual({ A: 1, B: 2, C: 2, D: 4, E: null });
  });

  it("ignores scores for nominations that are not on the scorecard and zero (unsaved) scores", () => {
    const { groups, evaluators } = buildScorecard(
      [nom("n1", "A", "living-values")],
      [score("n1", "j1", 0), score("other", "j2", 5)],
    );
    expect(evaluators).toEqual([]);
    expect(groups[0].rows[0]).toMatchObject({ scores: [], average: null, final: null, place: null });
  });
});
