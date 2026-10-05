export type DialogKey = "intro";

const DIALOGS: Record<DialogKey, string[][]> = {
  intro: [
    [
      "HELLO, PLAYER!",
      "LET'S GO?",
      "SHOOT THE TARGET,",
      "LEVEL UP SKILL,",
      "GROW BEYOND YOURSELF :)",
    ],
  ],
};

export function getDialogPages(key: DialogKey): string[][] {
  return DIALOGS[key] || [["..."]];
}
