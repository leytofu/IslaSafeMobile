// Presentation fixtures only. These are not live warnings or facility records.
export const residentDashboardPreview = {
  name: "Juan",
  barangay: "Poblacion",
  location: "Pitogo Island · CPG, Bohol",
  weather: { temperature: "27°", condition: "Heavy rain", detail: "Strong winds", wind: "68 km/h", humidity: "84%", rainfall: "2.4 mm", waterLevel: "1.8 m" },
  advisory: { title: "A little preparation goes a long way", detail: "Prepare a go bag and review your household plan.", source: "Preparedness reminder" },
  center: { name: "Pitogo Elementary School", location: "Poblacion · 0.6 km away", capacity: "120 of 200 spaces", occupancy: 0.6 },
  hazards: [
    { icon: "cloud-rain", name: "Flooding", status: "Low", tone: "success" },
    { icon: "wind", name: "Storm surge", status: "Monitor", tone: "warning" },
    { icon: "activity", name: "Ground shaking", status: "Low", tone: "success" },
  ],
} as const;
