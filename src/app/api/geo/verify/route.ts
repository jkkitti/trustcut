import type { NextRequest } from "next/server";
import { geoVerifyRequestSchema, parseGeofences, verifyCoordinate } from "@/lib/geo";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = geoVerifyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        authorized: false,
        message: "Invalid GPS payload.",
      },
      { status: 400 },
    );
  }

  const rawGeofences = process.env.TRUSTCUT_ALLOWED_GEOFENCES;
  const demoMode = !rawGeofences;
  const geofences = parseGeofences(rawGeofences);
  const result = verifyCoordinate(parsed.data, geofences);

  await logGeoCheck({
    authorized: demoMode || result.authorized,
    demoMode,
    payload: parsed.data,
    nearest: result.nearest,
    userAgent: request.headers.get("user-agent"),
  });

  if (!geofences.length) {
    return Response.json(
      {
        authorized: false,
        demoMode: false,
        message: "No valid geofences configured.",
      },
      { status: 403 },
    );
  }

  if (demoMode) {
    return Response.json({
      ...result,
      authorized: true,
      demoMode: true,
      message: "GPS verified in demo mode. Configure TRUSTCUT_ALLOWED_GEOFENCES for production enforcement.",
    });
  }

  return Response.json(
    {
      ...result,
      demoMode: false,
      message: result.authorized
        ? "GPS coordinate is inside an authorized salon location."
        : "GPS coordinate is outside authorized salon locations.",
    },
    { status: result.authorized ? 200 : 403 },
  );
}

async function logGeoCheck(input: {
  authorized: boolean;
  demoMode: boolean;
  payload: { latitude: number; longitude: number; accuracy?: number };
  nearest?: { name: string; distanceMeters: number; radiusMeters: number };
  userAgent: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("usage_events").insert({
      event_name: "gps_verification",
      metadata: {
        authorized: input.authorized,
        demoMode: input.demoMode,
        latitude: input.payload.latitude,
        longitude: input.payload.longitude,
        accuracy: input.payload.accuracy,
        nearest: input.nearest,
        userAgent: input.userAgent,
      },
    });
  } catch {
    // Logging must not block a location decision.
  }
}
