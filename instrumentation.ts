export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv, EnvValidationError } = await import("./lib/env");
  try {
    validateEnv(process.env);
  } catch (e) {
    if (e instanceof EnvValidationError) {
      throw new Error(`[govdoc] env validation failed: ${e.message}`);
    }
    throw e;
  }
}
