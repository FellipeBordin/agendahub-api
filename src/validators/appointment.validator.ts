export type AppointmentInput = {
  clientName: unknown;
  clientPhone: unknown;
  startAt: unknown;
  serviceId: unknown;
};

export function validateAppointment(data: AppointmentInput) {
  const { clientName, clientPhone, startAt, serviceId } = data;

  if (typeof clientName !== "string" || clientName.trim() === "") {
    return {
      error: "O nome do cliente é obrigatório.",
    };
  }

  if (typeof clientPhone !== "string" || clientPhone.trim() === "") {
    return {
      error: "O WhatsApp do cliente é obrigatório.",
    };
  }

  if (typeof startAt !== "string" || startAt.trim() === "") {
    return {
      error: "O horário inicial é obrigatório.",
    };
  }

  const startDate = new Date(startAt);

  if (Number.isNaN(startDate.getTime())) {
    return {
      error: "O horário inicial é inválido.",
    };
  }

  if (
    typeof serviceId !== "number" ||
    !Number.isInteger(serviceId) ||
    serviceId <= 0
  ) {
    return {
      error: "O serviço informado é inválido.",
    };
  }

  return {
    data: {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      startAt: startAt.trim(),
      serviceId,
    },
  };
}
