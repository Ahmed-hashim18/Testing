import { useState, useCallback } from "react";
import { z } from "zod";
import { validateData, validateField, ValidationResult } from "@/lib/validation";

export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData?: Partial<T>
) => {
  const [data, setData] = useState<Partial<T>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = useCallback((): ValidationResult<T> => {
    setIsValidating(true);
    const result = validateData(schema, data);
    
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else {
      setErrors({});
    }
    
    setIsValidating(false);
    return result;
  }, [schema, data]);

  const validateSingleField = useCallback((fieldName: keyof T, value: any) => {
    const error = validateField(schema, fieldName as string, value);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName as string] = [error];
      } else {
        delete newErrors[fieldName as string];
      }
      return newErrors;
    });

    return error;
  }, [schema]);

  const handleChange = useCallback((fieldName: keyof T, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    
    // Validate field if it has been touched
    if (touched[fieldName as string]) {
      validateSingleField(fieldName, value);
    }
  }, [touched, validateSingleField]);

  const handleBlur = useCallback((fieldName: keyof T) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateSingleField(fieldName, data[fieldName]);
  }, [data, validateSingleField]);

  const resetForm = useCallback((newData?: Partial<T>) => {
    setData(newData || initialData || {});
    setErrors({});
    setTouched({});
  }, [initialData]);

  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    handleChange(fieldName, value);
  }, [handleChange]);

  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: [error] }));
  }, []);

  const clearFieldError = useCallback((fieldName: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName as string];
      return newErrors;
    });
  }, []);

  const getFieldError = useCallback((fieldName: keyof T): string | undefined => {
    return errors[fieldName as string]?.[0];
  }, [errors]);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    data,
    errors,
    touched,
    isValidating,
    hasErrors,
    handleChange,
    handleBlur,
    validateForm,
    validateSingleField,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    getFieldError,
    setData,
  };
};
