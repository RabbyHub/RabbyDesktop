import { FormInstance } from 'antd';
import { useCallback, useState } from 'react';

type ExtractFormShape<T> = T extends FormInstance<infer U> ? U : never;

export function useFormCheckError<T extends FormInstance<any>>(form: T) {
  const [formErrorCount, setFormErrorCount] = useState(0);

  const triggerCheckFormError = useCallback(async () => {
    const result = {
      values: null as null | ExtractFormShape<T>,
      error: null as null | string,
    };

    try {
      result.values = await form.validateFields();
      setFormErrorCount(0);
    } catch (error: any) {
      setFormErrorCount(
        error?.errorFields?.reduce((acc: number, cur: any) => {
          return acc + (cur.errors?.length || 0);
        }, 0)
      );
      result.error = error?.errorFields?.[0]?.errors?.[0] || 'unknown error';
    }

    return result;
  }, [form]);

  return {
    formErrorCount,
    formHasError: !!formErrorCount,
    triggerCheckFormError,
  };
}
