import { useState } from "react";
import { isRunningInExpoGo } from "expo";
import { Image, Modal, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Choices, Copy, Screen } from "../components/ui";
import { hazards } from "../data/hazards";
import { useApp } from "../state/AppState";
export default function Hazards() {
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState("1×");
  const { colors } = useApp();
  return (
    <Screen
      title="Hazard reference maps"
      subtitle={isRunningInExpoGo() ? 'Original Urban Exposure maps • Load while connected' : 'Original Urban Exposure maps • Available offline'}
    >
      <Copy muted>
        These supplied images retain their original legends. Their geographic
        alignment and currency are not verified. They are reference documents
        and are not overlaid on the basemap.
      </Copy>
      {hazards.map((hazard, index) => (
        <Card key={hazard.title}>
          <Copy title>{hazard.title}</Copy>
          <Image
            source={hazard.source}
            accessibilityLabel={`${hazard.title} exposure map with original legend`}
            resizeMode="contain"
            style={styles.preview}
          />
          <Button
            secondary
            title={`Open ${hazard.title} map & legend`}
            onPress={() => {
              setSelected(index);
              setZoom("1×");
            }}
          />
        </Card>
      ))}
      <Modal
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
        animationType="fade"
      >
        <SafeAreaView style={[styles.full, { backgroundColor: colors.bg }]}>
          <View style={styles.controls}>
            <Copy title>
              {selected !== null ? hazards[selected].title : ""}
            </Copy>
            <Button
              secondary
              title="Close reference"
              onPress={() => setSelected(null)}
            />
            <Choices
              label="Zoom • scroll to read the legend"
              values={["1×", "2×", "3×"]}
              value={zoom}
              onChange={setZoom}
            />
          </View>
          <ScrollView horizontal>
            <ScrollView>
              {selected !== null && (
                <Image
                  source={hazards[selected].source}
                  accessibilityLabel="Original map and legend"
                  resizeMode="contain"
                  style={{
                    width: 380 * parseInt(zoom),
                    height: 500 * parseInt(zoom),
                  }}
                />
              )}
            </ScrollView>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  preview: { width: "100%", height: 220 },
  full: { flex: 1 },
  controls: { padding: 16, gap: 10 },
});
