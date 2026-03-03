import { createContext, useContext } from "react";

import { Guest } from "@/types";

interface GuestContextValue {
  guest: Guest | null;
  setGuest: (g: Guest) => void;
  code: string | null;
  eventSlug: string;
}

export const GuestContext = createContext<GuestContextValue | null>(null);

export function useGuestContext(): GuestContextValue {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuestContext must be used within GuestContext.Provider");
  return ctx;
}
