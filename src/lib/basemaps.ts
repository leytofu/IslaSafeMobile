import type { StyleSpecification } from "@maplibre/maplibre-react-native";

// Same default OSM streets / Esri satellite providers as the admin map.
export const basemaps = {
  map: { label: "Map", tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors", license: "https://www.openstreetmap.org/copyright" },
  satellite: { label: "Satellite", tiles: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles © Esri — Esri, Maxar, Earthstar Geographics and contributors", license: "https://www.esri.com/en-us/legal/terms/data-attributions" },
};
export type BasemapKey = keyof typeof basemaps;
export function rasterStyle(key: BasemapKey): StyleSpecification {
  const source = basemaps[key];
  return {
    version: 8,
    sources: { basemap: { type: "raster", tiles: [source.tiles], tileSize: 256, maxzoom: 19, attribution: source.attribution } },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}
