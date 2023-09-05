import { FormInstance } from 'antd';
import { useCallback, useState } from 'react';

type ExtractFormShape<T> = T extends FormInstance<infer U> ? U : never;

export function useFormCheckError<T extends FormInstance<any>>(form: T) {
  const [formHasError, setFormHasError] = useState(false);

  const triggerCheckFormError = useCallback(async () => {
    const result = {
      values: null as null | ExtractFormShape<T>,
      error: null as null | string,
    };

    try {
      result.values = await form.validateFields();
      setFormHasError(false);
    } catch (error: any) {
      setFormHasError(true);
      result.error = error?.errorFields?.[0]?.errors?.[0] || 'unknown error';
    }

    return result;
  }, [form]);

  return {
    formHasError,
    triggerCheckFormError,
  };
}
