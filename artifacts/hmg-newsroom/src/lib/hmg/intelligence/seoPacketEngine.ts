import type { BrandVoiceProfile, SeoPacket } from "./types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 72);
}

export function generateSeoPacket(topic: string, headline: string, brand: BrandVoiceProfile): SeoPacket {
  const cleanTopic = topic.trim() || headline.trim() || `${brand.name} story`;
  const fixes: string[] = [];
  let title = `${headline.trim() || cleanTopic} | ${brand.name}`;
  if (title.length > 64) {
    fixes.push("Shorten SEO title under roughly 64 characters.");
    title = `${cleanTopic.slice(0, 48)} | ${brand.name}`;
  }
  const description = `${brand.name} breaks down ${cleanTopic} with context, source discipline, and the clearest next move.`;
  if (description.length > 160) fixes.push("Trim SEO description under roughly 160 characters.");
  const tags = Array.from(
    new Set([
      brand.name,
      "Analysis",
      "News",
      ...cleanTopic
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .slice(0, 4),
    ]),
  );
  const categories = ["Editorial"];
  if (brand.id === "sports") categories.push("Sports");
  if (brand.id === "hiphop" || brand.id === "rap" || brand.id === "music") categories.push("Music");
  if (brand.id === "canna") categories.push("Culture", "Business");
  if (brand.id === "fit") categories.push("Fitness");
  if (brand.id === "master") categories.push("Media Strategy");
  const readiness = Math.max(55, 100 - fixes.length * 18 - (slugify(cleanTopic).length < 12 ? 12 : 0));
  return {
    title,
    description: description.slice(0, 160),
    slug: slugify(cleanTopic),
    tags,
    categories,
    readiness,
    fixes,
  };
}
