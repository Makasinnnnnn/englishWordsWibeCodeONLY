import { describe, expect, it } from "vitest";

import { getHintVisibility } from "./hintLadder";

describe("getHintVisibility", () => {
  it("shows all hints on the first step", () => {
    expect(getHintVisibility(1, 6)).toMatchObject({
      showEnglish: true,
      showTranslation: true,
      showAssociation: true,
      showImage: true,
      showNotes: true,
      requireManualInput: false
    });
  });

  it("hides the word on step two", () => {
    expect(getHintVisibility(2, 6)).toMatchObject({
      showEnglish: false,
      showImage: true,
      showAssociation: true
    });
  });

  it("requires manual input on the final step", () => {
    expect(getHintVisibility(6, 6)).toMatchObject({
      showEnglish: false,
      showTranslation: true,
      showImage: false,
      showAssociation: false,
      requireManualInput: true
    });
  });
});
