"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSupabaseQuery<T>(
  build: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    build().then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error.message);
      else setData(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

export { supabase };
