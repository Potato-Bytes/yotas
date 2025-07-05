import { Badge, BadgeCategory, BadgeRarity } from '../types/post';

// 全バッジの定義
export const BADGES: Badge[] = [
  // 投稿関連バッジ
  {
    id: 'first_post',
    name: '初投稿',
    description: '初めてトイレ情報を投稿しました',
    icon: '🎉',
    category: BadgeCategory.POSTING,
    condition: {
      type: 'count',
      target: 'toilets_posted',
      value: 1,
    },
    rarity: BadgeRarity.COMMON,
  },
  {
    id: 'poster_bronze',
    name: '投稿者（ブロンズ）',
    description: '5件のトイレ情報を投稿しました',
    icon: '🥉',
    category: BadgeCategory.POSTING,
    condition: {
      type: 'count',
      target: 'toilets_posted',
      value: 5,
    },
    rarity: BadgeRarity.COMMON,
  },
  {
    id: 'poster_silver',
    name: '投稿者（シルバー）',
    description: '20件のトイレ情報を投稿しました',
    icon: '🥈',
    category: BadgeCategory.POSTING,
    condition: {
      type: 'count',
      target: 'toilets_posted',
      value: 20,
    },
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: 'poster_gold',
    name: '投稿者（ゴールド）',
    description: '50件のトイレ情報を投稿しました',
    icon: '🥇',
    category: BadgeCategory.POSTING,
    condition: {
      type: 'count',
      target: 'toilets_posted',
      value: 50,
    },
    rarity: BadgeRarity.RARE,
  },
  {
    id: 'poster_master',
    name: 'トイレマスター',
    description: '100件のトイレ情報を投稿しました',
    icon: '👑',
    category: BadgeCategory.POSTING,
    condition: {
      type: 'count',
      target: 'toilets_posted',
      value: 100,
    },
    rarity: BadgeRarity.EPIC,
  },

  // レビュー関連バッジ
  {
    id: 'first_helpful_vote',
    name: '初評価',
    description: '初めて「役に立った」評価をしました',
    icon: '👍',
    category: BadgeCategory.REVIEWING,
    condition: {
      type: 'count',
      target: 'helpful_votes_given',
      value: 1,
    },
    rarity: BadgeRarity.COMMON,
  },
  {
    id: 'helpful_reviewer',
    name: '評価者',
    description: '50回「役に立った」評価をしました',
    icon: '⭐',
    category: BadgeCategory.REVIEWING,
    condition: {
      type: 'count',
      target: 'helpful_votes_given',
      value: 50,
    },
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: 'trusted_reviewer',
    name: '信頼できる評価者',
    description: '投稿が100回「役に立った」と評価されました',
    icon: '🌟',
    category: BadgeCategory.REVIEWING,
    condition: {
      type: 'count',
      target: 'helpful_votes_received',
      value: 100,
    },
    rarity: BadgeRarity.RARE,
  },
  {
    id: 'quality_poster',
    name: '高品質投稿者',
    description: '投稿の90%以上が「役に立った」と評価されました（10件以上投稿）',
    icon: '💎',
    category: BadgeCategory.REVIEWING,
    condition: {
      type: 'rating',
      target: 'helpful_ratio',
      value: 0.9,
    },
    rarity: BadgeRarity.EPIC,
  },

  // 探索関連バッジ
  {
    id: 'area_explorer',
    name: '地域探索者',
    description: '5つ以上の異なる地域でトイレを投稿しました',
    icon: '🗺️',
    category: BadgeCategory.EXPLORATION,
    condition: {
      type: 'count',
      target: 'unique_areas_posted',
      value: 5,
    },
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: 'type_collector',
    name: 'タイプコレクター',
    description: '全種類のトイレタイプを投稿しました',
    icon: '🏆',
    category: BadgeCategory.EXPLORATION,
    condition: {
      type: 'count',
      target: 'toilet_types_posted',
      value: 8, // 全8種類
    },
    rarity: BadgeRarity.RARE,
  },
  {
    id: 'accessibility_champion',
    name: 'バリアフリー推進者',
    description: '20件以上のバリアフリートイレを投稿しました',
    icon: '♿',
    category: BadgeCategory.EXPLORATION,
    condition: {
      type: 'count',
      target: 'accessible_toilets_posted',
      value: 20,
    },
    rarity: BadgeRarity.RARE,
  },

  // コミュニティ関連バッジ
  {
    id: 'early_adopter',
    name: 'アーリーアダプター',
    description: 'yotasの初期ユーザーです',
    icon: '🚀',
    category: BadgeCategory.COMMUNITY,
    condition: {
      type: 'special',
      target: 'registration_date',
      value: 1000, // 最初の1000ユーザー
    },
    rarity: BadgeRarity.EPIC,
  },
  {
    id: 'daily_contributor',
    name: '毎日の貢献者',
    description: '7日間連続で投稿しました',
    icon: '🔥',
    category: BadgeCategory.COMMUNITY,
    condition: {
      type: 'streak',
      target: 'daily_posts',
      value: 7,
    },
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: 'monthly_champion',
    name: '月間チャンピオン',
    description: '月間投稿数1位になりました',
    icon: '🏅',
    category: BadgeCategory.COMMUNITY,
    condition: {
      type: 'special',
      target: 'monthly_ranking',
      value: 1,
    },
    rarity: BadgeRarity.LEGENDARY,
  },

  // 特別バッジ
  {
    id: 'perfect_rating',
    name: 'パーフェクト評価',
    description: '全評価軸で5.0を獲得した投稿があります',
    icon: '✨',
    category: BadgeCategory.SPECIAL,
    condition: {
      type: 'special',
      target: 'perfect_rating_post',
      value: 1,
    },
    rarity: BadgeRarity.RARE,
  },
  {
    id: 'clean_champion',
    name: '清潔度チャンピオン',
    description: '清潔度評価の平均が4.5以上です（10件以上投稿）',
    icon: '🧼',
    category: BadgeCategory.SPECIAL,
    condition: {
      type: 'rating',
      target: 'avg_cleanliness_rating',
      value: 4.5,
    },
    rarity: BadgeRarity.EPIC,
  },
  {
    id: 'legend',
    name: 'yotas レジェンド',
    description: 'コミュニティへの多大な貢献が認められました',
    icon: '🌈',
    category: BadgeCategory.SPECIAL,
    condition: {
      type: 'special',
      target: 'manual_award',
      value: 1,
    },
    rarity: BadgeRarity.LEGENDARY,
  },
];

