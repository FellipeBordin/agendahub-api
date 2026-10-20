export type AvailabilityInput = {
  dayOfWeek: unknown;
  startTime: unknown;
  endTime: unknown;
};

export function validateAvailability(data: AvailabilityInput) {
  const { dayOfWeek, startTime, endTime } = data;

  if (
    typeof dayOfWeek !== "number" ||
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    return { error: "O dia da semana deve ser um número inteiro entre 0 e 6." };
  }

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (typeof startTime !== "string" || !timeRegex.test(startTime)) {
    return { error: "O horário inicial deve estar no formato HH:mm." };
  }

  if (typeof endTime !== "string" || !timeRegex.test(endTime)) {
    return { error: "O horário final deve estar no formato HH:mm." };
  }

  if (endTime <= startTime) {
    return { error: "O horário final deve ser posterior ao horário inicial." };
  }

  return {
    data: {
      dayOfWeek,
      startTime,
      endTime,
    },
  };
}
