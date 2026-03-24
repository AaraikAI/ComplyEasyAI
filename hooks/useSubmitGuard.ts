import { useState, useCallback } from 'react';

/**
 * Hook to prevent double-submission of forms.
 * Wraps an async handler to disable re-invocation while the previous call is in flight.
 *
 * Usage:
 *   const { isSubmitting, guard } = useSubmitGuard();
 *   const handleSave = () => guard(async () => { await api.save(data); });
 *   <button disabled={isSubmitting} onClick={handleSave}>Save</button>
 */
export function useSubmitGuard() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guard = useCallback(<T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (isSubmitting) return Promise.resolve(undefined);
    setIsSubmitting(true);
    return fn().finally(() => setIsSubmitting(false));
  }, [isSubmitting]);

  return { isSubmitting, guard };
}

export default useSubmitGuard;
