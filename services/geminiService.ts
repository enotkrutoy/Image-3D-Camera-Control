
import { GoogleGenAI } from "@google/genai";
import { AZIMUTH_MAP, ELEVATION_MAP, DISTANCE_MAP } from "../constants";

export const editCameraAngle = async (
  base64Image: string,
  azimuth: number,
  elevation: number,
  distance: number
): Promise<string> => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const azimuthName = AZIMUTH_MAP[azimuth] || "front view";
  const elevationName = ELEVATION_MAP[elevation] || "eye-level shot";
  const distanceName = DISTANCE_MAP[distance] || "medium shot";

  // Identity preservation prompt strategy for Gemini
  const prompt = `Maintain the exact identity and details of the person or subject in this image. 
  Change the camera perspective to a ${azimuthName}, ${elevationName}, and ${distanceName}. 
  Ensure consistent lighting and environmental details.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/png'
          },
        },
        {
          text: prompt
        },
      ],
    },
  });

  // Iterate through parts to find the image part as recommended
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from model");
};
