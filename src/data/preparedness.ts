// Offline English paraphrases, not live warnings. Reviewed against the linked official sources.
export const guides = [
  {
    title: "Flood preparedness",
    icon: "droplet",
    source: "PAGASA • Floods",
    url: "https://www.pagasa.dost.gov.ph/learning-tools/floods",
    steps: [
      "Know places that flood and plan where your household can move safely.",
      "Keep drinking water, food, medicines, and important belongings ready.",
      "Move to a safe area before floodwater blocks access. Follow local evacuation instructions.",
      "Avoid wading in floodwater, especially children. Do not approach submerged electrical outlets or lines.",
      "Use safe drinking water and follow health authorities after a flood.",
    ],
  },
  {
    title: "Earthquake preparedness",
    icon: "activity",
    source: "PHIVOLCS • Earthquake Preparedness",
    url: "https://www.phivolcs.dost.gov.ph/earthquake-preparedness/",
    steps: [
      "Identify safe places and practice your household earthquake plan.",
      "During shaking, duck, cover, and hold. Protect your head and stay away from windows.",
      "If outside, move away from buildings, power lines, and other falling objects.",
      "After shaking stops, check for injuries and hazards. Expect aftershocks and follow local authorities.",
    ],
  },
  {
    title: "Tsunami: know the natural signs",
    icon: "wind",
    source: "PHIVOLCS • Introduction to Tsunami",
    url: "https://www.phivolcs.dost.gov.ph/introduction-to-tsunami/",
    steps: [
      "Near the coast, strong shaking, unusual sea-level change, or a loud ocean roar can signal a tsunami.",
      "If you observe these signs, immediately move inland or to higher ground. Do not wait for an app warning.",
      "Keep away from the shore. A tsunami can have several waves; the first may not be the largest.",
      "Return only when local authorities say it is safe.",
    ],
  },
] as const;
