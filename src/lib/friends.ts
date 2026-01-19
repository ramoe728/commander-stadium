import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profiles";

// ============================================
// Types
// ============================================

export type UserActivity = "online" | "in_lobby" | "in_game" | "offline";

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_color: string;
  status: UserActivity;
  lobby_id: string | null;
  last_seen: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  message: string | null;
  created_at: string;
  // Populated sender profile for display
  sender?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_color: string;
  };
}

export interface FriendOperationResult {
  success: boolean;
  error?: string;
}

// ============================================
// Friend List Operations
// ============================================

/**
 * Gets the current user's friends list with presence information.
 */
export async function getFriends(): Promise<Friend[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get friendships
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching friendships:", error);
    return [];
  }

  if (!friendships || friendships.length === 0) {
    return [];
  }

  // Get friend IDs
  const friendIds = friendships.map((f) => f.friend_id);

  // Fetch friend profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_color")
    .in("id", friendIds);

  if (profilesError) {
    console.error("Error fetching friend profiles:", profilesError);
    return [];
  }

  // Fetch presence information
  const { data: presenceData, error: presenceError } = await supabase
    .from("user_presence")
    .select("user_id, status, lobby_id, last_seen")
    .in("user_id", friendIds);

  if (presenceError) {
    console.error("Error fetching presence:", presenceError);
    // Continue without presence data
  }

  // Create maps for quick lookup
  const presenceMap = new Map(
    (presenceData || []).map((p) => [p.user_id, p])
  );

  // Transform the data into Friend objects
  return (profiles || []).map((profile) => {
    const presence = presenceMap.get(profile.id);
    
    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      avatar_color: profile.avatar_color,
      status: (presence?.status as UserActivity) || "offline",
      lobby_id: presence?.lobby_id || null,
      last_seen: presence?.last_seen || new Date().toISOString(),
    };
  });
}

/**
 * Removes a friend (unfriends).
 */
export async function removeFriend(friendId: string): Promise<FriendOperationResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("remove_friend", {
    friend_user_id: friendId,
  });

  if (error) {
    console.error("Error removing friend:", error);
    return { success: false, error: "Failed to remove friend" };
  }

  return { success: true };
}

// ============================================
// Friend Request Operations
// ============================================

/**
 * Gets pending friend requests received by the current user.
 */
export async function getPendingRequests(): Promise<FriendRequest[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // First, get the pending requests
  const { data: requests, error } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status, message, created_at")
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching friend requests:", error);
    return [];
  }

  if (!requests || requests.length === 0) {
    return [];
  }

  // Get unique sender IDs
  const senderIds = [...new Set(requests.map((r) => r.sender_id))];

  // Fetch sender profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, avatar_color")
    .in("id", senderIds);

  if (profilesError) {
    console.error("Error fetching sender profiles:", profilesError);
  }

  // Create a map of sender profiles
  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  // Combine requests with sender profiles
  return requests.map((r) => {
    const senderProfile = profileMap.get(r.sender_id);
    return {
      id: r.id,
      sender_id: r.sender_id,
      receiver_id: r.receiver_id,
      status: r.status as "pending" | "accepted" | "declined",
      message: r.message,
      created_at: r.created_at,
      sender: senderProfile ? {
        username: senderProfile.username,
        display_name: senderProfile.display_name,
        avatar_url: senderProfile.avatar_url,
        avatar_color: senderProfile.avatar_color,
      } : undefined,
    };
  });
}

/**
 * Gets the count of pending friend requests.
 */
export async function getPendingRequestsCount(): Promise<number> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("friend_requests")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error counting friend requests:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Sends a friend request to a user by username or email.
 */
