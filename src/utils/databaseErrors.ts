export function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error;
  const visited = new Set<object>();

  while (typeof current === "object" && current !== null) {
    if (visited.has(current)) {
      return false;
    }

    visited.add(current);

    if ("code" in current && current.code === "23505") {
      return true;
    }

    if ("sqlState" in current && current.sqlState === "23505") {
      return true;
    }

    current = "cause" in current ? current.cause : undefined;
  }

  return false;
}
