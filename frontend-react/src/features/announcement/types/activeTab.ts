export enum ACTIVE_TAB {
  SUMMARY = "summary",
  QA = "qa",
  MEMO = "memo",
}
export type ActiveTabType = (typeof ACTIVE_TAB)[keyof typeof ACTIVE_TAB];
