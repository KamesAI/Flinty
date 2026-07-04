import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Adresse email requise")
  .email("Adresse email invalide");

const passwordSchema = z.string().min(8, "8 caractères minimum");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  name: z.string().min(1, "Votre nom est requis"),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;

export interface FormValidationResult<T> {
  success: boolean;
  errors: Partial<Record<keyof T, string>>;
}

function toValidationResult<T>(result: z.ZodSafeParseResult<T>): FormValidationResult<T> {
  if (result.success) return { success: true, errors: {} };
  const errors: Partial<Record<keyof T, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof T | undefined;
    if (field !== undefined && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}

export function validateLoginForm(values: LoginFormValues): FormValidationResult<LoginFormValues> {
  return toValidationResult(loginSchema.safeParse(values));
}

export function validateSignupForm(values: SignupFormValues): FormValidationResult<SignupFormValues> {
  return toValidationResult(signupSchema.safeParse(values));
}
