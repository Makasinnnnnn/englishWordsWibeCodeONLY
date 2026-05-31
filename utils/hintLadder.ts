export type HintVisibility = {
  showEnglish: boolean;
  showTranslation: boolean;
  showAssociation: boolean;
  showImage: boolean;
  showNotes: boolean;
  showFirstLetter: boolean;
  showWordLength: boolean;
  requireManualInput: boolean;
};

export function getHintVisibility(step: number, totalSteps: number): HintVisibility {
  const boundedTotal = Math.min(Math.max(totalSteps, 4), 6);
  const boundedStep = Math.min(Math.max(step, 1), boundedTotal);

  if (boundedStep === 1) {
    return {
      showEnglish: true,
      showTranslation: true,
      showAssociation: true,
      showImage: true,
      showNotes: true,
      showFirstLetter: false,
      showWordLength: true,
      requireManualInput: false
    };
  }

  if (boundedStep === boundedTotal) {
    return {
      showEnglish: false,
      showTranslation: true,
      showAssociation: false,
      showImage: false,
      showNotes: false,
      showFirstLetter: false,
      showWordLength: false,
      requireManualInput: true
    };
  }

  if (boundedStep === boundedTotal - 1) {
    return {
      showEnglish: false,
      showTranslation: true,
      showAssociation: false,
      showImage: false,
      showNotes: false,
      showFirstLetter: true,
      showWordLength: true,
      requireManualInput: true
    };
  }

  if (boundedStep === 2) {
    return {
      showEnglish: false,
      showTranslation: true,
      showAssociation: true,
      showImage: true,
      showNotes: true,
      showFirstLetter: true,
      showWordLength: true,
      requireManualInput: false
    };
  }

  if (boundedStep === 3) {
    return {
      showEnglish: false,
      showTranslation: true,
      showAssociation: true,
      showImage: false,
      showNotes: true,
      showFirstLetter: true,
      showWordLength: true,
      requireManualInput: false
    };
  }

  return {
    showEnglish: false,
    showTranslation: true,
    showAssociation: false,
    showImage: false,
    showNotes: true,
    showFirstLetter: true,
    showWordLength: true,
    requireManualInput: false
  };
}
