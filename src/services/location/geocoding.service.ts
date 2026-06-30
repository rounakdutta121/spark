import type { ReverseGeocodeResult } from "@/types/location";

export interface GeocodingProvider {
  reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult>;
}

class ManualGeocodingProvider implements GeocodingProvider {
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult> {
    return {
      city: null,
      country: null,
      latitude,
      longitude,
      provider: "manual",
    };
  }
}

let provider: GeocodingProvider = new ManualGeocodingProvider();

export function setGeocodingProvider(newProvider: GeocodingProvider): void {
  provider = newProvider;
}

export function getGeocodingProvider(): GeocodingProvider {
  return provider;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  return provider.reverseGeocode(latitude, longitude);
}
