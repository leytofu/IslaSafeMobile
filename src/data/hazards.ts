import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
function image(name: string, preview: number) {
  // Only our custom Android build contains the expo-asset plugin's drawables.
  // Expo Go must resolve the require() asset through Metro instead.
  return Platform.OS === "android" && !isRunningInExpoGo() ? { uri: name } : preview;
}
// General reference descriptions and precautions only. The supplied maps are not
// georeferenced overlays and their currency is not verified.
export const hazards = [
  {
    title: "Flooding",
    icon: "droplet",
    category: "Water",
    tone: "accent",
    description:
      "Low-lying coastal and riverside areas can flood during heavy rain or high tide. Floodwater may hide strong currents, debris, and open drains.",
    precaution:
      "Move to higher ground early. Never wade or drive through floodwater.",
    source: image("flooding", require("../../assets/hazards/flooding.png")),
  },
  {
    title: "Groundshaking",
    icon: "activity",
    category: "Seismic",
    tone: "danger",
    description:
      "Strong shaking can damage buildings and trigger landslides or falling debris, especially on steep or built-up ground.",
    precaution:
      "Duck, cover, and hold under sturdy furniture until the shaking stops.",
    source: image(
      "groundshaking",
      require("../../assets/hazards/groundshaking.png"),
    ),
  },
  {
    title: "Liquefaction",
    icon: "layers",
    category: "Seismic",
    tone: "warning",
    description:
      "Saturated sandy ground can lose strength during an earthquake, causing the ground to shift, crack, or sink.",
    precaution:
      "Avoid reclaimed or waterlogged ground during and after strong shaking.",
    source: image(
      "liquefaction",
      require("../../assets/hazards/liquefaction.png"),
    ),
  },
  {
    title: "Sea level rise",
    icon: "trending-up",
    category: "Coastal",
    tone: "accent",
    description:
      "Long-term sea-level rise can increase coastal flooding and erosion, particularly during high tides and storms.",
    precaution:
      "Know your evacuation route and stay aware of coastal flood advisories.",
    source: image(
      "sea_level_rise",
      require("../../assets/hazards/sea_level_rise.png"),
    ),
  },
  {
    title: "Storm surge",
    icon: "wind",
    category: "Coastal",
    tone: "warning",
    description:
      "A storm surge is a rise in sea level pushed ashore by strong winds. It can rapidly flood coastal communities.",
    precaution:
      "Leave coastal areas when local authorities issue a storm surge warning.",
    source: image(
      "storm_surge",
      require("../../assets/hazards/storm_surge.png"),
    ),
  },
  {
    title: "Tsunami",
    icon: "navigation",
    category: "Coastal",
    tone: "danger",
    description:
      "A tsunami is a series of powerful waves, often triggered by undersea earthquakes, that can reach the coast within minutes.",
    precaution:
      "If the ground shakes or the sea recedes, move inland or to higher ground immediately.",
    source: image("tsunami", require("../../assets/hazards/tsunami.png")),
  },
] as const;
