import type { Borders, Cell, Fill, Worksheet } from "exceljs";
import { AWARD_CATEGORIES, AWARD_THEME } from "@/data/awards";

/**
 * Evaluation Committee scorecard export (.xlsx).
 *
 * Mirrors the committee's paper scorecard: one row per shortlisted nominee,
 * grouped under a merged "Award Category (count)" cell, then one column per
 * evaluator (E1…En = each judge's overall 0–5 score), the average across the
 * evaluators who scored, the final mark as a percentage, and a blank column
 * for the committee's written outcome. The top three nominees in each
 * category are highlighted green / blue / pink (1st / 2nd / 3rd; ties share
 * a colour). Average and Final are live formulas, so the committee can adjust
 * an E score in Excel and see the totals update.
 */

export type ScorecardNomination = {
  id: string;
  nomineeName?: string;
  categoryId?: string;
  categoryName?: string;
};

export type ScorecardScore = {
  nominationId: string;
  judgeUid: string;
  judgeEmail: string;
  score: number;
};

/** Each judge's overall score is a weighted average on a 0–5 scale. */
const MAX_SCORE = 5;
/** Blank evaluator columns to print when nobody has scored yet, as on the paper form. */
const DEFAULT_EVALUATOR_COLUMNS = 6;

const TITLE_ROW = 1;
const HEADER_ROW = 2;

const COLORS = {
  header: "FFB4C6E7",
  categoryA: "FFFCE4D6",
  categoryB: "FFD9D9D9",
  border: "FF000000",
} as const;

/** Highlight fills for 1st, 2nd and 3rd place within a category. */
const PLACES = [
  { fill: "FF83E08D", label: "1st place in category (highest Final)" },
  { fill: "FF82CAEC", label: "2nd place in category" },
  { fill: "FFE6A0DC", label: "3rd place in category" },
] as const;

type Evaluator = { uid: string; email: string; scoredCount: number };

type ScorecardRow = {
  nomineeName: string;
  /** Indexed by evaluator; null where that judge hasn't scored this nominee. */
  scores: (number | null)[];
  average: number | null;
  final: number | null;
  /** 1-based competition rank within the category (ties share), null if unscored. */
  place: number | null;
};

