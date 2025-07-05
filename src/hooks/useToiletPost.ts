import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  ToiletPostForm,
  initialToiletPostForm,
  validateToiletPost,
  validateImages,
  ToiletRatings,
  DetailedToiletEquipment,
  ToiletInfo,
  initialToiletInfo,
} from '../types/post';
import { ToiletType, Coordinate } from '../types/maps';
import { useAuth } from '../stores/authStore';
import { firestoreService } from '../services/firestoreService';
import { useReport } from './useReport';

interface UseToiletPostState {
  form: ToiletPostForm;
  isLoading: boolean;
  errors: string[];
}

export const useToiletPost = () => {
  const { user } = useAuth();
  const { executeWithRestrictionCheck } = useReport();
  const [state, setState] = useState<UseToiletPostState>({
    form: initialToiletPostForm,
    isLoading: false,
    errors: [],
  });

  // フォームフィールドの更新
  const updateForm = useCallback((updates: Partial<ToiletPostForm>) => {
    setState(prev => ({
      ...prev,
      form: { ...prev.form, ...updates },
      errors: [], // エラーをクリア
    }));
  }, []);

  // 施設名の更新
  const updateFacilityTitle = useCallback(
    (facilityTitle: string) => {
      updateForm({ facilityTitle });
    },
    [updateForm],
  );

  // 施設説明の更新
  const updateFacilityDescription = useCallback(
    (facilityDescription: string) => {
      updateForm({ facilityDescription });
    },
    [updateForm],
  );

  // トイレタイプの更新
  const updateType = useCallback(
    (type: ToiletType) => {
      updateForm({ type });
    },
    [updateForm],
  );

  // 複数トイレ管理
  const addToilet = useCallback(() => {
    setState(prev => {
      const newToiletId = `toilet_${Date.now()}`;
      const newToilet: ToiletInfo = {
        ...initialToiletInfo,
        id: newToiletId,
        title: `トイレ${prev.form.toilets.length + 1}`,
      };

      return {
        ...prev,
        form: {
          ...prev.form,
          toilets: [...prev.form.toilets, newToilet],
        },
        errors: [],
      };
    });
  }, []);

  const removeToilet = useCallback((toiletId: string) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        toilets: prev.form.toilets.filter(toilet => toilet.id !== toiletId),
      },
      errors: [],
    }));
  }, []);

  const updateToilet = useCallback((toiletId: string, updates: Partial<ToiletInfo>) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        toilets: prev.form.toilets.map(toilet =>
          toilet.id === toiletId ? { ...toilet, ...updates } : toilet,
        ),
      },
      errors: [],
    }));
  }, []);

  // 位置情報の更新
  const updateLocation = useCallback(
    (location: Coordinate) => {
      updateForm({ location });
    },
    [updateForm],
  );

  // 特定トイレの設備情報を更新
  const updateToiletFacility = useCallback(
    (toiletIndex: number, facilityKey: string, value: boolean) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            facilities: {
              ...updatedToilets[toiletIndex].facilities,
              [facilityKey]: value,
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // 営業時間の更新
  const updateOpeningHours = useCallback((updates: Partial<ToiletPostForm['openingHours']>) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        openingHours: {
          ...prev.form.openingHours,
          ...updates,
        },
      },
      errors: [],
    }));
  }, []);

  // 追加情報の更新
  const updateAdditionalInfo = useCallback(
    (additionalInfo: string) => {
      updateForm({ additionalInfo });
    },
    [updateForm],
  );

  // 施設画像の追加
  const addImage = useCallback((imagePath: string) => {
    setState(prev => {
      const newImages = [...prev.form.facilityImages, imagePath];
      const validation = validateImages(newImages);

      if (!validation.isValid) {
        Alert.alert('エラー', validation.errors.join('\n'));
        return prev;
      }

      return {
        ...prev,
        form: {
          ...prev.form,
          facilityImages: newImages,
        },
        errors: [],
      };
    });
  }, []);

  // 施設画像の削除
  const removeImage = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        facilityImages: prev.form.facilityImages.filter((_, i) => i !== index),
      },
      errors: [],
    }));
  }, []);

  // 個別トイレ画像の追加
  const addToiletImage = useCallback((toiletId: string, imagePath: string) => {
    setState(prev => {
      const toiletIndex = prev.form.toilets.findIndex(t => t.id === toiletId);
      if (toiletIndex === -1) return prev;

      const toilet = prev.form.toilets[toiletIndex];
      const newImages = [...toilet.images, imagePath];
      const validation = validateImages(newImages);

      if (!validation.isValid) {
        Alert.alert('エラー', validation.errors.join('\n'));
        return prev;
      }

      return {
        ...prev,
        form: {
          ...prev.form,
          toilets: prev.form.toilets.map(t =>
            t.id === toiletId ? { ...t, images: newImages } : t,
          ),
        },
        errors: [],
      };
    });
  }, []);

  // 個別トイレ画像の削除
  const removeToiletImage = useCallback((toiletId: string, index: number) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        toilets: prev.form.toilets.map(t =>
          t.id === toiletId ? { ...t, images: t.images.filter((_, i) => i !== index) } : t,
        ),
      },
      errors: [],
    }));
  }, []);

  // バリデーション実行
  const validateForm = useCallback(() => {
    const validation = validateToiletPost(state.form);
    const facilityImageValidation = validateImages(state.form.facilityImages);

    // 各トイレの画像もバリデーション
    const toiletImageErrors: string[] = [];
    state.form.toilets.forEach((toilet, index) => {
      const toiletValidation = validateImages(toilet.images);
      if (!toiletValidation.isValid) {
        toiletImageErrors.push(
          ...toiletValidation.errors.map(error => `トイレ${index + 1}: ${error}`),
        );
      }
    });

    const allErrors = [
      ...validation.errors,
      ...facilityImageValidation.errors,
      ...toiletImageErrors,
    ];

    setState(prev => ({
      ...prev,
      errors: allErrors,
    }));

    return allErrors.length === 0;
  }, [state.form]);

  // フォーム送信（制限チェック付き）
  const submitForm = useCallback(async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return false;
    }

    // 制限チェック付きで実行
    return await executeWithRestrictionCheck(
      'post',
      async () => {
        // バリデーション
        if (!validateForm()) {
          Alert.alert('入力エラー', state.errors.join('\n'));
          throw new Error('Validation failed');
        }

        setState(prev => ({ ...prev, isLoading: true }));

        try {
          // Firestoreへの保存処理
          const toiletId = await firestoreService.createToilet(state.form, user.uid);

          console.log('Toilet created successfully:', toiletId);
          Alert.alert('成功', 'トイレ情報が投稿されました！');

          // フォームをリセット
          setState(prev => ({
            ...prev,
            form: initialToiletPostForm,
            isLoading: false,
            errors: [],
          }));
        } catch (error) {
          console.error('Submit error:', error);
          Alert.alert(
            'エラー',
            error instanceof Error ? error.message : '投稿に失敗しました。もう一度お試しください。',
          );
          setState(prev => ({ ...prev, isLoading: false }));
          throw error;
        }
      },
      'トイレの投稿',
    );
  }, [user, validateForm, state.errors, state.form, executeWithRestrictionCheck]);

  // フォームのリセット
  const resetForm = useCallback(() => {
    setState({
      form: initialToiletPostForm,
      isLoading: false,
      errors: [],
    });
  }, []);

  // 特定トイレの評価軸を更新
  const updateToiletRating = useCallback(
    (toiletIndex: number, ratingKey: keyof ToiletRatings, value: number) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            ratings: {
              ...updatedToilets[toiletIndex].ratings,
              [ratingKey]: value,
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // 特定トイレの詳細設備を更新
  const updateToiletDetailedEquipment = useCallback(
    (toiletIndex: number, updates: Partial<DetailedToiletEquipment>) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            detailedEquipment: {
              ...updatedToilets[toiletIndex].detailedEquipment,
              ...updates,
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // 特定トイレの男性用設備更新
  const updateToiletMaleEquipment = useCallback(
    (
      toiletIndex: number,
      updates: Partial<NonNullable<DetailedToiletEquipment['maleEquipment']>>,
    ) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          const currentEquipment = updatedToilets[toiletIndex].detailedEquipment;
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            detailedEquipment: {
              ...currentEquipment,
              maleEquipment: currentEquipment.maleEquipment
                ? {
                    ...currentEquipment.maleEquipment,
                    ...updates,
                  }
                : {
                    urinals: 0,
                    westernToilets: 0,
                    ...updates,
                  },
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // 特定トイレの女性用設備更新
  const updateToiletFemaleEquipment = useCallback(
    (
      toiletIndex: number,
      updates: Partial<NonNullable<DetailedToiletEquipment['femaleEquipment']>>,
    ) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          const currentEquipment = updatedToilets[toiletIndex].detailedEquipment;
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            detailedEquipment: {
              ...currentEquipment,
              femaleEquipment: currentEquipment.femaleEquipment
                ? {
                    ...currentEquipment.femaleEquipment,
                    ...updates,
                  }
                : {
                    japaneseToilets: 0,
                    westernToilets: 0,
                    ...updates,
                  },
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // 特定トイレの共用設備更新
  const updateToiletSharedEquipment = useCallback(
    (
      toiletIndex: number,
      updates: Partial<NonNullable<DetailedToiletEquipment['sharedEquipment']>>,
    ) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          const currentEquipment = updatedToilets[toiletIndex].detailedEquipment;
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            detailedEquipment: {
              ...currentEquipment,
              sharedEquipment: currentEquipment.sharedEquipment
                ? {
                    ...currentEquipment.sharedEquipment,
                    ...updates,
                  }
                : {
                    japaneseToilets: 0,
                    westernToilets: 0,
                    ...updates,
                  },
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // 特定トイレの追加機能更新
  const updateToiletAdditionalFeatures = useCallback(
    (
      toiletIndex: number,
      featureKey: keyof DetailedToiletEquipment['additionalFeatures'],
      value: boolean,
    ) => {
      setState(prev => {
        const updatedToilets = [...prev.form.toilets];
        if (updatedToilets[toiletIndex]) {
          updatedToilets[toiletIndex] = {
            ...updatedToilets[toiletIndex],
            detailedEquipment: {
              ...updatedToilets[toiletIndex].detailedEquipment,
              additionalFeatures: {
                ...updatedToilets[toiletIndex].detailedEquipment.additionalFeatures,
                [featureKey]: value,
              },
            },
          };
        }
        return {
          ...prev,
          form: {
            ...prev.form,
            toilets: updatedToilets,
          },
          errors: [],
        };
      });
    },
    [],
  );

  // エラーのクリア
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }));
  }, []);

  return {
    // 状態
    form: state.form,
    isLoading: state.isLoading,
    errors: state.errors,
    isValid: state.errors.length === 0,

    // アクション
    updateFacilityTitle,
    updateFacilityDescription,
    updateType,
    updateLocation,
    updateOpeningHours,
    updateAdditionalInfo,
    addToilet,
    removeToilet,
    updateToilet,
    addImage,
    removeImage,
    addToiletImage,
    removeToiletImage,
    validateForm,
    submitForm,
    resetForm,
    clearErrors,

    // 新しいトイレ固有のアクション
    updateToiletFacility,
    updateToiletRating,
    updateToiletDetailedEquipment,
    updateToiletMaleEquipment,
    updateToiletFemaleEquipment,
    updateToiletSharedEquipment,
    updateToiletAdditionalFeatures,

    // 後方互換性のための関数（最初のトイレに対する操作）
    updateTitle: (title: string) => updateToilet(0, { title }),
    updateDescription: (description: string) => updateToilet(0, { description }),
    updateAccessibility: (isAccessible: boolean) => updateToilet(0, { isAccessible }),
    updateFacility: (facilityKey: string, value: boolean) =>
      updateToiletFacility(0, facilityKey, value),
    updateRating: (ratingKey: keyof ToiletRatings, value: number) =>
      updateToiletRating(0, ratingKey, value),
    updateDetailedEquipment: (updates: Partial<DetailedToiletEquipment>) =>
      updateToiletDetailedEquipment(0, updates),
    updateMaleEquipment: (
      updates: Partial<NonNullable<DetailedToiletEquipment['maleEquipment']>>,
    ) => updateToiletMaleEquipment(0, updates),
    updateFemaleEquipment: (
      updates: Partial<NonNullable<DetailedToiletEquipment['femaleEquipment']>>,
    ) => updateToiletFemaleEquipment(0, updates),
    updateSharedEquipment: (
      updates: Partial<NonNullable<DetailedToiletEquipment['sharedEquipment']>>,
    ) => updateToiletSharedEquipment(0, updates),
    updateAdditionalFeatures: (
      featureKey: keyof DetailedToiletEquipment['additionalFeatures'],
      value: boolean,
    ) => updateToiletAdditionalFeatures(0, featureKey, value),
  };
};
