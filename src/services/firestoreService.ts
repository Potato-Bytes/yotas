import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { ToiletPostForm } from '../types/post';
import { ToiletLocation } from '../types/maps';

export class FirestoreService {
  private toiletsCollection = firestore().collection('toilets');
  private imagesRef = storage().ref('toilet-images');

  /**
   * 画像をFirebase Storageにアップロード
   */
  async uploadImages(images: string[], toiletId: string): Promise<string[]> {
    const uploadPromises = images.map(async (imagePath, index) => {
      try {
        const imageRef = this.imagesRef.child(`${toiletId}/${index}.jpg`);
        await imageRef.putFile(imagePath);
        const downloadURL = await imageRef.getDownloadURL();
        return downloadURL;
      } catch (error) {
        console.error(`Failed to upload image ${index}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  }

  /**
   * トイレ情報をFirestoreに保存
   */
  async createToilet(form: ToiletPostForm, userId: string): Promise<string> {
    try {
      // Firestoreドキュメントを作成
      const toiletRef = this.toiletsCollection.doc();
      const toiletId = toiletRef.id;

      // 画像をアップロード
      let imageUrls: string[] = [];
      if (form.images.length > 0) {
        imageUrls = await this.uploadImages(form.images, toiletId);
      }

      // Firestoreに保存するデータ
      const toiletData = {
        id: toiletId,
        title: form.title,
        description: form.description,
        type: form.type,
        isAccessible: form.isAccessible,
        location: {
          latitude: form.location!.latitude,
          longitude: form.location!.longitude,
        },
        facilities: form.facilities,
        openingHours: form.openingHours,
        additionalInfo: form.additionalInfo,
        detailedEquipment: form.detailedEquipment,
        ratings: form.ratings,
        images: imageUrls,
        createdBy: userId,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
        rating: form.ratings.overall || 0,
        reviewCount: 1,
        isActive: true,
      };

      await toiletRef.set(toiletData);
      return toiletId;
    } catch (error: any) {
      console.error('Failed to create toilet:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(`トイレの投稿に失敗しました: ${error.message}`);
    }
  }

  /**
   * トイレ情報を更新
   */
  async updateToilet(toiletId: string, updates: Partial<ToiletLocation>): Promise<void> {
    try {
      await this.toiletsCollection.doc(toiletId).update({
        ...updates,
        updatedAt: firestore.Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to update toilet:', error);
      throw new Error('トイレ情報の更新に失敗しました');
    }
  }

  /**
   * 近くのトイレを検索
   */
  async getNearbyToilets(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ): Promise<ToiletLocation[]> {
    try {
      console.log(`位置情報でトイレを検索中: lat=${latitude}, lng=${longitude}, radius=${radiusKm}km`);
      
      // 入力値の検証
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.error('無効な位置情報:', { latitude, longitude });
        throw new Error('無効な位置情報が提供されました');
      }
      
      // Firestoreでは地理的クエリが制限されているため、
      // より寛容な範囲検索を実装（検索範囲を2倍に拡大）
      const latDelta = (radiusKm * 2) / 111.32; // 緯度1度 ≈ 111.32km
      const lngDelta = (radiusKm * 2) / (111.32 * Math.cos((latitude * Math.PI) / 180));

      console.log(`検索範囲: lat=${latitude-latDelta}~${latitude+latDelta}, lng=${longitude-lngDelta}~${longitude+lngDelta}`);

      // まずFirestoreへの接続をテスト
      const testQuery = await this.toiletsCollection.limit(1).get();
      console.log('Firestore接続テスト成功:', testQuery.size);

      // 複合インデックスを避けるため、単一条件でクエリして後でフィルタリング
      const snapshot = await this.toiletsCollection
        .where('isActive', '==', true)
        .limit(100)
        .get();

      console.log(`Firestoreクエリ結果: ${snapshot.size}件のドキュメント`);

      const toilets: ToiletLocation[] = [];

      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          console.log(`処理中のドキュメント: ${doc.id}`, data);

          // データの存在確認
          if (!data.location || !data.location.latitude || !data.location.longitude) {
            console.warn(`ドキュメント ${doc.id} に位置情報がありません`);
            return;
          }

          // 位置情報の範囲チェック（クライアントサイド）
          const withinLatRange = data.location.latitude >= latitude - latDelta && 
                                data.location.latitude <= latitude + latDelta;
          const withinLngRange = data.location.longitude >= longitude - lngDelta && 
                                data.location.longitude <= longitude + lngDelta;
          
          console.log(`位置チェック: ${data.title}`);
          console.log(`  緯度: ${data.location.latitude} (範囲: ${latitude - latDelta} ~ ${latitude + latDelta}) = ${withinLatRange}`);
          console.log(`  経度: ${data.location.longitude} (範囲: ${longitude - lngDelta} ~ ${longitude + lngDelta}) = ${withinLngRange}`);
          
          if (withinLatRange && withinLngRange) {
            toilets.push({
              id: data.id || doc.id,
              title: data.title || 'タイトルなし',
              description: data.description || '',
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              type: data.type || 'public',
              isAccessible: data.isAccessible || false,
              rating: data.rating || 0,
              reviewCount: data.reviewCount || 0,
              createdBy: data.createdBy || '',
              createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            });
          }
        } catch (docError: any) {
          console.error(`ドキュメント ${doc.id} の処理でエラー:`, docError);
        }
      });

      console.log(`結果: ${toilets.length}件のトイレが見つかりました`);
      return toilets;
    } catch (error: any) {
      console.error('Failed to get nearby toilets:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Firestoreの接続エラーかどうかを判定
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        throw new Error('Firestoreへの接続に失敗しました。ネットワーク接続とFirebase設定を確認してください。');
      } else if (error.code === 'unauthenticated') {
        throw new Error('認証が必要です。ログインしてから再度お試しください。');
      } else {
        throw new Error(`近くのトイレの取得に失敗しました: ${error.message}`);
      }
    }
  }

  /**
   * 特定のトイレ情報を取得
   */
  async getToilet(toiletId: string): Promise<ToiletLocation | null> {
    try {
      const doc = await this.toiletsCollection.doc(toiletId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        type: data.type,
        isAccessible: data.isAccessible,
        rating: data.rating,
        reviewCount: data.reviewCount,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    } catch (error: any) {
      console.error('Failed to get toilet:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(`トイレ情報の取得に失敗しました: ${error.message}`);
    }
  }

  /**
   * ユーザーが投稿したトイレ一覧を取得
   */
  async getUserToilets(userId: string): Promise<ToiletLocation[]> {
    try {
      const snapshot = await this.toiletsCollection
        .where('createdBy', '==', userId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      const toilets: ToiletLocation[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        toilets.push({
          id: data.id,
          title: data.title,
          description: data.description,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          type: data.type,
          isAccessible: data.isAccessible,
          rating: data.rating,
          reviewCount: data.reviewCount,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      return toilets;
    } catch (error) {
      console.error('Failed to get user toilets:', error);
      throw new Error('ユーザーのトイレ一覧の取得に失敗しました');
    }
  }

  /**
   * トイレを削除（論理削除）
   */
  async deleteToilet(toiletId: string): Promise<void> {
    try {
      await this.toiletsCollection.doc(toiletId).update({
        isActive: false,
        updatedAt: firestore.Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to delete toilet:', error);
      throw new Error('トイレの削除に失敗しました');
    }
  }

  /**
   * テスト用サンプルデータを作成
   */
  async createSampleData(): Promise<void> {
    try {
      console.log('サンプルデータを作成中...');
      
      const sampleToilets = [
        {
          title: '東京駅構内トイレ',
          description: '東京駅丸の内中央口近くの清潔なトイレです',
          type: 'public',
          isAccessible: true,
          location: { latitude: 35.6812, longitude: 139.7671 },
          facilities: ['washlet', 'handicap'],
          openingHours: '24時間',
          additionalInfo: '駅構内にあります',
          detailedEquipment: { washlet: true, handicapAccess: true },
          ratings: { overall: 4.5, cleanliness: 4.5, accessibility: 5.0 },
          images: [],
          createdBy: 'system',
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now(),
          rating: 4.5,
          reviewCount: 10,
          isActive: true,
        },
        {
          title: '新宿駅南口トイレ',
          description: '新宿駅南口近くの便利なトイレ',
          type: 'public',
          isAccessible: true,
          location: { latitude: 35.6896, longitude: 139.7006 },
          facilities: ['washlet'],
          openingHours: '24時間',
          additionalInfo: '駅近くです',
          detailedEquipment: { washlet: true, handicapAccess: false },
          ratings: { overall: 4.0, cleanliness: 4.0, accessibility: 3.5 },
          images: [],
          createdBy: 'system',
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now(),
          rating: 4.0,
          reviewCount: 5,
          isActive: true,
        }
      ];

      for (const toilet of sampleToilets) {
        const docRef = this.toiletsCollection.doc();
        await docRef.set({
          ...toilet,
          id: docRef.id,
        });
        console.log(`サンプルトイレを作成: ${toilet.title} (ID: ${docRef.id})`);
      }

      console.log('サンプルデータの作成が完了しました');
    } catch (error: any) {
      console.error('サンプルデータの作成に失敗:', error);
      throw new Error(`サンプルデータの作成に失敗しました: ${error.message}`);
    }
  }

  /**
   * トイレ検索（テキスト）
   */
  async searchToilets(query: string, limit: number = 20): Promise<ToiletLocation[]> {
    try {
      // Firestoreの制限により、単純なテキスト検索を実装
      // 本格的な検索にはAlgoliaなどの外部サービスを推奨
      const snapshot = await this.toiletsCollection
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const toilets: ToiletLocation[] = [];
      const lowerQuery = query.toLowerCase();

      snapshot.forEach(doc => {
        const data = doc.data();

        // クライアントサイドでのテキスト検索
        if (
          data.title.toLowerCase().includes(lowerQuery) ||
          data.description.toLowerCase().includes(lowerQuery)
        ) {
          toilets.push({
            id: data.id,
            title: data.title,
            description: data.description,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            type: data.type,
            isAccessible: data.isAccessible,
            rating: data.rating,
            reviewCount: data.reviewCount,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          });
        }
      });

      return toilets;
    } catch (error: any) {
      console.error('Failed to search toilets:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(`トイレの検索に失敗しました: ${error.message}`);
    }
  }
}

// シングルトンインスタンス
export const firestoreService = new FirestoreService();
