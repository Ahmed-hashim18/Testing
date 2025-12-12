import { z, ZodError } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * Validates data against a Zod schema and returns a structured result
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return {
        success: false,
        errors,
        message: "Validation failed. Please check the form for errors.",
      };
    }

    return {
      success: false,
      message: "An unexpected validation error occurred.",
    };
  }
};

/**
 * Validates a single field against a Zod schema
 */
export const validateField = <T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): string | null => {
  try {
    // Extract the field schema
    const fieldSchema = (schema as any).shape?.[fieldName];
    if (!fieldSchema) return null;

    fieldSchema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof ZodError) {
      return error.errors[0]?.message || "Invalid value";
    }
    return "Validation error";
  }
};

/**
 * Formats Zod error messages into a user-friendly string
 */
export const formatZodError = (error: ZodError): string => {
  return error.errors.map(err => `${err.path.join(".")}: ${err.message}`).join(", ");
};

/**
 * Checks for duplicate values in an array (for duplicate detection)
 */
export const hasDuplicates = <T>(array: T[], key: keyof T): boolean => {
  const values = array.map(item => item[key]);
  return values.length !== new Set(values).size;
};

/**
 * Sanitizes string input by trimming and removing potentially dangerous characters
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and > to prevent XSS
    .substring(0, 10000); // Limit length
};

/**
 * Validates required fields are not empty
 */
export const validateRequired = (
  data: Record<string, any>,
  requiredFields: string[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  requiredFields.forEach(field => {
    const value = data[field];
    if (value === undefined || value === null || value === "") {
      errors[field] = "This field is required";
    }
  });

  return errors;
};
