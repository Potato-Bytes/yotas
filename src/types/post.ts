import { ToiletType, Coordinate } from './maps';

// 複数トイレに対応した投稿フォームデータ型
export interface ToiletPostForm {
  // 施設全体の情報
  facilityTitle: string; // 施設名（例: 東京駅丸の内口）
  facilityDescription: string; // 施設の説明
  type: ToiletType;
  location: Coordinate | null;
  openingHours: OpeningHours;
  facilityImages: string[]; // 施設全体の画像

  // 複数のトイレ情報
  toilets: ToiletInfo[]; // 個別のトイレ情報配列

  // その他
  additionalInfo: string;
}

// 個別のトイレ情報
export interface ToiletInfo {
  id: string; // トイレID（ランダム生成）
  title: string; // トイレ名（例: 1階男性用トイレ）
  description: string; // トイレの説明
  floor?: string; // 階数（例: 1F, B1）
  location?: string; // 位置（例: 改札内、北口近く）
  isAccessible: boolean; // バリアフリー対応
  images: string[]; // トイレの画像
  facilities: ToiletFacilities; // 基本設備
  detailedEquipment: DetailedToiletEquipment; // 詳細設備
  ratings: ToiletRatings; // 評価
}

// トイレ設備情報
export interface ToiletFacilities {
  hasWashlet: boolean; // ウォシュレット
  hasHandDryer: boolean; // ハンドドライヤー
  hasBabyChanging: boolean; // おむつ台
  hasMultiPurpose: boolean; // 多目的トイレ
  hasPaperTowels: boolean; // ペーパータオル
  hasHandSoap: boolean; // ハンドソープ
  hasVendingMachine: boolean; // 自動販売機
}

// 営業時間
export interface OpeningHours {
  is24Hours: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "21:00"
  notes?: string; // 特記事項
}

// 詳細なトイレ設備情報
export interface DetailedToiletEquipment {
  genderType: 'separate' | 'shared' | 'multipurpose'; // 男女別/共用/多目的

  // 男性用設備（男女別の場合）
  maleEquipment: {
    urinals: number; // 小便器数
    westernToilets: number; // 洋式便器数
  } | null;

  // 女性用設備（男女別の場合）
  femaleEquipment: {
    japaneseToilets: number; // 和式便器数
    westernToilets: number; // 洋式便器数
  } | null;

  // 共用設備（共用/多目的の場合）
  sharedEquipment: {
    japaneseToilets: number; // 和式便器数
    westernToilets: number; // 洋式便器数
  } | null;

  // 追加設備
  additionalFeatures: {
    hasBabyChangingTable: boolean; // おむつ替え台
    hasHandDryer: boolean; // ハンドドライヤー
    hasWashlet: boolean; // ウォシュレット
    hasPaperTowels: boolean; // ペーパータオル
    hasHandSoap: boolean; // ハンドソープ
    hasVendingMachine: boolean; // 自動販売機
    hasWheelchairAccess: boolean; // 車椅子対応
  };
}

// 6つの評価軸
export interface ToiletRatings {
  overall: number; // 総合評価（1-5、必須）
  cleanliness?: number; // 掃除状況（1-5、任意）
  newness?: number; // 新しさ（1-5、任意）
  smell?: number; // 臭い（1-5、任意）
  userManners?: number; // 利用者マナー（1-5、任意）
  pestControl?: number; // 害虫の有無（1-5、任意）
}

// 個別トイレの初期値
export const initialToiletInfo: ToiletInfo = {
  id: '',
  title: '',
  description: '',
  floor: '',
  location: '',
  isAccessible: false,
  images: [],
  facilities: {
    hasWashlet: false,
    hasHandDryer: false,
    hasBabyChanging: false,
    hasMultiPurpose: false,
    hasPaperTowels: false,
    hasHandSoap: false,
    hasVendingMachine: false,
  },
  detailedEquipment: {
    genderType: 'separate',
    maleEquipment: {
      urinals: 0,
      westernToilets: 0,
    },
    femaleEquipment: {
      japaneseToilets: 0,
      westernToilets: 0,
    },
    sharedEquipment: null,
    additionalFeatures: {
      hasBabyChangingTable: false,
      hasHandDryer: false,
      hasWashlet: false,
      hasPaperTowels: false,
      hasHandSoap: false,
      hasVendingMachine: false,
      hasWheelchairAccess: false,
    },
  },
  ratings: {
    overall: 5,
    cleanliness: undefined,
    newness: undefined,
    smell: undefined,
    userManners: undefined,
    pestControl: undefined,
  },
};

