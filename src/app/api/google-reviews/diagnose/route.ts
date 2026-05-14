import { NextRequest } from "next/server";
import { getSession, apiError, apiOk } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const outlet = searchParams.get("outlet") ?? "Main Place";
  const currentPlaceId = searchParams.get("placeId") ?? "ChIJWQwmdrqzzTER-1vasJy9Yp0GF";

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return apiError("GOOGLE_PLACES_API_KEY not set in environment", 500);

  const results: Record<string, unknown> = {};

  // 1. Test current Place ID
  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${currentPlaceId}&fields=name,rating,user_ratings_total,formatted_address&key=${apiKey}`;
    const r = await fetch(detailsUrl);
    results.currentPlaceId = { placeId: currentPlaceId, ...(await r.json()) };
  } catch (e) {
    results.currentPlaceId = { error: String(e) };
  }

  // 2. Search for correct Place ID by text
  const searches = [
    `Jack Studio ${outlet} USJ Subang Jaya`,
    `Jack Studio ${outlet} Mall`,
    `Jack Studio ${outlet}`,
  ];

  results.searches = [];
  for (const query of searches) {
    try {
      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,formatted_address&key=${apiKey}`;
      const r = await fetch(findUrl);
      const data = await r.json();
      (results.searches as unknown[]).push({ query, ...data });
    } catch (e) {
      (results.searches as unknown[]).push({ query, error: String(e) });
    }
  }

  return apiOk(results);
}
