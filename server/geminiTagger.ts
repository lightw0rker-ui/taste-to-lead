import { GoogleGenerativeAI } from "@google/generative-ai";

const VALID_ARCHETYPES = [
  "Purist",
  "Industrialist",
  "Monarch",
  "Futurist",
  "Naturalist",
  "Curator",
  "Classicist",
  "Nomad",
] as const;

export type Archetype = (typeof VALID_ARCHETYPES)[number] | "Unclassified";

export async function classifyPropertyImage(imageUrl: string): Promise<Archetype> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[GeminiTagger] GEMINI_API_KEY not set, defaulting to Unclassified");
    return "Unclassified";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt =
      "Analyze this interior design. Classify it into exactly ONE of these 8 archetypes: Purist, Industrialist, Monarch, Futurist, Naturalist, Curator, Classicist, Nomad. Return ONLY the single word.";

    let result;

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";

      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
      ]);
    } else {
      result = await model.generateContent([
        prompt + ` The property is described as having a "${imageUrl}" style. Based on this description, classify it.`,
      ]);
    }

    const text = result.response.text().trim();
    const matched = VALID_ARCHETYPES.find(
      (a) => a.toLowerCase() === text.toLowerCase()
    );

    if (matched) {
      console.log(`[GeminiTagger] Classified as: ${matched}`);
      return matched;
    }

    const partialMatch = VALID_ARCHETYPES.find((a) =>
      text.toLowerCase().includes(a.toLowerCase())
    );
    if (partialMatch) {
      console.log(`[GeminiTagger] Partial match classified as: ${partialMatch}`);
      return partialMatch;
    }

    console.warn(`[GeminiTagger] Unexpected response: "${text}", defaulting to Unclassified`);
    return "Unclassified";
  } catch (error: any) {
    console.error(`[GeminiTagger] Error: ${error.message}, defaulting to Unclassified`);
    return "Unclassified";
  }
}