type CategoryGroup = { name: string; order: number; rows: ScorecardRow[] };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Groups, scores and ranks the scorecard rows. Exported for tests. */
export function buildScorecard(nominations: ScorecardNomination[], scores: ScorecardScore[]) {
  const included = new Set(nominations.map((n) => n.id));
  const relevant = scores.filter((s) => included.has(s.nominationId) && s.score > 0);

  // Stable evaluator numbering: alphabetical by judge email.
  const byJudge = new Map<string, Evaluator>();
  for (const s of relevant) {
    const judge = byJudge.get(s.judgeUid) ?? { uid: s.judgeUid, email: s.judgeEmail || s.judgeUid, scoredCount: 0 };
    judge.scoredCount++;
    byJudge.set(s.judgeUid, judge);
  }
  const evaluators = [...byJudge.values()].sort((a, b) => a.email.localeCompare(b.email));
  const evaluatorIndex = new Map(evaluators.map((e, i) => [e.uid, i]));

  const scoresByNomination = new Map<string, (number | null)[]>();
  for (const s of relevant) {
    const row = scoresByNomination.get(s.nominationId) ?? evaluators.map(() => null);
    row[evaluatorIndex.get(s.judgeUid)!] = s.score;
    scoresByNomination.set(s.nominationId, row);
  }

  const categoryOrder = new Map(AWARD_CATEGORIES.map((c, i) => [c.id, i]));
  const groups = new Map<string, CategoryGroup>();
  for (const nom of nominations) {
    const key = nom.categoryId || nom.categoryName || "uncategorised";
    let group = groups.get(key);
    if (!group) {
      const known = AWARD_CATEGORIES.find((c) => c.id === nom.categoryId);
      group = {
        name: known?.name ?? nom.categoryName ?? "Uncategorised",
        order: categoryOrder.get(key) ?? Number.MAX_SAFE_INTEGER,
        rows: [],
      };
      groups.set(key, group);
    }
    const rowScores = scoresByNomination.get(nom.id) ?? evaluators.map(() => null);
    const given = rowScores.filter((v): v is number => v !== null);
    const average = given.length ? given.reduce((a, b) => a + b, 0) / given.length : null;
    group.rows.push({
      nomineeName: nom.nomineeName?.trim() || "(unnamed nominee)",
      scores: rowScores,
      average,
      final: average === null ? null : (average / MAX_SCORE) * 100,
      place: null,
    });
  }

  for (const group of groups.values()) {
    // Rank on the Final as displayed (2 dp) so rows that look tied share a place.
    const ranked = group.rows.filter((r) => r.final !== null).sort((a, b) => b.final! - a.final!);
    ranked.forEach((row, i) => {
      const prev = ranked[i - 1];
      row.place = prev && round2(prev.final!) === round2(row.final!) ? prev.place : i + 1;
    });
    group.rows.sort((a, b) => a.nomineeName.localeCompare(b.nomineeName));
  }

  const sortedGroups = [...groups.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return { groups: sortedGroups, evaluators };
}

const solid = (argb: string): Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

const THIN_BORDER: Partial<Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

function styleHeaderCell(cell: Cell) {
  cell.font = { bold: true };
  cell.fill = solid(COLORS.header);
  cell.border = THIN_BORDER;
  cell.alignment = { vertical: "middle", wrapText: true };
}

function writeEvaluatorsSheet(ws: Worksheet, evaluators: Evaluator[]) {
  ws.columns = [
    { header: "Code", width: 8 },
    { header: "Evaluator (judge)", width: 38 },
    { header: "Nominees scored", width: 16 },
  ];
  ws.getRow(1).eachCell(styleHeaderCell);
  if (evaluators.length === 0) {
    ws.addRow(["—", `No judge scores yet. E1–E${DEFAULT_EVALUATOR_COLUMNS} on the scorecard are left blank to fill in by hand.`, ""]);
  }
  evaluators.forEach((e, i) => ws.addRow([`E${i + 1}`, e.email, e.scoredCount]));
  ws.eachRow((row, n) => {
    if (n > 1) row.eachCell({ includeEmpty: true }, (cell) => (cell.border = THIN_BORDER));
  });
}

export async function exportScorecard(
  nominations: ScorecardNomination[],
  scores: ScorecardScore[],
): Promise<{ success: boolean; message: string; evaluatorCount: number }> {
  try {
    const { groups, evaluators } = buildScorecard(nominations, scores);
    if (groups.length === 0) {
      return { success: false, message: "There are no shortlisted nominations to put on the scorecard.", evaluatorCount: 0 };
    }

    // Loaded on demand: exceljs is large and only needed when someone exports.
    const mod = await import("exceljs");
    const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = AWARD_THEME.title;
    workbook.created = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    const evaluatorCount = evaluators.length || DEFAULT_EVALUATOR_COLUMNS;
    const firstECol = 3;
    const lastECol = firstECol + evaluatorCount - 1;
    const avgCol = lastECol + 1;
    const finalCol = lastECol + 2;
    const summaryCol = lastECol + 3;

    const ws = workbook.addWorksheet("Scorecard", {
      views: [{ state: "frozen", xSplit: 2, ySplit: HEADER_ROW }],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
      },
    });

    ws.getColumn(1).width = 40;
    ws.getColumn(2).width = 28;
    for (let c = firstECol; c <= lastECol; c++) ws.getColumn(c).width = 6;
    ws.getColumn(avgCol).width = 14;
    ws.getColumn(finalCol).width = 12;
    ws.getColumn(summaryCol).width = 50;

    // Title
    ws.mergeCells(TITLE_ROW, 1, TITLE_ROW, summaryCol);
    const title = ws.getCell(TITLE_ROW, 1);
    title.value = `${AWARD_THEME.title} — Evaluation Committee Scorecard (${new Date().getFullYear()})`;
    title.font = { bold: true, size: 14 };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(TITLE_ROW).height = 24;

    // Header
    const headers = [
      "Award Category & Award Criteria",
      "Project Name / Nominee",
      ...Array.from({ length: evaluatorCount }, (_, i) => `E${i + 1}`),
      "Average Score",
      "Final",
      "Summary of Evaluation Committee Outcome",
    ];
    const headerRow = ws.getRow(HEADER_ROW);
    headers.forEach((text, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = text;
      styleHeaderCell(cell);
    });

    // Body: one block of rows per category
    let r = HEADER_ROW + 1;
    groups.forEach((group, gi) => {
      const start = r;
      const categoryFill = solid(gi % 2 === 0 ? COLORS.categoryA : COLORS.categoryB);

      for (const row of group.rows) {
        const excelRow = ws.getRow(r);
        for (let c = 1; c <= summaryCol; c++) {
          const cell = excelRow.getCell(c);
          cell.border = THIN_BORDER;
          cell.alignment = { vertical: "middle", wrapText: c === 1 || c === 2 || c === summaryCol };
        }
        excelRow.getCell(1).fill = categoryFill;
        excelRow.getCell(2).value = row.nomineeName;

        for (let i = 0; i < evaluatorCount; i++) {
          const cell = excelRow.getCell(firstECol + i);
          cell.value = row.scores[i] ?? null;
          cell.numFmt = "0.0#";
          cell.alignment = { vertical: "middle", horizontal: "right" };
        }

        const eRange = `${ws.getColumn(firstECol).letter}${r}:${ws.getColumn(lastECol).letter}${r}`;
        const avgRef = `${ws.getColumn(avgCol).letter}${r}`;
        const avgCell = excelRow.getCell(avgCol);
        avgCell.value = { formula: `IF(COUNT(${eRange})=0,"",AVERAGE(${eRange}))`, result: row.average ?? undefined };
        avgCell.numFmt = "0.00";
        avgCell.alignment = { vertical: "middle", horizontal: "center" };

        const finalCell = excelRow.getCell(finalCol);
        finalCell.value = { formula: `IF(${avgRef}="","",${avgRef}/${MAX_SCORE}*100)`, result: row.final ?? undefined };
        finalCell.numFmt = "0.00";
        finalCell.alignment = { vertical: "middle", horizontal: "center" };

        const place = row.place !== null ? PLACES[row.place - 1] : undefined;
        if (place) {
          for (const c of [2, avgCol, finalCol]) excelRow.getCell(c).fill = solid(place.fill);
        }
        r++;
      }

      if (r - 1 > start) ws.mergeCells(start, 1, r - 1, 1);
      const categoryCell = ws.getCell(start, 1);
      categoryCell.value = `${group.name} (${group.rows.length})`;
    });

    // Key
    r++;
    PLACES.forEach((place) => {
      const swatch = ws.getCell(r, 1);
      swatch.value = place.label;
      swatch.fill = solid(place.fill);
      swatch.border = THIN_BORDER;
      r++;
    });
    ws.mergeCells(r, 1, r, summaryCol);
    const note = ws.getCell(r, 1);
    note.value =
      `E1–E${evaluatorCount}: each evaluator's overall score out of ${MAX_SCORE} (names on the Evaluators sheet). ` +
      `Average Score = mean of the evaluators who scored; Final = Average Score ÷ ${MAX_SCORE} × 100. Ties share a colour.`;
    note.alignment = { wrapText: true, vertical: "top" };
    note.font = { italic: true, size: 9 };
    ws.getRow(r).height = 28;

    writeEvaluatorsSheet(workbook.addWorksheet("Evaluators"), evaluators);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const filename = `evaluation-scorecard-${new Date().toISOString().split("T")[0]}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const nomineeCount = groups.reduce((n, g) => n + g.rows.length, 0);
    return {
      success: true,
      message: `Scorecard exported: ${nomineeCount} nominee(s) across ${groups.length} categor${groups.length === 1 ? "y" : "ies"}.`,
      evaluatorCount: evaluators.length,
    };
  } catch (error) {
    console.error("Scorecard export failed:", error);
    return {
      success: false,
      message: `Scorecard export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      evaluatorCount: 0,
    };
  }
}
