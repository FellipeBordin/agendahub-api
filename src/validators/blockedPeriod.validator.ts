export type BlockedPeriodInput = {
  startAt: unknown;
  endAt: unknown;
  allDay?: unknown;
  reason?: unknown;
};

export function validateBlockedPeriod(data: BlockedPeriodInput) {
  const { startAt, endAt, allDay, reason } = data;

  if (typeof startAt !== "string" || startAt.trim() === "") {
    return { error: "O horário inicial do bloqueio é obrigatório." };
  }

  if (typeof endAt !== "string" || endAt.trim() === "") {
    return { error: "O horário final do bloqueio é obrigatório." };
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (Number.isNaN(startDate.getTime())) {
    return { error: "O horário inicial do bloqueio é inválido." };
  }

  if (Number.isNaN(endDate.getTime())) {
    return { error: "O horário final do bloqueio é inválido." };
  }

  if (endDate <= startDate) {
    return { error: "O horário final deve ser posterior ao horário inicial." };
  }

  if (allDay !== undefined && typeof allDay !== "boolean") {
    return { error: "O campo allDay deve ser verdadeiro ou falso." };
  }

  if (reason !== undefined && typeof reason !== "string") {
    return { error: "O motivo do bloqueio deve ser um texto." };
  }

  let normalizedStartAt = startDate;
  let normalizedEndAt = endDate;

  if (allDay === true) {
    const datePart = startAt.slice(0, 10);

    normalizedStartAt = new Date(`${datePart}T00:00:00-03:00`);

    const nextDay = new Date(`${datePart}T12:00:00-03:00`);
    nextDay.setDate(nextDay.getDate() + 1);

    const nextDatePart = [
      nextDay.getFullYear(),
      String(nextDay.getMonth() + 1).padStart(2, "0"),
      String(nextDay.getDate()).padStart(2, "0"),
    ].join("-");

    normalizedEndAt = new Date(`${nextDatePart}T00:00:00-03:00`);
  }

  return {
    data: {
      startAt: normalizedStartAt.toISOString(),
      endAt: normalizedEndAt.toISOString(),
      allDay: allDay ?? false,
      reason:
        typeof reason === "string" ? reason.trim() || undefined : undefined,
    },
  };
}
