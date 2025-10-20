// Export all validation schemas and types
export * from './schemas';

// Validation utility functions
export const validateData = <T>(schema: any, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
  }
  return result.data;
};

export const validatePartialData = <T>(schema: any, data: unknown): Partial<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
  }
  return result.data;
};
