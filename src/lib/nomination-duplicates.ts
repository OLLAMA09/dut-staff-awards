/**
 * Duplicate nominations: the same person nominated more than once in the same award
 * category, usually by different nominators.
 *
 * Every nomination is kept. An admin chooses the one that goes through; the others are
 * set aside with status "rejected" plus `duplicateOf` (the chosen nomination's id) and
 * `statusBeforeDuplicate`, so the choice can be undone. Judges only ever load
 * shortlisted nominations, so set-aside ones never reach them.
 */

export type DuplicateStatus = "pending" | "shortlisted" | "rejected";

export type DuplicateFields = {
  id: string;
  categoryId: string;
  nomineeEmail?: string;
  staffNumber?: string;
  status: DuplicateStatus;
  /** Set on a nomination that was set aside: the id of the nomination chosen instead */
  duplicateOf?: string;
  /** The status a set-aside nomination had before it was set aside, restored on undo */
  statusBeforeDuplicate?: DuplicateStatus;
};

const normalise = (value?: string) => (value ?? "").toLowerCase().replace(/\s+/g, "");

/**
 * Groups nominations of the same nominee in the same category. Two nominations match
 * when their nominee email or staff number is the same (ignoring case and spaces), so a
 * typo in one of those fields still links them.
 *
 * Returns a map from each nomination id to its whole group (itself included), for
 * groups of two or more. Members of a group share one array.
 */
export function groupDuplicates<T extends DuplicateFields>(nominations: T[]): Map<string, T[]> {
  // Union-find over nomination ids
  const parent = new Map<string, string>(nominations.map((n) => [n.id, n.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };

  const firstWithKey = new Map<string, string>();
  for (const n of nominations) {
    const email = normalise(n.nomineeEmail);
    const staff = normalise(n.staffNumber);
    const keys = [email && `${n.categoryId}|email|${email}`, staff && `${n.categoryId}|staff|${staff}`];
    for (const key of keys) {
      if (!key) continue;
      const other = firstWithKey.get(key);
      if (other === undefined) firstWithKey.set(key, n.id);
      else parent.set(find(n.id), find(other));
    }
  }

  const byRoot = new Map<string, T[]>();
  for (const n of nominations) {
    const root = find(n.id);
    const group = byRoot.get(root);
    if (group) group.push(n);
    else byRoot.set(root, [n]);
  }

  const byMember = new Map<string, T[]>();
  for (const group of byRoot.values()) {
    if (group.length < 2) continue;
    for (const n of group) byMember.set(n.id, group);
  }
  return byMember;
}

/** Still in the running: neither rejected nor set aside. */
export const isActive = (n: DuplicateFields) => n.status !== "rejected";

/** Set aside because another nomination of the same person was chosen to go through. */
export const isSetAside = (n: DuplicateFields) => n.status === "rejected" && !!n.duplicateOf;

/** True while two or more nominations in the group are still in the running. */
export const needsDecision = (group: DuplicateFields[]) => group.filter(isActive).length > 1;
