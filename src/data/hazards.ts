import { Platform } from "react-native";
function image(name: string, preview: number) {
  return Platform.OS === "android" ? { uri: name } : preview;
}
export const hazards = [
  {
    title: "Flooding",
    source: image("flooding", require("../../assets/hazards/flooding.png")),
  },
  {
    title: "Groundshaking",
    source: image(
      "groundshaking",
      require("../../assets/hazards/groundshaking.png"),
    ),
  },
  {
    title: "Liquefaction",
    source: image(
      "liquefaction",
      require("../../assets/hazards/liquefaction.png"),
    ),
  },
  {
    title: "Sea level rise",
    source: image(
      "sea_level_rise",
      require("../../assets/hazards/sea_level_rise.png"),
    ),
  },
  {
    title: "Storm surge",
    source: image(
      "storm_surge",
      require("../../assets/hazards/storm_surge.png"),
    ),
  },
  {
    title: "Tsunami",
    source: image("tsunami", require("../../assets/hazards/tsunami.png")),
  },
] as const;
