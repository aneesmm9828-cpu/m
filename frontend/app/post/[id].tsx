import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getPostById, getUserPosts } from '../../utils/supabaseHelpers';
import { useAuthStore } from '../../store/authStore';
import InstagramPost from '../../components/InstagramPost';
import { supabase } from '../../utils/supabaseConfig';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  const postId = params.id as string;
  const initialUserId = params.userId as string;
  const initialIndex = params.index ? parseInt(params.index as string, 10) : 0;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [activePost, setActivePost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, [postId, initialUserId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // If we have a userId, we fetch all their posts for a feed-like experience
      if (initialUserId) {
        const userPosts = await getUserPosts(initialUserId);
        setPosts(userPosts);

        // Find the index to scroll to
        let index = userPosts.findIndex(p => p.id === postId);
        if (index === -1) index = initialIndex;

        if (index !== -1 && index < userPosts.length) {
          setActivePost(userPosts[index]);
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: false });
          }, 200);
        }
      } else {
        // Fallback: Just load the single post
        const postData = await getPostById(postId);
        if (!postData) {
            Alert.alert('Error', 'Post not found');
            router.back();
            return;
        }
        setPosts([postData]);
        setActivePost(postData);
      }
    } catch (error) {
      console.error('Error loading post(s):', error);
      Alert.alert('Error', 'Failed to load content');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !supabase || !currentUser || !activePost) return;

    try {
      const { error } = await supabase.from('comments').insert({
        user_id: currentUser.user_id,
        target_type: 'post',
        target_id: activePost.id,
        content: commentText.trim()
      });

      if (!error) {
        setCommentText('');
        setShowCommentSheet(false);
        Alert.alert('Success', 'Comment posted!');
        // Ideally, we'd update the local state here instead of re-fetching everything
        const updatedPost = await getPostById(activePost.id);
        if (updatedPost) {
          setPosts(prev => prev.map(p => p.id === activePost.id ? updatedPost : p));
          setActivePost(updatedPost);
        }
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const getUserPicture = () => {
    return currentUser?.avatar_url || currentUser?.picture || 'https://via.placeholder.com/100';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>{activePost?.user?.username?.toUpperCase() || 'USER'}</Text>
          <Text style={styles.headerTitle}>Posts</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InstagramPost
            item={item}
            onCommentPress={() => {
              setActivePost(item);
              setShowCommentSheet(true);
            }}
          />
        )}
        onScrollToIndexFailed={() => {}}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Modal */}
      <Modal
          visible={showCommentSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCommentSheet(false)}
      >
          <TouchableWithoutFeedback onPress={() => setShowCommentSheet(false)}>
              <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                      <KeyboardAvoidingView
                          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                          style={styles.commentSheet}
                      >
                          <View style={styles.sheetHeader}>
                              <View style={styles.sheetHandle} />
                              <Text style={styles.sheetTitle}>Comments</Text>
                          </View>

                          <ScrollView style={styles.commentsList}>
                              {activePost?.comments && activePost.comments.length > 0 ? (
                                  activePost.comments.map((c: any) => (
                                      <View key={c.comment_id} style={styles.commentItem}>
                                          <Image source={{ uri: c.user_picture || 'https://via.placeholder.com/100' }} style={styles.miniAvatar} />
                                          <View style={styles.commentContent}>
                                              <Text style={styles.commentText}>
                                                  <Text style={styles.commentUsername}>{c.user_name} </Text>
                                                  {c.text}
                                              </Text>
                                          </View>
                                      </View>
                                  ))
                              ) : (
                                  <View style={styles.emptyComments}>
                                      <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
                                      <Text style={styles.emptyCommentsText}>No comments yet</Text>
                                      <Text style={styles.emptyCommentsSub}>Start the conversation</Text>
                                  </View>
                              )}
                          </ScrollView>

                          <View style={styles.sheetInputContainer}>
                              <Image source={{ uri: getUserPicture() }} style={styles.miniAvatar} />
                              <View style={styles.inputWrapper}>
                                  <TextInput
                                      style={styles.sheetInput}
                                      placeholder="Add a comment..."
                                      placeholderTextColor={Colors.textSecondary}
                                      value={commentText}
                                      onChangeText={setCommentText}
                                      multiline
                                  />
                                  {commentText.length > 0 && (
                                      <TouchableOpacity onPress={handleComment}>
                                          <Text style={styles.postBtnText}>Post</Text>
                                      </TouchableOpacity>
                                  )}
                              </View>
                          </View>
                      </KeyboardAvoidingView>
                  </TouchableWithoutFeedback>
              </View>
          </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  // Comment Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentSheet: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: height * 0.7, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  sheetHeader: { alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 8 },
  sheetTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  commentsList: { flex: 1, padding: 16 },
  commentItem: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  commentContent: { flex: 1 },
  commentText: { color: Colors.text, fontSize: 14, lineHeight: 18 },
  commentUsername: { fontWeight: 'bold' },
  emptyComments: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyCommentsText: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptyCommentsSub: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  sheetInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  miniAvatar: { width: 36, height: 36, borderRadius: 18 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  sheetInput: { flex: 1, color: Colors.text, fontSize: 14, maxHeight: 80 },
  postBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
});
