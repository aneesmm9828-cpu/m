import { supabase } from './supabaseConfig';
import { decode } from 'base64-arraybuffer';

// --- User Profile & Follow System ---

export const ensureUserProfile = async (userId: string, defaultData?: any) => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      return data;
    } else {
      const profile = {
        id: userId,
        username: defaultData?.username || `user_${userId.substring(0, 5)}`,
        full_name: defaultData?.name || 'New User',
        avatar_url: defaultData?.picture || '',
        bio: defaultData?.bio || 'No bio yet. Start sharing your story!',
        followers_count: 0,
        following_count: 0,
        updated_at: new Date().toISOString(),
      };

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError.message);
        // Fallback: Try upsert if insert failed due to race condition
        const { data: upsertData } = await supabase.from('profiles').upsert(profile).select().single();
        return upsertData;
      }
      return newProfile;
    }
  } catch (err) {
    console.error('ensureUserProfile unexpected error:', err);
    return null;
  }
};

export const getUserProfile = async (userId: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
};

export const updateProfile = async (userId: string, updates: any) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) console.error('Error updating profile:', error.message);
  return data;
};

export const getFollowers = async (userId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('follows')
    .select('follower:follower_id(id, username, full_name, avatar_url)')
    .eq('following_id', userId);
  return (data || []).map(d => d.follower);
};

export const getFollowing = async (userId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('follows')
    .select('following:following_id(id, username, full_name, avatar_url)')
    .eq('follower_id', userId);
  return (data || []).map(d => d.following);
};

export const toggleFollow = async (followerId: string, followingId: string) => {
  if (!supabase) return false;

  try {
    const { data: existing } = await supabase
      .from('follows')
      .select('*')
      .match({ follower_id: followerId, following_id: followingId })
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
      return false; // Not following anymore
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
      return true; // Now following
    }
  } catch (err) {
    console.error('toggleFollow error:', err);
    return false;
  }
};

// --- Search ---

export const searchProfiles = async (query: string, limitCount: number = 20) => {
  if (!supabase || !query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limitCount);

  if (error) {
    console.error('searchProfiles error:', error.message);
    return [];
  }
  return data || [];
};

// --- Media & Posts ---

export const uploadMedia = async (bucket: string, path: string, base64Data: string) => {
  if (!supabase) return '';

  try {
    // Remove data:image/jpeg;base64, prefix if it exists
    const base64Clean = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;

    // Use base64-arraybuffer for reliable conversion in React Native
    const arrayBuffer = decode(base64Clean);

    const isVideo = path.toLowerCase().endsWith('.mp4') || path.toLowerCase().endsWith('.mov');
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error('STORY UPLOAD ERROR:', JSON.stringify(error, null, 2));
      // Log for user visibility in certain environments
      alert('Upload Error: ' + error.message);
      if (error.message.includes('bucket not found')) {
        throw new Error('STORAGE_BUCKET_MISSING');
      }
      return '';
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log('✅ Upload Success. Public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('uploadMedia unexpected error:', err);
    return '';
  }
};

export const createPost = async (userId: string, postData: any) => {
  if (!supabase) return null;

  try {
    // 1. Insert into main 'posts' table
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        caption: postData.caption,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) throw postError;

    // 2. Insert into 'post_media' table
    const mediaItems = postData.mediaItems || [];
    if (postData.mediaUrl && mediaItems.length === 0) {
      mediaItems.push({
        media_url: postData.mediaUrl,
        media_type: postData.type || 'image',
        position: 0
      });
    }

    if (mediaItems.length > 0) {
        const { error: mediaError } = await supabase
            .from('post_media')
            .insert(mediaItems.map((item: any, index: number) => ({
                post_id: post.id,
                media_url: item.media_url,
                media_type: item.media_type || 'image',
                position: item.position ?? index
            })));

        if (mediaError) {
            console.error('Error creating post media:', mediaError.message);
        }
    }

    return post;
  } catch (err: any) {
    console.error('Error creating post:', err.message);
    return null;
  }
};

export const createReel = async (userId: string, reelData: any) => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('reels')
    .insert({
      user_id: userId,
      caption: reelData.caption,
      video_url: reelData.videoUrl,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) console.error('Error creating reel:', error.message);
  return data;
};

// --- Feed & Discovery ---

