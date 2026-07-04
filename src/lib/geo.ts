import { z } from "zod";

export type Geofence = {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
};

export type GeoVerificationResult = {
  authorized: boolean;
  nearest?: {
    name: string;
    distanceMeters: number;
    radiusMeters: number;
  };
};

export const geoVerifyRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
});

const geofenceSchema = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().positive(),
});

const defaultDemoGeofences: Geofence[] = [
  {
    name: "Demo workspace",
    lat: 13.7563,
    lng: 100.5018,
    radiusMeters: 20_000_000,
  },
];

export function parseGeofences(raw: string | undefined): Geofence[] {
  if (!raw) {
    return defaultDemoGeofences;
  }

  try {
    const parsed = z.array(geofenceSchema).parse(JSON.parse(raw));
    return parsed.length ? parsed : defaultDemoGeofences;
  } catch {
    return [];
  }
}

export function haversineMeters(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const earthRadiusMeters = 6_371_000;
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(second.lat - first.lat);
  const dLng = toRad(second.lng - first.lng);
  const lat1 = toRad(first.lat);
  const lat2 = toRad(second.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function verifyCoordinate(
  coordinate: { latitude: number; longitude: number },
  geofences: Geofence[],
): GeoVerificationResult {
  const distances = geofences
    .map((geofence) => ({
      geofence,
      distanceMeters: haversineMeters(
        { lat: coordinate.latitude, lng: coordinate.longitude },
        { lat: geofence.lat, lng: geofence.lng },
      ),
    }))
    .sort((first, second) => first.distanceMeters - second.distanceMeters);

  const nearest = distances[0];

  if (!nearest) {
    return { authorized: false };
  }

  return {
    authorized: nearest.distanceMeters <= nearest.geofence.radiusMeters,
    nearest: {
      name: nearest.geofence.name,
      distanceMeters: Math.round(nearest.distanceMeters),
      radiusMeters: nearest.geofence.radiusMeters,
    },
  };
}
