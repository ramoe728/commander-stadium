"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navigation, Footer } from "@/components/layout";
import { useAuth } from "@/hooks";
import {
  Profile,
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  validateUsername,
  isUsernameAvailable,
} from "@/lib/profiles";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const profileData = await getCurrentProfile();
      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username);
        setDisplayName(profileData.display_name || "");
      }
      setLoading(false);
    }

    if (!authLoading && user) {
      loadProfile();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  // Check username availability with debounce
  useEffect(() => {
    if (!profile || username === profile.username) {
      setUsernameError(null);
      setUsernameAvailable(null);
      return;
    }

    // Validate format first
    const validation = validateUsername(username);
    if (!validation.valid) {
      setUsernameError(validation.error || null);
      setUsernameAvailable(null);
      return;
    }

    setUsernameError(null);

    // Debounce availability check
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    usernameCheckTimeout.current = setTimeout(async () => {
      const available = await isUsernameAvailable(username, profile.id);
      setUsernameAvailable(available);
      if (!available) {
        setUsernameError("Username is already taken");
      }
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username, profile]);

  async function handleSaveProfile() {
    if (!profile || isSaving) return;

    // Validate before saving
    if (username !== profile.username) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        setUsernameError(validation.error || null);
        return;
      }
      if (usernameAvailable === false) {
        setUsernameError("Username is already taken");
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus("idle");

    const result = await updateProfile({
      username: username !== profile.username ? username : undefined,
      display_name: displayName || undefined,
    });

    if (result.success && result.profile) {
      setProfile(result.profile);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setUsernameError(result.error || "Failed to save");
      setSaveStatus("error");
    }

    setIsSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);

    const result = await uploadAvatar(file);

    if (result.success && result.profile) {
      setProfile(result.profile);
    } else {
      alert(result.error || "Failed to upload avatar");
    }

    setIsUploadingAvatar(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    if (!profile?.avatar_url) return;

    setIsUploadingAvatar(true);

    const result = await removeAvatar();

    if (result.success && result.profile) {
      setProfile(result.profile);
    }

    setIsUploadingAvatar(false);
  }

  // Not authenticated
  if (!authLoading && !user) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />
        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-4">
              Sign In Required
            </h1>
            <p className="text-[var(--foreground-muted)] mb-8">
              You need to be signed in to access settings.
            </p>
            <Link
              href="/login"
              className="btn-primary px-8 py-3 rounded-xl text-white font-medium inline-block"
            >
              Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading
  if (loading || authLoading) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />
        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasChanges = profile && (
    username !== profile.username ||
    displayName !== (profile.display_name || "")
  );

  return (
    <div className="animated-gradient min-h-screen relative">
      <div className="particles absolute inset-0 pointer-events-none opacity-30" />

      <Navigation />

      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-2">
              Settings
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Manage your account and profile
            </p>
          </div>

          {/* Profile Section */}
          <div className="feature-card rounded-xl p-6 mb-6">
            <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-6">
              Profile
            </h2>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border)]"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl text-white font-bold border-2 border-[var(--border)]"
                    style={{ backgroundColor: profile?.avatar_color || "#7c3aed" }}
                  >
                    {profile?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <LoadingSpinner className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="btn-secondary px-4 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-50"
                >
                  Upload Photo
                </button>
                {profile?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="block text-sm text-red-400 hover:text-red-300 cursor-pointer disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-[var(--foreground-muted)]">
                  JPG, PNG or WebP. Max 2MB.
                </p>
              </div>
            </div>

            {/* Username */}
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 bg-[var(--surface)] border rounded-lg text-[var(--foreground)] focus:outline-none transition-colors ${
                    usernameError
                      ? "border-red-500 focus:border-red-500"
                      : usernameAvailable === true
                      ? "border-green-500 focus:border-green-500"
                      : "border-[var(--border)] focus:border-[var(--accent-primary)]"
                  }`}
                />
                {username !== profile?.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameAvailable === true && (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    )}
                    {usernameError && (
                      <XIcon className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-400">{usernameError}</p>
              )}
              {usernameAvailable === true && username !== profile?.username && (
                <p className="mt-1 text-sm text-green-400">Username is available!</p>
              )}
            </div>

            {/* Display Name */}
            <div className="mb-6">
              <label htmlFor="displayName" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Display Name <span className="text-[var(--foreground-muted)]">(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you want to be shown to others"
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={!hasChanges || isSaving || !!usernameError}
              className="btn-primary px-6 py-2 rounded-lg text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          {/* Account Section */}
          <div className="feature-card rounded-xl p-6">
            <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-6">
              Account
            </h2>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Email
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-grow px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)]">
                  {user?.email}
                </div>
                <span className="text-xs text-[var(--foreground-muted)]">
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* User ID (for debugging) */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                User ID
              </label>
              <div className="px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] font-mono text-sm">
                {user?.id}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
