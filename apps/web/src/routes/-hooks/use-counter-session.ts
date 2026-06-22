import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { prepareSyncSession, type PreparedSyncSession } from "@/lib/sync-session";
import { errorMessage, now } from "../-helpers";
import type { StartupTiming } from "../-types";

const showStartupTiming = import.meta.env.DEV;

export function useCounterSession({
  hasSessionCookie,
  onInteractiveAuthError,
}: {
  readonly hasSessionCookie: boolean;
  readonly onInteractiveAuthError: () => void;
}) {
  const existingSessionPrepareStarted = useRef(false);
  const preparedSessionRef = useRef<PreparedSyncSession | null>(null);
  const preparePromiseRef = useRef<Promise<PreparedSyncSession | null> | null>(null);
  const [preparedSession, setPreparedSession] = useState<PreparedSyncSession | null>(null);
  const [preparePending, setPreparePending] = useState(hasSessionCookie);
  const [guestAuthPending, setGuestAuthPending] = useState(false);
  const [timing, setTiming] = useState<StartupTiming>(() => ({
    startedAt: now(),
  }));

  const updateTiming = useCallback((nextTiming: Partial<StartupTiming>) => {
    if (!showStartupTiming) {
      return;
    }

    setTiming((currentTiming) => ({
      ...currentTiming,
      ...nextTiming,
    }));
  }, []);

  const prepareGuestSession = useCallback(
    (input: { readonly interactive: boolean }) => {
      if (preparedSessionRef.current) {
        return Promise.resolve(preparedSessionRef.current);
      }

      if (preparePromiseRef.current) {
        if (input.interactive) {
          setGuestAuthPending(true);
        }

        return preparePromiseRef.current;
      }

      if (input.interactive) {
        setGuestAuthPending(true);
      }
      updateTiming({ anonymousAuthStartAt: now() });

      const promise = prepareSyncSession({ createAnonymous: true })
        .then((prepared) => {
          if (!prepared) {
            throw new Error("Anonymous session was not created.");
          }

          preparedSessionRef.current = prepared;
          updateTiming({ sessionReadyAt: now() });
          setPreparedSession(prepared);

          return prepared;
        })
        .catch((error) => {
          if (input.interactive) {
            onInteractiveAuthError();
            updateTiming({ anonymousAuthFailedAt: now() });
            showAnonymousAuthErrorToast(error);
          }

          return null;
        })
        .finally(() => {
          updateTiming({ anonymousAuthEndAt: now() });
          preparePromiseRef.current = null;
          if (input.interactive) {
            setGuestAuthPending(false);
          }
        });

      preparePromiseRef.current = promise;
      return promise;
    },
    [onInteractiveAuthError, updateTiming],
  );

  useEffect(() => {
    if (!hasSessionCookie || existingSessionPrepareStarted.current) {
      return;
    }

    existingSessionPrepareStarted.current = true;
    void (async () => {
      try {
        const prepared = await prepareSyncSession({ createAnonymous: false });
        preparedSessionRef.current = prepared;
        updateTiming({ sessionReadyAt: now() });
        setPreparedSession(prepared);
      } catch (error) {
        showAnonymousAuthErrorToast(error);
      } finally {
        setPreparePending(false);
      }
    })();
  }, [hasSessionCookie, updateTiming]);

  return {
    guestAuthPending,
    prepareGuestSession,
    preparePending,
    preparedSession,
    timing,
    updateTiming,
  };
}

function showAnonymousAuthErrorToast(error: unknown) {
  const message = errorMessage(error);
  const isRateLimited = /rate.?limit|too many|429/i.test(message);

  toast.warning(isRateLimited ? "Anonymous auth rate limited" : "Anonymous auth failed", {
    description: isRateLimited
      ? "Wait a moment before creating another local guest session."
      : "Reload the page to try creating a guest session again.",
    id: "anonymous-auth-error",
  });
}
