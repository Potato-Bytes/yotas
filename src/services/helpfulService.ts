import firestore from '@react-native-firebase/firestore';
import { HelpfulVote, HelpfulStats } from '../types/post';

export class HelpfulService {
  private helpfulCollection = firestore().collection('helpful_votes');

  /**
   * 投票を追加または更新
   */
  async vote(userId: string, toiletId: string, isHelpful: boolean): Promise<void> {
    try {
      // 既存の投票をチェック
      const existingVote = await this.helpfulCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toiletId)
        .get();

      if (!existingVote.empty) {
        // 既存の投票を更新
        const voteDoc = existingVote.docs[0];
        await voteDoc.ref.update({
          isHelpful,
          updatedAt: firestore.Timestamp.now(),
        });
      } else {
        // 新しい投票を作成
        const voteData = {
          id: firestore().collection('helpful_votes').doc().id,
          userId,
          toiletId,
          isHelpful,
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now(),
        };

        await this.helpfulCollection.add(voteData);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      throw new Error('投票に失敗しました');
    }
  }

  /**
   * 投票を削除（取り消し）
   */
  async removeVote(userId: string, toiletId: string): Promise<void> {
    try {
      const existingVote = await this.helpfulCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toiletId)
        .get();

      if (!existingVote.empty) {
        await existingVote.docs[0].ref.delete();
      }
    } catch (error) {
      console.error('Failed to remove vote:', error);
      throw new Error('投票の取り消しに失敗しました');
    }
  }

  /**
   * ユーザーの投票状況を取得
   */
  async getUserVote(userId: string, toiletId: string): Promise<HelpfulVote | null> {
    try {
      const snapshot = await this.helpfulCollection
        .where('userId', '==', userId)
        .where('toiletId', '==', toiletId)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: data.id,
        userId: data.userId,
        toiletId: data.toiletId,
        isHelpful: data.isHelpful,
        createdAt: data.createdAt.toDate(),
      };
    } catch (error) {
      console.error('Failed to get user vote:', error);
      return null;
    }
  }

  /**
   * トイレの投票統計を取得
   */
  async getHelpfulStats(toiletId: string): Promise<HelpfulStats> {
    try {
      const snapshot = await this.helpfulCollection.where('toiletId', '==', toiletId).get();

      let helpfulCount = 0;
      let notHelpfulCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isHelpful) {
          helpfulCount++;
        } else {
          notHelpfulCount++;
        }
      });

      const totalVotes = helpfulCount + notHelpfulCount;
      const helpfulRatio = totalVotes > 0 ? helpfulCount / totalVotes : 0;

      return {
        helpfulCount,
        notHelpfulCount,
        totalVotes,
        helpfulRatio,
      };
    } catch (error) {
      console.error('Failed to get helpful stats:', error);
      return {
        helpfulCount: 0,
        notHelpfulCount: 0,
        totalVotes: 0,
        helpfulRatio: 0,
      };
    }
  }

  /**
   * 複数のトイレの投票統計を一括取得
   */
  async getBatchHelpfulStats(toiletIds: string[]): Promise<Record<string, HelpfulStats>> {
    try {
      if (toiletIds.length === 0) {
        return {};
      }

      // Firestoreのin演算子は最大10個まで
      const batches = [];
      for (let i = 0; i < toiletIds.length; i += 10) {
        const batch = toiletIds.slice(i, i + 10);
        batches.push(batch);
      }

      const results: Record<string, HelpfulStats> = {};

      for (const batch of batches) {
        const snapshot = await this.helpfulCollection.where('toiletId', 'in', batch).get();

        // 各トイレの統計を初期化
        batch.forEach(toiletId => {
          results[toiletId] = {
            helpfulCount: 0,
            notHelpfulCount: 0,
            totalVotes: 0,
            helpfulRatio: 0,
          };
        });

        // 投票データを集計
        snapshot.forEach(doc => {
          const data = doc.data();
          const toiletId = data.toiletId;

          if (data.isHelpful) {
            results[toiletId].helpfulCount++;
          } else {
            results[toiletId].notHelpfulCount++;
          }
        });

        // 比率を計算
        Object.keys(results).forEach(toiletId => {
          const stats = results[toiletId];
          stats.totalVotes = stats.helpfulCount + stats.notHelpfulCount;
          stats.helpfulRatio = stats.totalVotes > 0 ? stats.helpfulCount / stats.totalVotes : 0;
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to get batch helpful stats:', error);
      return {};
    }
  }

  /**
   * ユーザーが投票したトイレ一覧を取得
   */
  async getUserVotedToilets(userId: string): Promise<HelpfulVote[]> {
    try {
      const snapshot = await this.helpfulCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const votes: HelpfulVote[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        votes.push({
          id: data.id,
          userId: data.userId,
          toiletId: data.toiletId,
          isHelpful: data.isHelpful,
          createdAt: data.createdAt.toDate(),
        });
      });

      return votes;
    } catch (error) {
      console.error('Failed to get user voted toilets:', error);
      return [];
    }
  }
}

// シングルトンインスタンス
export const helpfulService = new HelpfulService();
