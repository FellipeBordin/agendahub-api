import { Buffer } from "node:buffer";
import { validateBusiness } from "./business.validator.js";

type RegisterBusinessInput = {
  businessName: unknown;
  slug: unknown;
  userName: unknown;
  email: unknown;
  password: unknown;
};

export function validateRegisterBusiness(
  data: RegisterBusinessInput,
) {
  const businessValidation = validateBusiness({
    name: data.businessName,
    slug: data.slug,
  });

  if ("error" in businessValidation) {
    return {
      error: businessValidation.error,
    };
  }

  if (
    typeof data.userName !== "string" ||
    data.userName.trim().length < 2
  ) {
    return {
      error: "O nome do responsável deve ter pelo menos 2 caracteres.",
    };
  }

  if (typeof data.email !== "string") {
    return {
      error: "Informe um e-mail válido.",
    };
  }

  const email = data.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email.length > 254 || !emailRegex.test(email)) {
    return {
      error: "Informe um e-mail válido.",
    };
  }

  if (
    typeof data.password !== "string" ||
    data.password.length < 8
  ) {
    return {
      error: "A senha deve ter pelo menos 8 caracteres.",
    };
  }

  if (Buffer.byteLength(data.password, "utf8") > 72) {
    return {
      error: "A senha deve ter no máximo 72 bytes.",
    };
  }

  return {
    data: {
      businessName: businessValidation.data.name,
      slug: businessValidation.data.slug,
      userName: data.userName.trim(),
      email,
      password: data.password,
    },
  };
}