// レア度別の色定義
export const RARITY_COLORS = {
  [BadgeRarity.COMMON]: '#CD7F32', // ブロンズ
  [BadgeRarity.UNCOMMON]: '#C0C0C0', // シルバー
  [BadgeRarity.RARE]: '#FFD700', // ゴールド
  [BadgeRarity.EPIC]: '#E5E4E2', // プラチナ
  [BadgeRarity.LEGENDARY]: '#B9F2FF', // ダイヤモンド
};

// カテゴリ別の色定義
export const CATEGORY_COLORS = {
  [BadgeCategory.POSTING]: '#4285f4',
  [BadgeCategory.REVIEWING]: '#34A853',
  [BadgeCategory.EXPLORATION]: '#FBBC04',
  [BadgeCategory.COMMUNITY]: '#EA4335',
  [BadgeCategory.SPECIAL]: '#9C27B0',
};

// バッジIDでバッジを取得
export const getBadgeById = (id: string): Badge | undefined =>
  BADGES.find(badge => badge.id === id);

// カテゴリ別バッジを取得
export const getBadgesByCategory = (category: BadgeCategory): Badge[] =>
  BADGES.filter(badge => badge.category === category);

// レア度別バッジを取得
export const getBadgesByRarity = (rarity: BadgeRarity): Badge[] =>
  BADGES.filter(badge => badge.rarity === rarity);
