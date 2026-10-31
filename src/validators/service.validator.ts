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
      error: "O preço deve ser enviado como texto, por exemplo: 60.00.",
    };
  }

  const normalizedPrice = price.trim();
  const priceRegex = /^\d+(?:\.\d{1,2})?$/;

  if (!priceRegex.test(normalizedPrice)) {
    return {
      error:
        "O preço deve conter somente números e até duas casas decimais, usando ponto.",
    };
  }

  // Verifica se existe algum dígito diferente de zero.
  if (!/[1-9]/.test(normalizedPrice)) {
    return {
      error: "O preço deve ser maior que zero.",
    };
  }

  if (
    typeof duration !== "number" ||
    !Number.isSafeInteger(duration) ||
    duration <= 0
  ) {
    return {
      error: "A duração deve ser um número inteiro maior que zero.",
    };
  }

  // Padroniza o preço sem converter dinheiro para ponto flutuante.
  const [integerPart = "", decimalPart = ""] = normalizedPrice.split(".");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");

  return {
    data: {
      name: name.trim(),
      price: `${normalizedInteger}.${decimalPart.padEnd(2, "0")}`,
      duration,
    },
  };
}
