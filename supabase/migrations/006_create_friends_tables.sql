-- ============================================
-- Friends System Tables
-- ============================================
-- This migration creates tables for:
-- 1. friendships - stores accepted friend relationships
-- 2. friend_requests - stores pending friend invitations
-- 3. user_presence - tracks online/in-game status
-- ============================================

-- ============================================
-- Friendships Table
-- Stores mutual friend relationships (both directions stored as one row)
-- ============================================

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure no duplicate friendships and no self-friendships
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
    CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Index for efficient lookups
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- ============================================
-- Friend Requests Table
-- Stores pending friend invitations
-- ============================================

CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status friend_request_status NOT NULL DEFAULT 'pending',
    message TEXT, -- Optional message with the request
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure no duplicate pending requests and no self-requests
    CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

-- Index for efficient lookups
CREATE INDEX idx_friend_requests_receiver_pending ON friend_requests(receiver_id) WHERE status = 'pending';
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);

-- ============================================
-- User Presence Table
-- Tracks online status and current activity
-- ============================================

CREATE TYPE user_activity AS ENUM ('online', 'in_lobby', 'in_game', 'offline');

CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status user_activity NOT NULL DEFAULT 'offline',
    lobby_id UUID REFERENCES lobbies(id) ON DELETE SET NULL,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for presence queries
CREATE INDEX idx_user_presence_status ON user_presence(status) WHERE status != 'offline';

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Friendships Policies --

-- Users can see their own friendships
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their own friendships (unfriend)
CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Insert handled by function (accepting request creates friendship)
CREATE POLICY "System can insert friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Friend Requests Policies --

-- Users can see requests they sent or received
CREATE POLICY "Users can view own requests"
    ON friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send friend requests
CREATE POLICY "Users can send requests"
    ON friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Users can update requests they received (accept/decline)
CREATE POLICY "Users can respond to received requests"
    ON friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id);

-- Users can delete requests they sent (cancel)
CREATE POLICY "Users can cancel sent requests"
    ON friend_requests FOR DELETE
    USING (auth.uid() = sender_id);

-- User Presence Policies --

-- Anyone can view presence (needed for friends list)
CREATE POLICY "Users can view all presence"
    ON user_presence FOR SELECT
    USING (true);

-- Users can only update their own presence
CREATE POLICY "Users can update own presence"
    ON user_presence FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
    ON user_presence FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to accept a friend request and create the friendship
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id UUID;
    v_receiver_id UUID;
BEGIN
    -- Get the request details and verify the current user is the receiver
    SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
    FROM friend_requests
    WHERE id = request_id AND status = 'pending';
    
    IF v_receiver_id IS NULL THEN
        RAISE EXCEPTION 'Friend request not found or already processed';
    END IF;
    
    IF v_receiver_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the receiver can accept this request';
    END IF;
    
    -- Update request status
    UPDATE friend_requests
    SET status = 'accepted', updated_at = now()
    WHERE id = request_id;
    
    -- Create bidirectional friendship entries
    INSERT INTO friendships (user_id, friend_id)
    VALUES (v_sender_id, v_receiver_id)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO friendships (user_id, friend_id)
    VALUES (v_receiver_id, v_sender_id)
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- Function to decline a friend request
CREATE OR REPLACE FUNCTION decline_friend_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_receiver_id UUID;
BEGIN
    -- Get the request details and verify the current user is the receiver
    SELECT receiver_id INTO v_receiver_id
    FROM friend_requests
    WHERE id = request_id AND status = 'pending';
    
    IF v_receiver_id IS NULL THEN
        RAISE EXCEPTION 'Friend request not found or already processed';
    END IF;
    
    IF v_receiver_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the receiver can decline this request';
    END IF;
    
    -- Update request status
    UPDATE friend_requests
    SET status = 'declined', updated_at = now()
    WHERE id = request_id;
    
    RETURN TRUE;
END;
$$;

-- Function to remove a friend
CREATE OR REPLACE FUNCTION remove_friend(friend_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete both directions of the friendship
    DELETE FROM friendships
    WHERE (user_id = auth.uid() AND friend_id = friend_user_id)
       OR (user_id = friend_user_id AND friend_id = auth.uid());
    
    RETURN TRUE;
END;
$$;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_presence(new_status user_activity, new_lobby_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, lobby_id, last_seen, updated_at)
    VALUES (auth.uid(), new_status, new_lobby_id, now(), now())
    ON CONFLICT (user_id) DO UPDATE
    SET status = new_status,
        lobby_id = new_lobby_id,
        last_seen = now(),
        updated_at = now();
END;
$$;

-- ============================================
-- Note: Presence is created lazily on first use
-- via the update_presence function which uses
-- ON CONFLICT ... DO UPDATE to handle creation.
-- ============================================