// 投稿フォームの初期値
export const initialToiletPostForm: ToiletPostForm = {
  facilityTitle: '',
  facilityDescription: '',
  type: ToiletType.PUBLIC,
  location: null,
  openingHours: {
    is24Hours: true,
    openTime: undefined,
    closeTime: undefined,
    notes: '',
  },
  facilityImages: [],
  toilets: [{ ...initialToiletInfo, id: 'toilet_1' }], // 最初は1つのトイレ
  additionalInfo: '',
};

// バリデーション関数
export const validateToiletPost = (
  form: ToiletPostForm,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 施設情報の必須フィールドのチェック
  if (!form.facilityTitle.trim()) {
    errors.push('施設名は必須です');
  }

  if (form.facilityTitle.length > 100) {
    errors.push('施設名は100文字以内で入力してください');
  }

  if (!form.location) {
    errors.push('位置情報を設定してください');
  }

  if (form.facilityDescription.length > 500) {
    errors.push('施設説明は500文字以内で入力してください');
  }

  if (form.additionalInfo.length > 300) {
    errors.push('追加情報は300文字以内で入力してください');
  }

  // 営業時間のチェック
  if (!form.openingHours.is24Hours) {
    if (!form.openingHours.openTime || !form.openingHours.closeTime) {
      errors.push('営業時間を設定してください');
    }
  }

  // トイレ情報のチェック
  if (form.toilets.length === 0) {
    errors.push('少なくとも1つのトイレ情報を追加してください');
  }

  form.toilets.forEach((toilet, index) => {
    if (!toilet.title.trim()) {
      errors.push(`トイレ${index + 1}: タイトルは必須です`);
    }

    if (toilet.title.length > 50) {
      errors.push(`トイレ${index + 1}: タイトルは50文字以内で入力してください`);
    }

    if (toilet.description.length > 500) {
      errors.push(`トイレ${index + 1}: 説明は500文字以内で入力してください`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 画像のバリデーション
export const validateImages = (images: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (images.length > 5) {
    errors.push('画像は5枚まで投稿可能です');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// トイレタイプの選択肢
export const toiletTypeOptions = [
  { value: ToiletType.PUBLIC, label: '公共トイレ', icon: '🚻' },
  { value: ToiletType.CONVENIENCE_STORE, label: 'コンビニ', icon: '🏪' },
  { value: ToiletType.STATION, label: '駅', icon: '🚉' },
  { value: ToiletType.PARK, label: '公園', icon: '🌳' },
  { value: ToiletType.SHOPPING_MALL, label: 'ショッピングモール', icon: '🏬' },
  { value: ToiletType.RESTAURANT, label: 'レストラン・カフェ', icon: '🍽️' },
  { value: ToiletType.GAS_STATION, label: 'ガソリンスタンド', icon: '⛽' },
  { value: ToiletType.OTHER, label: 'その他', icon: '🚽' },
];

// 設備アイコン
export const facilityIcons = {
  hasWashlet: '🚿',
  hasHandDryer: '💨',
  hasBabyChanging: '👶',
  hasMultiPurpose: '♿',
  hasPaperTowels: '🧻',
  hasHandSoap: '🧼',
  hasVendingMachine: '🏪',
};

// 設備ラベル
export const facilityLabels = {
  hasWashlet: 'ウォシュレット',
  hasHandDryer: 'ハンドドライヤー',
  hasBabyChanging: 'おむつ台',
  hasMultiPurpose: '多目的トイレ',
  hasPaperTowels: 'ペーパータオル',
  hasHandSoap: 'ハンドソープ',
  hasVendingMachine: '自動販売機',
};

// 評価軸の定義
export const ratingCategories = [
  {
    key: 'overall' as keyof ToiletRatings,
    label: '総合評価',
    icon: '⭐',
    required: true,
    description: '全体的な満足度',
  },
  {
    key: 'cleanliness' as keyof ToiletRatings,
    label: '掃除状況',
    icon: '🧹',
    required: false,
    description: 'きれいに清掃されているか',
  },
  {
    key: 'newness' as keyof ToiletRatings,
    label: '新しさ',
    icon: '🏢',
    required: false,
    description: '設備の新しさ・きれいさ',
  },
  {
    key: 'smell' as keyof ToiletRatings,
    label: '臭い',
    icon: '👃',
    required: false,
    description: '嫌な臭いがしないか',
  },
  {
    key: 'userManners' as keyof ToiletRatings,
    label: '利用者マナー',
    icon: '👥',
    required: false,
    description: '汚され方・マナー・治安',
  },
  {
    key: 'pestControl' as keyof ToiletRatings,
    label: '害虫の有無',
    icon: '🐛',
    required: false,
    description: '虫や衛生害獣がいないか',
  },
];

// 男女区分の選択肢
export const genderTypeOptions = [
  { value: 'separate', label: '男女別', icon: '🚻' },
  { value: 'shared', label: '男女共用', icon: '🚽' },
  { value: 'multipurpose', label: '多目的トイレ', icon: '♿' },
];

// 「役に立った」機能の型定義
export interface HelpfulVote {
  id: string;
  userId: string;
  toiletId: string;
  isHelpful: boolean; // true: 役に立った, false: 役に立たなかった
  createdAt: Date;
}

// 役に立った投票の統計
export interface HelpfulStats {
  helpfulCount: number; // 役に立った数
  notHelpfulCount: number; // 役に立たなかった数
  totalVotes: number; // 総投票数
  helpfulRatio: number; // 役に立った比率 (0-1)
}

// バッジシステムの型定義
export interface Badge {
  id: string;
  name: string; // バッジ名
  description: string; // バッジの説明
  icon: string; // バッジのアイコン（絵文字）
  category: BadgeCategory;
  condition: BadgeCondition;
  rarity: BadgeRarity; // レア度
  unlockedAt?: Date; // 取得日時
}

export enum BadgeCategory {
  POSTING = 'posting', // 投稿関連
  REVIEWING = 'reviewing', // レビュー関連
  EXPLORATION = 'exploration', // 探索関連
  COMMUNITY = 'community', // コミュニティ関連
  SPECIAL = 'special', // 特別バッジ
}

export enum BadgeRarity {
  COMMON = 'common', // よくある（ブロンズ）
  UNCOMMON = 'uncommon', // 珍しい（シルバー）
  RARE = 'rare', // レア（ゴールド）
  EPIC = 'epic', // エピック（プラチナ）
  LEGENDARY = 'legendary', // 伝説（ダイヤモンド）
}

export interface BadgeCondition {
  type: 'count' | 'streak' | 'rating' | 'special';
  target: string; // 対象（例: 'toilets_posted', 'helpful_votes'）
  value: number; // 必要な値
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // 期間制限
}

// ユーザーのバッジ取得状況
export interface UserBadges {
  userId: string;
  unlockedBadges: string[]; // 取得済みバッジID配列
  progress: Record<string, number>; // バッジごとの進捗
  lastChecked: Date; // 最後にチェックした日時
}

// プッシュ通知システムの型定義
export interface PushNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>; // 追加データ（画面遷移用など）
  isRead: boolean;
  createdAt: Date;
  scheduledAt?: Date; // 予約送信時刻
}

export enum NotificationType {
  BADGE_UNLOCKED = 'badge_unlocked', // バッジ取得
  HELPFUL_VOTE = 'helpful_vote', // 「役に立った」投票
  NEW_TOILET_NEARBY = 'new_toilet_nearby', // 近くの新しいトイレ
  TOILET_UPDATED = 'toilet_updated', // トイレ情報更新
  MAINTENANCE_ALERT = 'maintenance_alert', // メンテナンス通知
  COMMUNITY_NEWS = 'community_news', // コミュニティニュース
  WEEKLY_SUMMARY = 'weekly_summary', // 週間サマリー
  ACHIEVEMENT_REMINDER = 'achievement_reminder', // 達成リマインダー
}

// 通知設定
export interface NotificationSettings {
  userId: string;
  enabled: boolean; // 通知全体のON/OFF
  badgeNotifications: boolean; // バッジ通知
  helpfulVoteNotifications: boolean; // 「役に立った」通知
  nearbyToiletNotifications: boolean; // 近くのトイレ通知
  updateNotifications: boolean; // 更新通知
  newsNotifications: boolean; // ニュース通知
  summaryNotifications: boolean; // サマリー通知
  reminderNotifications: boolean; // リマインダー通知
  quietHoursEnabled: boolean; // サイレント時間
  quietHoursStart: string; // サイレント開始時刻 "22:00"
  quietHoursEnd: string; // サイレント終了時刻 "08:00"
  updatedAt: Date;
}

// プッシュトークン情報
export interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
}

// 検索・フィルター機能の型定義
export interface SearchFilters {
  query: string; // 検索クエリ
  toiletType?: ToiletType; // トイレタイプ
  isAccessible?: boolean; // バリアフリー
  hasWashlet?: boolean; // ウォシュレット
  rating?: number; // 最低評価
  distance?: number; // 距離（km）
  openNow?: boolean; // 現在営業中
  sortBy: SortOption; // ソート方法
}

export enum SortOption {
  RELEVANCE = 'relevance', // 関連度
  DISTANCE = 'distance', // 距離
  RATING = 'rating', // 評価
  NEWEST = 'newest', // 新しい順
  HELPFUL = 'helpful', // 役に立った順
}

// 検索結果
export interface SearchResult {
  toilets: any[]; // ToiletLocationは別ファイルで定義されているため、anyを使用
  totalCount: number;
  hasMore: boolean;
  searchTime: number; // 検索時間（ms）
}

// 保存された検索条件
export interface SavedSearch {
  id: string;
  userId: string;
  name: string; // 検索条件の名前
  filters: SearchFilters;
  createdAt: Date;
  lastUsed: Date;
}

// 検索履歴
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  searchedAt: Date;
}

// 履歴・お気に入り機能の型定義
export interface ViewHistory {
  id: string;
  userId: string;
  toiletId: string;
  toiletTitle: string;
  toiletType: string;
  viewedAt: Date;
  viewCount: number; // 同じトイレを見た回数
}

export interface Favorite {
  id: string;
  userId: string;
  toiletId: string;
  toiletTitle: string;
  toiletType: string;
  addedAt: Date;
  lastViewed?: Date;
}

// ユーザーアクティビティ
export interface UserActivity {
  id: string;
  userId: string;
  type: ActivityType;
  targetId: string; // トイレID、バッジIDなど
  targetTitle: string; // 対象の名前
  description: string; // アクティビティの説明
  createdAt: Date;
}

export enum ActivityType {
  TOILET_POSTED = 'toilet_posted', // トイレ投稿
  TOILET_UPDATED = 'toilet_updated', // トイレ更新
  HELPFUL_VOTE = 'helpful_vote', // 役に立った投票
  BADGE_EARNED = 'badge_earned', // バッジ取得
  FAVORITE_ADDED = 'favorite_added', // お気に入り追加
  REVIEW_POSTED = 'review_posted', // レビュー投稿
}

// 統計情報
export interface UserStats {
  userId: string;
  totalPosts: number; // 総投稿数
  totalViews: number; // 総閲覧数
  totalFavorites: number; // お気に入り数
  totalHelpfulVotes: number; // 役に立った投票数
  totalBadges: number; // 取得バッジ数
  joinedAt: Date; // 参加日
  lastActiveAt: Date; // 最終アクティブ日時
  streak: number; // 連続投稿日数
}

// 通報機能の型定義
export interface Report {
  id: string;
  reporterId: string; // 通報者ID
  targetType: ReportTargetType; // 通報対象種別
  targetId: string; // 対象ID（トイレID、ユーザーIDなど）
  reason: ReportReason; // 通報理由
  description?: string; // 詳細説明
  evidence?: string[]; // 証拠画像URL
  status: ReportStatus; // 処理状況
  createdAt: Date; // 通報日時
  reviewedAt?: Date; // 審査日時
  reviewerId?: string; // 審査者ID
  resolution?: string; // 処理結果
}

export enum ReportTargetType {
  TOILET = 'toilet', // トイレ投稿
  REVIEW = 'review', // レビュー
  USER = 'user', // ユーザー
  COMMENT = 'comment', // コメント
}

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content', // 不適切なコンテンツ
  SPAM = 'spam', // スパム
  HARASSMENT = 'harassment', // 嫌がらせ
  FAKE_INFORMATION = 'fake_information', // 虚偽情報
  COPYRIGHT_VIOLATION = 'copyright_violation', // 著作権侵害
  PRIVACY_VIOLATION = 'privacy_violation', // プライバシー侵害
  COMMERCIAL_SPAM = 'commercial_spam', // 商業的スパム
  HATE_SPEECH = 'hate_speech', // ヘイトスピーチ
  OTHER = 'other', // その他
}

export enum ReportStatus {
  PENDING = 'pending', // 審査待ち
  UNDER_REVIEW = 'under_review', // 審査中
  RESOLVED = 'resolved', // 解決済み
  DISMISSED = 'dismissed', // 却下
  AUTO_RESOLVED = 'auto_resolved', // 自動解決
}

// 自動制限システム
export interface UserRestriction {
  id: string;
  userId: string;
  type: RestrictionType;
  reason: string;
  startDate: Date;
  endDate?: Date; // 永久制限の場合はnull
  isActive: boolean;
  createdBy: 'system' | 'admin'; // システム自動 or 管理者手動
  details?: Record<string, any>; // 制限の詳細情報
}

export enum RestrictionType {
  POST_RESTRICTION = 'post_restriction', // 投稿制限
  COMMENT_RESTRICTION = 'comment_restriction', // コメント制限
  REVIEW_RESTRICTION = 'review_restriction', // レビュー制限
  VOTE_RESTRICTION = 'vote_restriction', // 投票制限
  TEMPORARY_BAN = 'temporary_ban', // 一時停止
  PERMANENT_BAN = 'permanent_ban', // 永久停止
  WARNING = 'warning', // 警告
}

// 違反行為の記録
export interface ViolationRecord {
  id: string;
  userId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  description: string;
  evidence?: string[];
  reportId?: string; // 関連する通報ID
  autoDetected: boolean; // 自動検出かどうか
  points: number; // 違反ポイント
  createdAt: Date;
  expiresAt?: Date; // ポイント失効日
}

export enum ViolationType {
  SPAM_POSTING = 'spam_posting',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  HARASSMENT = 'harassment',
  FAKE_INFORMATION = 'fake_information',
  MULTIPLE_ACCOUNTS = 'multiple_accounts',
  VOTE_MANIPULATION = 'vote_manipulation',
  COMMERCIAL_SPAM = 'commercial_spam',
}

export enum ViolationSeverity {
  LOW = 'low', // 軽微（1-2ポイント）
  MEDIUM = 'medium', // 中程度（3-5ポイント）
  HIGH = 'high', // 重大（6-10ポイント）
  CRITICAL = 'critical', // 極めて重大（11+ポイント）
}

// 制限の自動判定設定
export interface AutoRestrictionConfig {
  maxViolationPoints: number; // 制限発動ポイント閾値
  pointExpirationDays: number; // ポイント失効日数
  restrictions: {
    [key: number]: {
      // ポイント数をキーとする
      type: RestrictionType;
      durationDays?: number; // 制限期間（日数）
      message: string; // ユーザーへの通知メッセージ
    };
  };
}
