export type ServiceInput = {
  name: unknown;
  price: unknown;
  duration: unknown;
};

export function validateService(data: ServiceInput) {
  const { name, price, duration } = data;

  if (typeof name !== "string" || name.trim() === "") {
    return {
      error: "O nome do serviço é obrigatório.",
    };
  }

  if (typeof price !== "string") {
    return {
      error: "O preço deve ser informado corretamente.",
    };
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return {
      error: "O preço deve ser maior que zero.",
    };
  }

  if (
    typeof duration !== "number" ||
    !Number.isInteger(duration) ||
    duration <= 0
  ) {
    return {
      error: "A duração deve ser um número inteiro maior que zero.",
    };
  }

  return {
    data: {
      name: name.trim(),
      price,
      duration,
    },
  };
}
