export type TrainingSettings = {
  showEnglish: boolean;
  showTranslation: boolean;
  showAssociation: boolean;
  showImage: boolean;
  showNotes: boolean;
  showFirstLetter: boolean;
  showWordLength: boolean;
  shuffleWords: boolean;
  bindings: {
    associationToWord: boolean;
    associationToImage: boolean;
    imageToWord: boolean;
    translationToWord: boolean;
    wordToTranslation: boolean;
  };
  ladder: {
    auto: boolean;
    totalSteps: 4 | 5 | 6;
    finalFirstLetter: boolean;
    finalWordLength: boolean;
    stepBackOnWrong: boolean;
    retryTypo: boolean;
  };
};

export const defaultTrainingSettings: TrainingSettings = {
  showEnglish: false,
  showTranslation: true,
  showAssociation: true,
  showImage: true,
  showNotes: false,
  showFirstLetter: true,
  showWordLength: true,
  shuffleWords: false,
  bindings: {
    associationToWord: true,
    associationToImage: true,
    imageToWord: true,
    translationToWord: true,
    wordToTranslation: false
  },
  ladder: {
    auto: true,
    totalSteps: 6,
    finalFirstLetter: false,
    finalWordLength: false,
    stepBackOnWrong: true,
    retryTypo: true
  }
};

export const trainingSettingsStorageKey = "word-memory-training-settings";

export function mergeTrainingSettings(value: Partial<TrainingSettings>): TrainingSettings {
  return {
    ...defaultTrainingSettings,
    ...value,
    bindings: {
      ...defaultTrainingSettings.bindings,
      ...value.bindings
    },
    ladder: {
      ...defaultTrainingSettings.ladder,
      ...value.ladder
    }
  };
}
