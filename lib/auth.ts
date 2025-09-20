import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const HASH_ALGORITHM = "sha256";
const HASH_DELIMITER = "$";
const HASH_ITERATIONS = 310_000;
const HASH_KEY_LENGTH = 64; // bytes

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM).toString("hex");
  return [HASH_ALGORITHM, HASH_ITERATIONS, salt, derived].join(HASH_DELIMITER);
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split(HASH_DELIMITER);
  if (parts.length !== 4) {
    return false;
  }

  const [algorithm, iterationValue, salt, storedKey] = parts;

  if (algorithm !== HASH_ALGORITHM) {
    return false;
  }

  const iterations = Number.parseInt(iterationValue, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const derived = pbkdf2Sync(password, salt, iterations, storedKey.length / 2, algorithm).toString("hex");
  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedBuffer = Buffer.from(derived, "hex");

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedBuffer);
}
