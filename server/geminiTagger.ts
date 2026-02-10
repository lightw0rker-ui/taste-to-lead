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

const VIBE_BIBLE_PROMPT = `You are the "Vibe Bible" — a strict real estate archetype classifier. Analyze the property listing (image and/or description) and classify it into exactly ONE of the 8 mutually exclusive archetypes below.

THE 8 ARCHETYPES (Mutually Exclusive):

1. MONARCH
   Keywords: "Penthouse", "Gold", "Marble", "Velvet", "Crystal", "Grand", "Opulent", "Skyline", "Concierge"
   Visuals: High contrast, black & gold, floor-to-ceiling glass, chandeliers
   Psychology: Status, Power, Dominance

2. INDUSTRIALIST
   Keywords: "Loft", "Warehouse", "Exposed Brick", "Concrete", "Steel Beams", "Ductwork", "Raw", "Factory"
   Visuals: High ceilings, open pipes, metal finishes, large grid windows
   Psychology: Authenticity, Strength, "Bones"

3. PURIST
   Keywords: "Minimalist", "White", "Clean Lines", "Seamless", "Hidden Storage", "Zero Clutter", "Monochromatic"
   Visuals: All-white interiors, handleless cabinets, empty spaces
   Psychology: Discipline, Clarity, Focus

4. NATURALIST
   Keywords: "Sanctuary", "Biophilic", "Plants", "Green", "Indoor-Outdoor", "Retreat", "Wood", "Stone", "Natural Light"
   Visuals: Living walls, heavy foliage, raw timber, skylights
   Psychology: Grounding, Peace, Wellness

5. FUTURIST
   Keywords: "Smart Home", "Tech", "Neon", "LED", "Glass", "Chrome", "Sleek", "Automated", "Tesla"
   Visuals: Integrated lighting, sharp angles, reflective surfaces, screen interfaces
   Psychology: Innovation, Speed, Efficiency

6. CURATOR
   Keywords: "Art", "Gallery", "Eclectic", "Bold", "Color", "Statement", "Unique", "Mural", "Wallpaper"
   Visuals: Mismatched furniture, vibrant colors, sculptures, gallery walls
   Psychology: Expression, Storytelling, Uniqueness

7. NOMAD
   Keywords: "Boho", "Eclectic", "Travel", "Collected", "Rugs", "Texture", "Earth Tones", "Global", "Warm"
   Visuals: Layered textiles, rattan, terracotta, artifacts
   Psychology: Freedom, Warmth, Experience

8. CLASSICIST
   Keywords: "Historic", "Traditional", "Estate", "Molding", "Library", "Wood Paneling", "Timeless", "Heritage"
   Visuals: Symmetry, antiques, dark wood, built-ins, fireplaces
   Psychology: Legacy, History, Respect

RULES:
- Select the SINGLE best-fit archetype from the 8 above.
- Match based on keywords in the listing text AND visual cues in the image.
- If ambiguous and the property has vibrant colors or bold art, default to "Curator".
- If ambiguous and the property has neutral/traditional elements, default to "Classicist".
- Return ONLY the single archetype word (e.g. "Monarch"). No explanation, no punctuation.`;

export async function classifyPropertyImage(imageUrl: string): Promise<Archetype> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[GeminiTagger] GEMINI_API_KEY not set, defaulting to Unclassified");
    return "Unclassified";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let result;

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";

      result = await model.generateContent([
        VIBE_BIBLE_PROMPT,
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
      ]);
    } else {
      result = await model.generateContent([
        VIBE_BIBLE_PROMPT + `\n\nThe property has no image available. Classify based on this description: "${imageUrl}"`,
      ]);
    }

    const text = result.response.text().trim();
    const matched = VALID_ARCHETYPES.find(
      (a) => a.toLowerCase() === text.toLowerCase()
    );

    if (matched) {
      console.log(`[GeminiTagger] Vibe Bible classified as: ${matched}`);
      return matched;
    }

    const partialMatch = VALID_ARCHETYPES.find((a) =>
      text.toLowerCase().includes(a.toLowerCase())
    );
    if (partialMatch) {
      console.log(`[GeminiTagger] Vibe Bible partial match: ${partialMatch}`);
      return partialMatch;
    }

    console.warn(`[GeminiTagger] Unexpected response: "${text}", defaulting to Classicist`);
    return "Classicist";
  } catch (error: any) {
    console.error(`[GeminiTagger] Error: ${error.message}, defaulting to Unclassified`);
    return "Unclassified";
  }
}
