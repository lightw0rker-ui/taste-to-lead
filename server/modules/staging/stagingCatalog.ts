export type StagingCatalogItem = {
  id: string;
  label: string;
  category: string;
};

export const STAGING_CATALOG: StagingCatalogItem[] = [
  { id: "rug_001", label: "Low-pile Neutral Wool Rug", category: "rug" },
  { id: "drape_001", label: "Linen Drapes (Off-White)", category: "drapes" },
  { id: "art_001", label: "Large Abstract Canvas", category: "wall_art" },
  { id: "mirror_001", label: "Arched Floor Mirror", category: "mirror" },
  { id: "light_floor_001", label: "Arc Floor Lamp", category: "lighting_floor" },
  { id: "plant_001", label: "Large Indoor Plant", category: "plant" },
  { id: "chair_001", label: "Accent Chair", category: "accent_chair" },
  { id: "table_001", label: "Coffee Table", category: "coffee_table" },
  { id: "textile_001", label: "Pillows and Throws Set", category: "pillows_throws" },
  { id: "decor_001", label: "Decor Objects Set", category: "decor_objects" },
];
