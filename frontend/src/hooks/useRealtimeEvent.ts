import { useEffect } from "react";

/**
 * Subscribes to custom window events triggered by the SignalR hub (e.g. "shakti:sessions_updated").
 */
export function useRealtimeEvent<T = unknown>(
  eventName: string,
  handler: (detail: T) => void
): void {
  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      handler(customEvent.detail);
    };

    window.addEventListener(eventName, listener);
    return () => {
      window.removeEventListener(eventName, listener);
    };
  }, [eventName, handler]);
}
