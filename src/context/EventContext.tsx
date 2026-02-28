import { createContext, useContext } from "react";

import { Event } from "@/types";

interface EventContextValue {
  event: Event | null;
  loading: boolean;
}

export const EventContext = createContext<EventContextValue>({
  event: null,
  loading: true,
});

export const useEventContext = () => useContext(EventContext);
