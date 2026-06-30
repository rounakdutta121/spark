"use client";

import { NativeAppProvider } from "@/providers/native-app-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { PresenceProvider } from "@/providers/presence-provider";
import { UserProfileProvider } from "@/providers/user-profile-provider";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <NativeAppProvider>
          <UserProfileProvider>
            <PresenceProvider>
              {children}
              <Toaster richColors position="top-center" />
            </PresenceProvider>
          </UserProfileProvider>
        </NativeAppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
