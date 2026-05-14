import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, apiError, apiOk } from "@/lib/auth";
import { OUTLET_PLACE_CONFIGS } from "@/lib/google-places-config";

const CACHE_TTL_MS  = 60 * 60 * 1000; // 1 hour
const PLACES_API    = "https://maps.googleapis.com/maps/api/place/details/json";
const FIELDS        = "name,rating,user_ratings_total,reviews";

export interface GoogleReview {
  author_name:              string;
  rating:                   number;
  text:                     string;
  relative_time_description: string;
  time:                     number;
  profile_photo_url:        string;
  language:                 string;
}

interface PlacesResponse {
  result?: {
    name:               string;
    rating:             number;
    user_ratings_total: number;
    reviews?:           GoogleReview[];
  };
  status: string;
  error_message?: string;
}

async function fetchPlaceDetails(placeId: string): Promise<PlacesResponse | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${PLACES_API}?place_id=${encodeURIComponent(placeId)}&fields=${FIELDS}&language=en&key=${apiKey}`;
    const res  = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// GET /api/google-reviews?refresh=1  — force refresh all
// GET /api/google-reviews?outlet=KEY — single outlet (refresh if stale)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  const outletKey    = searchParams.get("outlet");

  const configs = outletKey
    ? OUTLET_PLACE_CONFIGS.filter(c => c.outletKey === outletKey && c.placeId)
    : OUTLET_PLACE_CONFIGS.filter(c => c.placeId);

  if (configs.length === 0) {
    // Return cached data for all outlets (including unconfigured)
    const cached = await prisma.googlePlacesCache.findMany({ orderBy: { outletName: "asc" } });
    return apiOk({ outlets: cached.map(c => ({ ...c, reviews: JSON.parse(c.reviews) })) });
  }

  const now    = Date.now();
  const result = [];

  for (const config of configs) {
    const existing = await prisma.googlePlacesCache.findUnique({
      where: { outletKey: config.outletKey },
    });

    const isStale = !existing || (now - existing.cachedAt.getTime() > CACHE_TTL_MS);

    if (!isStale && !forceRefresh && existing) {
      result.push({ ...existing, reviews: JSON.parse(existing.reviews) });
      continue;
    }

    // Fetch fresh data
    const placeData = await fetchPlaceDetails(config.placeId);

    if (placeData?.status === "OK" && placeData.result) {
      const { rating, user_ratings_total, reviews = [] } = placeData.result;

      const record = await prisma.googlePlacesCache.upsert({
        where:  { outletKey: config.outletKey },
        update: {
          rating,
          totalRatings: user_ratings_total,
          reviews:      JSON.stringify(reviews),
          cachedAt:     new Date(),
        },
        create: {
          outletKey:    config.outletKey,
          placeId:      config.placeId,
          outletName:   config.outletName,
          rating,
          totalRatings: user_ratings_total,
          reviews:      JSON.stringify(reviews),
          cachedAt:     new Date(),
        },
      });
      result.push({ ...record, reviews });
    } else if (existing) {
      // API failed — return stale cache
      result.push({ ...existing, reviews: JSON.parse(existing.reviews) });
    } else {
      // No data at all
      result.push({
        outletKey:    config.outletKey,
        outletName:   config.outletName,
        placeId:      config.placeId,
        rating:       0,
        totalRatings: 0,
        reviews:      [],
        cachedAt:     null,
        error:        placeData?.error_message ?? placeData?.status ?? "fetch_failed",
      });
    }
  }

  // Also include unconfigured outlets (no placeId) from config
  const unconfigured = OUTLET_PLACE_CONFIGS
    .filter(c => !c.placeId)
    .map(c => ({
      outletKey:    c.outletKey,
      outletName:   c.outletName,
      placeId:      "",
      rating:       0,
      totalRatings: 0,
      reviews:      [],
      cachedAt:     null,
      unconfigured: true,
    }));

  return apiOk({
    outlets: [...result, ...unconfigured].sort((a, b) => a.outletName.localeCompare(b.outletName)),
  });
}

// PATCH /api/google-reviews — update Place ID for an outlet
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!["admin", "manager"].includes(session.role)) return apiError("Forbidden", 403);

  const { outletKey, placeId } = await req.json();
  if (!outletKey || !placeId) return apiError("outletKey and placeId required");

  const config = OUTLET_PLACE_CONFIGS.find(c => c.outletKey === outletKey);
  if (!config) return apiError("Unknown outletKey");

  // Update the cache record (place ID is in config file, but we store it in cache too)
  await prisma.googlePlacesCache.upsert({
    where:  { outletKey },
    update: { placeId, cachedAt: new Date(0) }, // force refresh on next GET
    create: { outletKey, placeId, outletName: config.outletName, reviews: "[]", cachedAt: new Date(0) },
  });

  return apiOk({ success: true });
}
