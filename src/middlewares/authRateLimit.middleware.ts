import { rateLimit } from "express-rate-limit";

// Instâncias separadas: cadastro não consome a cota de login e vice-versa.
// A chave padrão da biblioteca usa o IP, com tratamento de sub-redes IPv6.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  identifier: "auth-login",
  statusCode: 429,
  skipSuccessfulRequests: false,
  message: {
    error: "Muitas tentativas de login. Aguarde e tente novamente mais tarde.",
  },
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  identifier: "auth-register",
  statusCode: 429,
  skipSuccessfulRequests: false,
  message: {
    error:
      "Muitas tentativas de cadastro. Aguarde e tente novamente mais tarde.",
  },
});
