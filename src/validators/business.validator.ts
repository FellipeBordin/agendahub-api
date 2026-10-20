export type BusinessInput = {
  name: unknown;
  slug: unknown;
};

export function validateBusiness(data: BusinessInput) {
  const { name, slug } = data;

  if (typeof name !== "string" || name.trim() === "") {
    return { error: "O nome do negócio é obrigatório." };
  }

  if (typeof slug !== "string" || slug.trim() === "") {
    return { error: "O slug do negócio é obrigatório." };
  }

  const normalizedSlug = slug.trim().toLowerCase();

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!slugRegex.test(normalizedSlug)) {
    return {
      error: "O slug deve conter apenas letras minúsculas, números e hífens.",
    };
  }

  return {
    data: {
      name: name.trim(),
      slug: normalizedSlug,
    },
  };
}
