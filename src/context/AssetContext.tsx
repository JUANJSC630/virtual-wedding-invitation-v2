import { createContext, useContext } from "react";

import { AssetMap } from "@/types";

// Fallback chain: event assets → these public defaults
export const DEFAULT_ASSETS: Required<AssetMap> = {
  background:   "/fondo.png",
  cornerFlower: "/flor-esquina.png",
  bouquet:      "/ramo.png",
  sideBouquet:  "/ramo-lateral.png",
  flowers:      "/flores.png",
  tornPaper:    "/hoja-rasgada.png",
  church:       "/iglesia.png",
  glasses:      "/copas.png",
  dinner:       "/cena.png",
  reception:    "/mesa.png",
  waltz:        "/vals.png",
  decorLine:    "/linea.png",
  gift:         "/regalo.png",
  envelope:     "/sobre.png",
};

export const AssetContext = createContext<Required<AssetMap>>(DEFAULT_ASSETS);

export const useAssets = () => useContext(AssetContext);
