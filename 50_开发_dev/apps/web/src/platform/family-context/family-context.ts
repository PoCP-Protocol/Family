/**
 * WEB-ARCH-001 · Family Context。
 * current Person / Family / Subject 来自认证后的 whoami,而非 URL 参数。
 */
export interface WhoAmI {
  person_id: string;
  family_id: string;
  display_name?: string;
  subjects?: Array<{ subject_ref: string; display_name?: string }>;
}

export interface FamilyContext {
  personId: string;
  familyId: string;
  displayName: string | null;
  currentSubjectRef: string | null;
}

/** 从 whoami 派生上下文;无 subject 时 currentSubjectRef=null(由 onboarding 建立)。 */
export function deriveFamilyContext(who: WhoAmI): FamilyContext {
  return {
    personId: who.person_id,
    familyId: who.family_id,
    displayName: who.display_name ?? null,
    currentSubjectRef: who.subjects && who.subjects.length > 0 ? who.subjects[0].subject_ref : null,
  };
}
