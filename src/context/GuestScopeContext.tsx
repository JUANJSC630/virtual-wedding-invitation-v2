import { createContext, useContext } from "react";

import { ADMIN_BASE } from "@/services/guest-service";

/**
 * Provee el `base` de la API de invitados a los hooks/componentes de gestión.
 * - Panel cliente:  "/api/admin"                     (default)
 * - Panel master:   "/api/master/events/:id"         (por evento)
 * Las sub-rutas (/guests, /companions, /stats, /analytics) son idénticas, así
 * que el mismo GuestManager sirve para ambos con solo cambiar el base.
 */
export const GuestScopeContext = createContext<string>(ADMIN_BASE);

export const useGuestScope = () => useContext(GuestScopeContext);
