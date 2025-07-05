import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  MediaType,
  ImagePickerResponse,
} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';

interface ImagePickerProps {
  images: string[];
  onAddImage: (imagePath: string) => void;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
}

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3; // 3列表示、余白を考慮

const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  images,
  onAddImage,
  onRemoveImage,
  maxImages = 5,
}) => {
  const selectImageSource = useCallback(() => {
    Alert.alert('画像を選択', '画像の取得方法を選択してください', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'カメラで撮影', onPress: openCamera },
      { text: 'ライブラリから選択', onPress: openImageLibrary },
    ]);
  }, []);

  const openCamera = useCallback(() => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]?.uri) {
        onAddImage(response.assets[0].uri);
      }
    });
  }, [onAddImage]);

  const openImageLibrary = useCallback(() => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: maxImages - images.length,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets) {
        response.assets.forEach(asset => {
          if (asset.uri) {
            onAddImage(asset.uri);
          }
        });
      }
    });
  }, [onAddImage, maxImages, images.length]);

  const confirmRemoveImage = useCallback(
    (index: number) => {
      Alert.alert('画像を削除', 'この画像を削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', onPress: () => onRemoveImage(index), style: 'destructive' },
      ]);
    },
    [onRemoveImage],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          写真 ({images.length}/{maxImages})
        </Text>
        <Text style={styles.subtitle}>トイレの写真を追加してください</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.imageGrid}>
          {/* 追加ボタン */}
          {images.length < maxImages && (
            <TouchableOpacity style={styles.addButton} onPress={selectImageSource}>
              <Icon name="camera" size={32} color="#666" />
              <Text style={styles.addButtonText}>写真を追加</Text>
            </TouchableOpacity>
          )}

          {/* 画像リスト */}
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => confirmRemoveImage(index)}
              >
                <Icon name="close-circle" size={24} color="#ff4757" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {images.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="images-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>まだ写真がありません</Text>
          <Text style={styles.emptySubtext}>
            トイレの外観や内部の写真を追加すると、他のユーザーに役立ちます
          </Text>
        </View>
      )}

      {images.length > 0 && (
        <View style={styles.tips}>
          <Icon name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.tipsText}>
            写真は他のユーザーがトイレを見つけやすくするために使用されます
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    marginHorizontal: -8,
  },
  imageGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  addButton: {
    width: imageSize,
    height: imageSize,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f9f9f9',
  },
  addButtonText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 4,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  tips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },
});

export default ImagePickerComponent;
