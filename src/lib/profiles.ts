import { createClient } from "@/lib/supabase/client";

// ============================================
// Types
// ============================================

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

// ============================================
// Profile Operations
// ============================================

/**
 * Gets the current user's profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

/**
 * Gets a profile by user ID.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

/**
 * Gets a profile by username.
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    // Not found is not an error we need to log
    if (error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
    }
    return null;
  }

  return profile;
}

/**
 * Checks if a username is available.
 */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  // Exclude current user when checking for updates
  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error checking username:", error);
    return false;
  }

  return data === null;
}

/**
 * Validates a username format.
 * - 3-20 characters
 * - Only letters, numbers, and underscores
 * - Must start with a letter
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 20) {
    return { valid: false, error: "Username must be 20 characters or less" };
  }

  if (!/^[a-zA-Z]/.test(username)) {
    return { valid: false, error: "Username must start with a letter" };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  return { valid: true };
}

/**
 * Result type for profile operations.
 */
export interface ProfileOperationResult {
  success: boolean;
  error?: string;
  profile?: Profile;
}

/**
 * Updates the current user's profile.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<ProfileOperationResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate username if being changed
  if (input.username) {
    const validation = validateUsername(input.username);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const available = await isUsernameAvailable(input.username, user.id);
    if (!available) {
      return { success: false, error: "Username is already taken" };
    }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }

  return { success: true, profile };
}

/**
 * Uploads an avatar image and updates the profile.
 */
export async function uploadAvatar(file: File): Promise<ProfileOperationResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Image must be less than 2MB" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      upsert: true, // Replace existing file
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return { success: false, error: "Failed to upload image" };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // Update profile with new avatar URL
  return updateProfile({ avatar_url: publicUrl });
}

/**
 * Removes the current user's avatar.
 */
export async function removeAvatar(): Promise<ProfileOperationResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from("avatars")
    .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

  if (deleteError) {
    console.error("Error deleting avatar:", deleteError);
    // Continue anyway - file might not exist
  }

  // Update profile to remove avatar URL
  return updateProfile({ avatar_url: "" });
}