export const getTrendingPosts = async (limitCount: number = 10) => {
  if (!supabase) return [];

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    // Fetch posts and reels, then sort by engagement
    const [posts, reels] = await Promise.all([
      supabase.from('posts').select(`*, profiles:user_id (id, username, full_name, avatar_url)`).limit(20),
      supabase.from('reels').select(`*, profiles:user_id (id, username, full_name, avatar_url)`).limit(20)
    ]);

    const postIds = (posts.data || []).map(p => p.id);
    const reelIds = (reels.data || []).map(r => r.id);

    const [postLikes, reelLikes] = await Promise.all([
      supabase.from('likes').select('target_id').in('target_id', postIds).eq('target_type', 'post'),
      supabase.from('likes').select('target_id').in('target_id', reelIds).eq('target_type', 'reel')
    ]);

    const combined = [
      ...(posts.data || []).map(p => ({
        ...p,
        type: 'post',
        likes_count: (postLikes.data || []).filter(l => l.target_id === p.id).length
      })),
      ...(reels.data || []).map(r => ({
        ...r,
        type: 'reel',
        likes_count: (reelLikes.data || []).filter(l => l.target_id === r.id).length
      }))
    ];

    // Sort by likes_count desc
    return combined.sort((a, b) => b.likes_count - a.likes_count).slice(0, limitCount);
  } catch (err) {
    console.error('getTrendingPosts error:', err);
    return [];
  }
};

export const getTrendingTopics = async (limitCount: number = 10) => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('post_count', { ascending: false })
      .limit(limitCount);
    return data || [];
  } catch (err) {
    console.error('getTrendingTopics error:', err);
    return [];
  }
};

export const getSuggestedUsers = async (limitCount: number = 10) => {
  if (!supabase) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId || '')
      .limit(limitCount);
    return data || [];
  } catch (err) {
    console.error('getSuggestedUsers error:', err);
    return [];
  }
};

export const getFeedPosts = async (limitCount: number = 20) => {
  if (!supabase) return [];

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    // 1. Get posts with profiles
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (postsError) {
      console.error('Error fetching posts:', postsError.message);
      return [];
    }

    if (!posts || posts.length === 0) return [];

    const postIds = posts.map(p => p.id);

    // 2. Fetch media, likes, and comments
    const [mediaRes, likesRes, commentsRes] = await Promise.all([
      supabase.from('post_media').select('*').in('post_id', postIds).order('position'),
      supabase.from('likes').select('target_id, user_id').in('target_id', postIds).eq('target_type', 'post'),
      supabase.from('comments').select('target_id').in('target_id', postIds).eq('target_type', 'post')
    ]);

    const mediaData = mediaRes.data || [];
    const likesData = likesRes.data || [];
    const commentsData = commentsRes.data || [];

    return posts.map(post => {
      const postMedia = mediaData.filter(m => m.post_id === post.id);
      const postLikes = likesData.filter(l => l.target_id === post.id);
      const postCommentsCount = commentsData.filter(c => c.target_id === post.id).length;

      return {
        ...post,
        post_id: post.id,
        // If there's no entry in post_media, we have a fallback or we ignore it
        media_url: postMedia.length > 0 ? postMedia[0].media_url : '',
        is_video: postMedia.length > 0 && (postMedia[0].media_type === 'video' || postMedia[0].media_url.endsWith('.mp4')),
        is_carousel: postMedia.length > 1,
        carousel_media: postMedia.map(m => ({ url: m.media_url, type: m.media_type })),
        user: post.profiles ? {
          user_id: post.profiles.id,
          username: post.profiles.username,
          name: post.profiles.full_name,
          picture: post.profiles.avatar_url
        } : null,
        likes_count: postLikes.length,
        comments_count: postCommentsCount,
        is_liked: currentUserId ? postLikes.some(l => l.user_id === currentUserId) : false,
        shares_count: post.shares_count || 0,
        remixes_count: post.remixes_count || 0,
        saves_count: post.saves_count || 0,
        views_count: post.views_count || 0,
        tips_total: post.tips_total || 0,
        is_verified: post.is_verified || false
      };
    }).filter(p => p.media_url !== ''); // Only show posts that actually have media
  } catch (err) {
    console.error('Unexpected error in getFeedPosts:', err);
    return [];
  }
};

// --- Comments ---

export const getComments = async (targetId: string, targetType: 'post' | 'reel') => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles:user_id(id, username, full_name, avatar_url)')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error.message);
    return [];
  }
  return data;
};

export const addComment = async (userId: string, targetId: string, targetType: 'post' | 'reel', content: string, parentId?: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      content,
      parent_comment_id: parentId
    })
    .select('*, profiles:user_id(id, username, full_name, avatar_url)')
    .single();

  if (error) {
    console.error('Error adding comment:', error.message);
    return null;
  }
  return data;
};

export const deleteComment = async (commentId: string, userId: string) => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('comments')
    .delete()
    .match({ id: commentId, user_id: userId });

  if (error) {
    console.error('Error deleting comment:', error.message);
    return false;
  }
  return true;
};