export async function sendFriendRequest(
  searchValue: string,
  message?: string
): Promise<FriendOperationResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Determine if searching by email or username
  const isEmail = searchValue.includes("@");
  let targetUserId: string | null = null;

  if (isEmail) {
    // Search by email in auth.users (we need to use a function for this)
    // For security, we'll check if a profile exists with matching user ID from email
    // Note: This requires a secure server function or we search profiles differently
    
    // For now, we'll just check if there's a user with this email
    // This is a limitation - in production, you'd use a server function
    return { 
      success: false, 
      error: "Email search is not supported yet. Please search by username." 
    };
  } else {
    // Search by username
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", searchValue)
      .single();

    if (error || !profile) {
      return { success: false, error: "User not found" };
    }

    targetUserId = profile.id;
  }

  // Check if trying to add self
  if (targetUserId === user.id) {
    return { success: false, error: "You cannot send a friend request to yourself" };
  }

  // Check if already friends
  const { data: existingFriendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_id", user.id)
    .eq("friend_id", targetUserId)
    .single();

  if (existingFriendship) {
    return { success: false, error: "You are already friends with this user" };
  }

  // Check if there's already a pending request (in either direction)
  const { data: existingRequest } = await supabase
    .from("friend_requests")
    .select("id, sender_id, status")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
    .eq("status", "pending")
    .single();

  if (existingRequest) {
    if (existingRequest.sender_id === user.id) {
      return { success: false, error: "You already sent a friend request to this user" };
    } else {
      return { success: false, error: "This user has already sent you a friend request" };
    }
  }

  // Send the friend request
  const { error: insertError } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: user.id,
      receiver_id: targetUserId,
      message: message || null,
    });

  if (insertError) {
    console.error("Error sending friend request:", insertError);
    return { success: false, error: "Failed to send friend request" };
  }

  return { success: true };
}

/**
 * Accepts a friend request.
 */
export async function acceptFriendRequest(requestId: string): Promise<FriendOperationResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("accept_friend_request", {
    request_id: requestId,
  });

  if (error) {
    console.error("Error accepting friend request:", error);
    return { success: false, error: error.message || "Failed to accept friend request" };
  }

  return { success: true };
}

/**
 * Declines a friend request.
 */
export async function declineFriendRequest(requestId: string): Promise<FriendOperationResult> {
  const supabase = createClient();

  const { error } = await supabase.rpc("decline_friend_request", {
    request_id: requestId,
  });

  if (error) {
    console.error("Error declining friend request:", error);
    return { success: false, error: error.message || "Failed to decline friend request" };
  }

  return { success: true };
}

/**
 * Cancels a sent friend request.
 */
export async function cancelFriendRequest(requestId: string): Promise<FriendOperationResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error("Error canceling friend request:", error);
    return { success: false, error: "Failed to cancel friend request" };
  }

  return { success: true };
}

// ============================================
// Presence Operations
// ============================================

/**
 * Updates the current user's presence status.
 */
export async function updatePresence(
  status: UserActivity,
  lobbyId?: string | null
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("update_presence", {
    new_status: status,
    new_lobby_id: lobbyId || null,
  });

  if (error) {
    console.error("Error updating presence:", error);
  }
}

/**
 * Sets the user as online.
 */
export async function setOnline(): Promise<void> {
  await updatePresence("online");
}

/**
 * Sets the user as offline.
 */
export async function setOffline(): Promise<void> {
  await updatePresence("offline");
}

/**
 * Sets the user as in a lobby.
 */
export async function setInLobby(lobbyId: string): Promise<void> {
  await updatePresence("in_lobby", lobbyId);
}

/**
 * Sets the user as in a game.
 */
export async function setInGame(lobbyId?: string): Promise<void> {
  await updatePresence("in_game", lobbyId);
}

// ============================================
// Search Operations
// ============================================

/**
 * Searches for users by username (for adding friends).
 * Returns users that are not already friends and not the current user.
 */
export async function searchUsers(query: string): Promise<Profile[]> {
  if (!query || query.length < 2) return [];

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get current friends to exclude them
  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", user.id);

  const friendIds = (friendships || []).map((f) => f.friend_id);
  const excludeIds = [user.id, ...friendIds];

  // Search profiles by username
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", `%${query}%`)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(10);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return profiles || [];
}
