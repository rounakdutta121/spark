export interface ReverseGeocodeResult {
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  provider: string;
}