export const createStory = async (userId: string, storyData: any) => {
  if (!supabase) return null;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      media_url: storyData.mediaUrl,
      media_type: storyData.media_type || 'image',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) console.error('Error creating story:', error.message);
  return data;
};

export const getActiveStories = async () => {
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select('*, user:user_id(id, username, full_name, avatar_url)')
    .gt('expires_at', now)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error.message);
    return [];
  }

  // Normalize user data to match what the component expects
  return (data || []).map(story => ({
    ...story,
    user: story.user ? {
      user_id: story.user.id,
      username: story.user.username,
      name: story.user.full_name,
      picture: story.user.avatar_url
    } : null
  }));
};

export const getUserHighlights = async (userId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
};

export const getTaggedPosts = async (userId: string) => {
  // Mock tagged posts as there's no direct 'tags' table in common social schemas yet
  // but we can assume a junction table or meta field in the future
  return [];
};

// --- Notifications ---

export const getNotifications = async (limitCount: number = 50) => {
  if (!supabase) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (id, username, full_name, avatar_url)
      `)
      .eq('recipient_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getNotifications error:', err);
    return [];
  }
};

export const getUnreadNotificationsCount = async () => {
  if (!supabase) return 0;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('getUnreadNotificationsCount error:', err);
    return 0;
  }
};

export const markNotificationAsRead = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('markNotificationAsRead error:', error.message);
};

export const markAllNotificationsAsRead = async () => {
  if (!supabase) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false);

    if (error) throw error;
  } catch (err) {
    console.error('markAllNotificationsAsRead error:', err);
  }
};

export const getPostById = async (postId: string) => {
  if (!supabase) return null;

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, full_name, avatar_url)')
      .eq('id', postId)
      .single();

    if (error) throw error;

    const [mediaRes, likesRes, commentsRes] = await Promise.all([
      supabase.from('post_media').select('*').eq('post_id', postId).order('position'),
      supabase.from('likes').select('user_id').eq('target_id', postId).eq('target_type', 'post'),
      supabase.from('comments').select('*, profiles:user_id(id, username, avatar_url)').eq('target_id', postId).eq('target_type', 'post').order('created_at', { ascending: true })
    ]);

    const media = mediaRes.data || [];
    const likes = likesRes.data || [];
    const comments = commentsRes.data || [];

    return {
      ...post,
      type: 'post',
      media_url: media.length > 0 ? media[0].media_url : '',
      is_carousel: media.length > 1,
      carousel_media: media.map(m => ({ url: m.media_url, type: m.media_type })),
      user: post.profiles ? {
        user_id: post.profiles.id,
        username: post.profiles.username,
        name: post.profiles.full_name,
        picture: post.profiles.avatar_url
      } : null,
      likes: likes.map(l => l.user_id),
      likes_count: likes.length,
      comments: comments.map(c => ({
        comment_id: c.id,
        user_id: c.user_id,
        user_name: c.profiles?.username,
        user_picture: c.profiles?.avatar_url,
        text: c.content,
        created_at: c.created_at
      })),
      comments_count: comments.length,
      shares_count: post.shares_count || 0,
      remixes_count: post.remixes_count || 0,
      saves_count: post.saves_count || 0,
      views_count: post.views_count || 0,
      tips_total: post.tips_total || 0,
      is_verified: post.is_verified || false
    };
  } catch (err) {
    console.error('Error fetching post by ID:', err);
    return null;
  }
};

export const getUserPosts = async (userId: string) => {
  if (!supabase) return [];

  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const postIds = (posts || []).map(p => p.id);
    const [mediaRes, likesRes, commentsRes] = await Promise.all([
      supabase.from('post_media').select('*').in('post_id', postIds).order('position'),
      supabase.from('likes').select('target_id, user_id').in('target_id', postIds).eq('target_type', 'post'),
      supabase.from('comments').select('target_id').in('target_id', postIds).eq('target_type', 'post')
    ]);

    const mediaData = mediaRes.data || [];
    const likesData = likesRes.data || [];
    const commentsData = commentsRes.data || [];

    return (posts || []).map(post => {
      const media = mediaData.filter(m => m.post_id === post.id);
      const likes = likesData.filter(l => l.target_id === post.id);
      const commentsCount = commentsData.filter(c => c.target_id === post.id).length;

      return {
        ...post,
        post_id: post.id,
        media_url: media.length > 0 ? media[0].media_url : '',
        is_video: media.length > 0 && media[0].media_type === 'video',
        is_carousel: media.length > 1,
        carousel_media: media.map(m => ({ url: m.media_url, type: m.media_type })),
        user: post.profiles ? {
          user_id: post.profiles.id,
          username: post.profiles.username,
          name: post.profiles.full_name,
          picture: post.profiles.avatar_url
        } : null,
        likes_count: likes.length,
        comments_count: commentsCount,
        shares_count: post.shares_count || 0,
        remixes_count: post.remixes_count || 0,
        saves_count: post.saves_count || 0,
        views_count: post.views_count || 0,
        tips_total: post.tips_total || 0,
        is_verified: post.is_verified || false
      };
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    return [];
  }
};

export const getUnifiedFeed = async (limitCount: number = 30) => {
  if (!supabase) return [];

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    // 1. Fetch Posts and Reels in parallel
    const [postsRes, reelsRes] = await Promise.all([
      supabase.from('posts').select('*, profiles:user_id (id, username, full_name, avatar_url)').order('created_at', { ascending: false }).limit(limitCount),
      supabase.from('reels').select('*, profiles:user_id (id, username, full_name, avatar_url)').order('created_at', { ascending: false }).limit(limitCount)
    ]);

    if (postsRes.error) console.error('Posts Error:', postsRes.error.message);
    if (reelsRes.error) console.error('Reels Error:', reelsRes.error.message);

    const rawPosts = postsRes.data || [];
    const rawReels = reelsRes.data || [];

    // 2. Fetch Media, Likes, Comments for all IDs
    const postIds = rawPosts.map(p => p.id);
    const reelIds = rawReels.map(r => r.id);

    const [postMediaRes, postLikesRes, postCommentsRes, reelLikesRes, reelCommentsRes] = await Promise.all([
      supabase.from('post_media').select('*').in('post_id', postIds),
      supabase.from('likes').select('target_id, user_id').in('target_id', postIds).eq('target_type', 'post'),
      supabase.from('comments').select('target_id').in('target_id', postIds).eq('target_type', 'post'),
      supabase.from('likes').select('target_id, user_id').in('target_id', reelIds).eq('target_type', 'reel'),
      supabase.from('comments').select('target_id').in('target_id', reelIds).eq('target_type', 'reel')
    ]);

    // 3. Process and Normalize Posts
    const processedPosts = rawPosts.map(post => {
      const media = postMediaRes.data?.filter(m => m.post_id === post.id) || [];
      const likes = postLikesRes.data?.filter(l => l.target_id === post.id) || [];
      const commentsCount = postCommentsRes.data?.filter(c => c.target_id === post.id).length || 0;

      return {
        ...post,
        post_id: post.id,
        media_url: media.length > 0 ? media[0].media_url : '',
        is_video: media.length > 0 && (media[0].media_type === 'video' || media[0].media_url.endsWith('.mp4')),
        is_carousel: media.length > 1,
        carousel_media: media.map(m => ({ url: m.media_url, type: m.media_type })),
        user: post.profiles ? { user_id: post.profiles.id, username: post.profiles.username, name: post.profiles.full_name, picture: post.profiles.avatar_url } : null,
        likes_count: likes.length,
        comments_count: commentsCount,
        is_liked: currentUserId ? likes.some(l => l.user_id === currentUserId) : false,
        shares_count: post.shares_count || 0,
        remixes_count: post.remixes_count || 0,
        saves_count: post.saves_count || 0,
        views_count: post.views_count || 0,
        tips_total: post.tips_total || 0,
        is_verified: post.is_verified || false
      };
    }).filter(p => p.media_url !== '');

    // 4. Process and Normalize Reels
    const processedReels = rawReels.map(reel => {
      const likes = reelLikesRes.data?.filter(l => l.target_id === reel.id) || [];
      const commentsCount = reelCommentsRes.data?.filter(c => c.target_id === reel.id).length || 0;

      return {
        ...reel,
        post_id: reel.id, // Normalize ID for home feed tracking
        type: 'reel',
        media_url: reel.video_url, // Use video_url as media_url for unified display
        is_video: true,
        user: reel.profiles ? { user_id: reel.profiles.id, username: reel.profiles.username, name: reel.profiles.full_name, picture: reel.profiles.avatar_url } : null,
        likes_count: likes.length,
        comments_count: commentsCount,
        is_liked: currentUserId ? likes.some(l => l.user_id === currentUserId) : false,
        shares_count: reel.shares_count || 0,
        remixes_count: reel.remixes_count || 0,
        saves_count: reel.saves_count || 0,
        views_count: reel.views_count || 0,
        tips_total: reel.tips_total || 0,
        is_verified: reel.is_verified || false
      };
    });

    // 5. Merge and Sort
    return [...processedPosts, ...processedReels].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limitCount);

  } catch (err) {
    console.error('Unified feed error:', err);
    return [];
  }
};
