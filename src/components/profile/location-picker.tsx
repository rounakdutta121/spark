"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthButton } from "@/components/auth/auth-button";
import { cn } from "@/lib/utils";
import type { LocationInput } from "@/schemas/profile/profile.schema";

interface LocationPickerProps {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  onSave: (data: LocationInput) => Promise<unknown>;
  disabled?: boolean;
}

export function LocationPicker({
  city: initialCity,
  country: initialCountry,
  latitude: initialLat,
  longitude: initialLng,
  onSave,
  disabled,
}: LocationPickerProps) {
  const [city, setCity] = useState(initialCity ?? "");
  const [country, setCountry] = useState(initialCountry ?? "");
  const [latitude, setLatitude] = useState(
    initialLat?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    initialLng?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    setCity(initialCity ?? "");
    setCountry(initialCountry ?? "");
    setLatitude(initialLat?.toString() ?? "");
    setLongitude(initialLng?.toString() ?? "");
  }, [initialCity, initialCountry, initialLat, initialLng]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        city: city || null,
        country: country || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={detectLocation}
        disabled={disabled || geoLoading}
        className="inline-flex items-center gap-2 rounded-xl border border-[#FF4458]/30 bg-[#FF4458]/10 px-4 py-2 text-sm font-medium text-[#FF4458] transition-colors hover:bg-[#FF4458]/20 disabled:opacity-50"
      >
        <Navigation className={cn("size-4", geoLoading && "animate-spin")} />
        {geoLoading ? "Detecting..." : "Use my location"}
      </button>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
            className="rounded-xl"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. India"
            className="rounded-xl"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Optional"
            className="rounded-xl"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Optional"
            className="rounded-xl"
            disabled={disabled}
          />
        </div>
      </div>

      {(city || country) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-[#FF4458]" />
          {[city, country].filter(Boolean).join(", ")}
        </div>
      )}

      <AuthButton
        type="button"
        loading={saving}
        loadingText="Saving location..."
        disabled={disabled}
        onClick={handleSave}
        className="sm:w-auto sm:px-8"
      >
        Save location
      </AuthButton>
    </div>
  );
}
