import type { FormikErrors } from "formik";
import type { z, ZodType } from "zod";

/**
 * Adapt a Zod schema into a Formik `validate` function.
 *
 * Important: uses `z.input<S>` (not `z.output`) so schemas that include
 * `.pipe()` / `.transform()` still type-check against Formik's
 * `initialValues` shape — Formik holds the unparsed form values, not
 * the schema's transformed output.
 *
 * - Returns Formik's `{ field: message }` shape so messages render under
 *   the right input.
 * - Walks `issue.path` so nested fields (e.g. `address.city`) get
 *   dot-joined keys, array indices in brackets (`tags[0]`).
 * - Keeps the FIRST error per path so Formik's "show one error per
 *   field" UX matches the Zod issue order.
 */
export function zodValidate<S extends ZodType>(schema: S) {
  type Values = z.input<S>;
  return (values: Values): FormikErrors<Values> => {
    const result = schema.safeParse(values);
    if (result.success) {
      return {};
    }
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path
        .map((segment) =>
          typeof segment === "number" ? `[${segment}]` : segment
        )
        .join(".")
        .replace(/\.\[/g, "[");
      if (key && !(key in errors)) {
        errors[key] = issue.message;
      }
    }
    return errors as FormikErrors<Values>;
  };
}
