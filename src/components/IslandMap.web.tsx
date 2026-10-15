import { Unavailable } from "./ui";
import type { IslandMapProps } from "../lib/evacuationCenters";
export default function IslandMap(_props: IslandMapProps) {
  return (
    <Unavailable
      title="Native MapLibre map"
      detail="MapLibre React Native runs in the Android development build. Browser testing cannot verify native map rendering or GPS permissions."
    />
  );
}
