import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth, useAuthActions } from '../../stores/authStore';

const LoginScreen: React.FC = () => {
  const { isLoading, error } = useAuth();
  const { signInWithGoogle, clearError } = useAuthActions();

  // エラーメッセージの表示
  useEffect(() => {
    if (error) {
      Alert.alert('エラー', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      // エラーはstoreで管理されるため、ここでは何もしない
    }
  };

  return (
    <View style={styles.container}>
      {/* ロゴエリア */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>🚽</Text>
        </View>
        <Text style={styles.appName}>YOTAS</Text>
        <Text style={styles.tagline}>あなたの近くのトイレを見つけよう</Text>
      </View>

      {/* メインコンテンツ */}
      <View style={styles.content}>
        <Text style={styles.title}>ようこそ！</Text>
        <Text style={styles.subtitle}>
          トイレの場所を投稿・検索するには{'\n'}
          Googleアカウントでサインインしてください
        </Text>

        {/* Googleサインインボタン */}
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.buttonText}>Googleでサインイン</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 利用規約・プライバシーポリシー */}
        <Text style={styles.termsText}>
          サインインすることで、
          <Text style={styles.linkText}>利用規約</Text>
          および
          <Text style={styles.linkText}>プライバシーポリシー</Text>
          に同意したものとみなされます。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 50,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285f4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#4285f4',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#4285f4',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
