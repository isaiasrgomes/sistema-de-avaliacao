"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
const CHECK_INTERVAL_MS = 10_000;
const WARNING_BEFORE_TIMEOUT_MS = 60_000;

function readIdleTimeoutMs() {
  const parsedMinutes = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return DEFAULT_IDLE_TIMEOUT_MINUTES * 60_000;
  }
  return parsedMinutes * 60_000;
}

export function SessionIdleTimeout() {
  const lastActivityRef = useRef(Date.now());
  const signingOutRef = useRef(false);
  const warningShownRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    const idleTimeoutMs = readIdleTimeoutMs();

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;
    };

    const signOutNow = async () => {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      await supabase.auth.signOut();
      window.location.href = "/login?error=Sess%C3%A3o%20encerrada%20por%20inatividade.";
    };

    const logoutIfNeeded = async () => {
      if (signingOutRef.current) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !mounted) return;

      const idleTime = Date.now() - lastActivityRef.current;
      const remainingMs = idleTimeoutMs - idleTime;

      if (remainingMs <= 0) {
        await signOutNow();
        return;
      }

      if (remainingMs <= WARNING_BEFORE_TIMEOUT_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        const keepConnected = window.confirm(
          "Sua sessão expirará em menos de 1 minuto por inatividade. Deseja continuar conectado?"
        );
        if (keepConnected) {
          updateActivity();
          return;
        }
        await signOutNow();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, updateActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", updateActivity);

    const intervalId = window.setInterval(() => {
      void logoutIfNeeded();
    }, CHECK_INTERVAL_MS);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      updateActivity();
    });

    return () => {
      mounted = false;
      for (const eventName of events) {
        window.removeEventListener(eventName, updateActivity);
      }
      document.removeEventListener("visibilitychange", updateActivity);
      window.clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
