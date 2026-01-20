
export const AZIMUTH_MAP: Record<number, string> = {
  0: "front view",
  45: "front-right quarter view",
  90: "right side view",
  135: "back-right quarter view",
  180: "back view",
  225: "back-left quarter view",
  270: "left side view",
  315: "front-left quarter view"
};

export const ELEVATION_MAP: Record<number, string> = {
  "-30": "low-angle shot",
  0: "eye-level shot",
  30: "elevated shot",
  60: "high-angle shot"
};

export const DISTANCE_MAP: Record<number, string> = {
  0.6: "close-up",
  1.0: "medium shot",
  1.4: "wide shot"
};

export const AZIMUTH_STEPS = [0, 45, 90, 135, 180, 225, 270, 315];
export const ELEVATION_STEPS = [-30, 0, 30, 60];
export const DISTANCE_STEPS = [0.6, 1.0, 1.4];
