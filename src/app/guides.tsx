import { Linking } from "react-native";
import { Button, Card, Copy, Screen } from "../components/ui";
import { guides } from "../data/preparedness";
export default function Guides() {
  return (
    <Screen title="Preparedness guides" subtitle="Available offline • English">
      <Copy muted>
        General preparedness guidance, paraphrased from official sources. These
        guides are not live warnings or evacuation orders.
      </Copy>
      {guides.map((guide) => (
        <Card key={guide.title}>
          <Copy title>{guide.title}</Copy>
          {guide.steps.map((step, index) => (
            <Copy key={step}>
              {index + 1}. {step}
            </Copy>
          ))}
          <Copy muted>Source: {guide.source}. Reviewed 14 October 2026.</Copy>
          <Button
            secondary
            title={`Open ${guide.source} source (online)`}
            onPress={() => void Linking.openURL(guide.url)}
          />
        </Card>
      ))}
    </Screen>
  );
}
