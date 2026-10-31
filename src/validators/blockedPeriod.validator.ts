import { parseDateTime } from "../utils/parseDateTime";

export type BlockedPeriodInput = {
  startAt: unknown;
  endAt: unknown;
  allDay?: unknown;
  reason?: unknown;
};

// Mesmo fuso fixo usado atualmente na geração de slots.
const BUSINESS_OFFSET_MINUTES = -3 * 60;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function validateBlockedPeriod(data: BlockedPeriodInput) {
  const { startAt, endAt, allDay, reason } = data;

  if (typeof startAt !== "string" || startAt.trim() === "") {
    return {
      error: "O horário inicial do bloqueio é obrigatório.",
    };
  }

  if (typeof endAt !== "string" || endAt.trim() === "") {
    return {
      error: "O horário final do bloqueio é obrigatório.",
    };
  }

  const startDate = parseDateTime(startAt);
  const endDate = parseDateTime(endAt);

  if (!startDate) {
    return {
      error:
        "O horário inicial do bloqueio deve ser uma data válida com horário e fuso.",
    };
  }

  if (!endDate) {
    return {
      error:
        "O horário final do bloqueio deve ser uma data válida com horário e fuso.",
    };
  }

  if (endDate <= startDate) {
    return {
      error: "O horário final deve ser posterior ao horário inicial.",
    };
  }

  if (allDay !== undefined && typeof allDay !== "boolean") {
    return {
      error: "O campo allDay deve ser verdadeiro ou falso.",
    };
  }

  if (reason !== undefined && typeof reason !== "string") {
    return {
      error: "O motivo do bloqueio deve ser um texto.",
    };
  }

  let normalizedStartAt = startDate;
  let normalizedEndAt = endDate;

  if (allDay === true) {
    // Identifica o dia do negócio, mesmo quando a entrada vem em UTC.
    const localDate = new Date(
      startDate.getTime() + BUSINESS_OFFSET_MINUTES * 60 * 1000,
    );

    // Usa somente operações UTC, sem depender do fuso do computador.
    localDate.setUTCHours(0, 0, 0, 0);

    normalizedStartAt = new Date(
      localDate.getTime() - BUSINESS_OFFSET_MINUTES * 60 * 1000,
    );

    normalizedEndAt = new Date(normalizedStartAt.getTime() + ONE_DAY_MS);
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
