import { supabase } from '../supabase';

/**
 * Upsert the Expo push token for the current user.
 * Assumes a table `user_push_tokens` with at least:
 * - user_id (uuid, unique)
 * - expo_push_token (text)
 * - last_seen_at (timestamptz)
 *
 * Adjust column names if your schema differs.
 */
export async function upsertUserPushToken(userId, expoPushToken, deviceInfo = {}) {
  if (!userId || !expoPushToken) return null;

  try {
    const payload = {
      user_id: userId,
      expo_push_token: expoPushToken,
      token: expoPushToken, // mirror for legacy schemas with NOT NULL
      last_seen_at: new Date().toISOString(),
      device_platform: deviceInfo.platform || null,
      device_model: deviceInfo.model || null,
    };

    let { data, error } = await supabase
      .from('user_push_tokens')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    // Fallback: if schema uses `token` instead of `expo_push_token`
    if (error && error.code === '42703') {
      const legacyPayload = {
        user_id: userId,
        token: expoPushToken,
        last_seen_at: new Date().toISOString(),
        device_platform: deviceInfo.platform || null,
        device_model: deviceInfo.model || null,
      };
      const retry = await supabase
        .from('user_push_tokens')
        .upsert(legacyPayload, { onConflict: 'user_id' })
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data;
    }

    // Fallback: NOT NULL violation (23502) on legacy token column -> retry with both columns
    if (error && error.code === '23502') {
      const both = { user_id: userId, expo_push_token: expoPushToken, token: expoPushToken, last_seen_at: new Date().toISOString() };
      const retry = await supabase
        .from('user_push_tokens')
        .upsert(both, { onConflict: 'user_id' })
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data;
    }

    // Fallback: if there is no unique constraint for ON CONFLICT (42P10), do manual upsert
    if (error && error.code === '42P10') {
      // Check if a row exists for this user
      const existing = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing.error) throw existing.error;

      const baseUpdate = {
        expo_push_token: expoPushToken,
        token: expoPushToken,
        last_seen_at: new Date().toISOString(),
        device_platform: deviceInfo.platform || null,
        device_model: deviceInfo.model || null,
      };

      if (existing.data) {
        // Update existing row
        let upd = await supabase
          .from('user_push_tokens')
          .update(baseUpdate)
          .eq('user_id', userId)
          .select()
          .single();
        // If columns don't exist (42703), try legacy column names
        if (upd.error && upd.error.code === '42703') {
          const legacyUpdate = {
            token: expoPushToken,
            last_seen_at: new Date().toISOString(),
          };
          upd = await supabase
            .from('user_push_tokens')
            .update(legacyUpdate)
            .eq('user_id', userId)
            .select()
            .single();
        }
        if (upd.error) throw upd.error;
        return upd.data;
      } else {
        // Insert new row
        let ins = await supabase
          .from('user_push_tokens')
          .insert([{ user_id: userId, ...baseUpdate }])
          .select()
          .single();
        if (ins.error && ins.error.code === '42703') {
          const legacyInsert = { user_id: userId, token: expoPushToken, last_seen_at: new Date().toISOString() };
          ins = await supabase
            .from('user_push_tokens')
            .insert([legacyInsert])
            .select()
            .single();
        }
        if (ins.error) throw ins.error;
        return ins.data;
      }
    }

    // Fallback: if schema cache/columns missing (PGRST204), retry with minimal payload
    if (error && error.code === 'PGRST204') {
      // First try with expo_push_token only
      const minimalPayload = { user_id: userId, expo_push_token: expoPushToken, token: expoPushToken, last_seen_at: new Date().toISOString() };
      let retry = await supabase
        .from('user_push_tokens')
        .upsert(minimalPayload, { onConflict: 'user_id' })
        .select()
        .single();
      if (retry.error) {
        // Try legacy token column as last resort
        const minimalLegacy = { user_id: userId, token: expoPushToken, last_seen_at: new Date().toISOString() };
        retry = await supabase
          .from('user_push_tokens')
          .upsert(minimalLegacy, { onConflict: 'user_id' })
          .select()
          .single();
        if (retry.error) throw retry.error;
      }
      return retry.data;
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to upsert user push token:', err);
    return null;
  }
}
