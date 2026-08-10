# WAF WF1 Emotional Hero V3

Date: 2026-08-11
Scope: `We are 伐木累` WF1 consumer UI
Result: PASS_LOCAL_UI

## Outcome

The first screen now leads with one recognisable family moment instead of a product explanation: a parent and teenager both want to reconnect after a disagreement but do not know how to begin. The interface offers one small next step — listening to one complete sentence — before introducing the challenge or tools.

## Multimodal Composition

- Visual: an original editorial-gouache family scene generated with the built-in ImageGen workflow and stored at `apps/web/src/assets/waf-hero-emotional-v3.png`.
- Motion: slow scene breathing, a travelling connection point between the two people, and alternating parent/child perspective captions.
- Language: a softer display typeface, two-line emotional headline, and action copy centred on listening rather than correcting.
- Audio: optional 60-second browser speech guidance with visible transcript, explicit play/pause control, and no autoplay.
- Interaction: relationship-weather selection adapts the exercise for calm, tension, or a requested pause.

The two quotations are explicitly labelled as “a possible feeling”. They are illustrative prompts, not inferred facts, diagnoses, or analysis of a real family member.

## ImageGen Prompt Summary

Create a cinematic editorial-gouache hero scene of a Chinese parent and teenager sharing the same room after a small disagreement. Both want to reconnect but do not know how. Use warm cream, forest green, dusty blue, and clay at blue-gold dusk; keep generous negative space on the left for interface copy; avoid text, screens, yelling, pointing, punishment imagery, or exaggerated distress.

## Responsive Decisions

- Desktop keeps the emotional copy on the left and the relationship scene on the right.
- Mobile uses a dedicated `68% → 72%` background-position animation so both people remain visible; it does not inherit the desktop crop.
- The mobile headline is two lines, the primary action remains above the fold, and the relationship scene begins at about 495 px in a 390 × 844 viewport.
- Perspective captions avoid faces and alternate instead of competing for attention.
- `prefers-reduced-motion` continues to suppress non-essential animation through the existing global rule.

## Verification

- Web tests: 22/22 passed.
- TypeScript: `tsc --noEmit` passed.
- Patch hygiene: `git diff --check` passed.
- Desktop browser: 1440 × 1000, no horizontal overflow, two-line headline, hero asset and all three motion layers active.
- Mobile browser: 390 × 844, no horizontal overflow, two-line headline, both people visible, primary CTA above the fold.
- CTA browser check: `从先听完一句开始` scrolls to `#waf-studio`.
- State browser check: selecting `暂时不想说` produces a pause-safe prompt and `aria-checked="true"`.
- Audio browser check: explicit play starts the guide; pause remains available; transcript and privacy boundary remain visible.

## Evidence

- [Desktop emotional hero](artifacts/wf1-ui-20260811-emotional-hero/desktop-emotional-hero-final.png)
- [Mobile emotional hero](artifacts/wf1-ui-20260811-emotional-hero/mobile-emotional-hero-final.png)
- [Mobile multimodal studio — pause state](artifacts/wf1-ui-20260811-emotional-hero/mobile-multimodal-studio-pause.png)

## Residual Risks

- The generated hero PNG is about 2.7 MB and should later receive AVIF/WebP derivatives and responsive `srcset` delivery.
- Emotional resonance has been visually reviewed but not yet validated with real parent/teen first-impression interviews.
- Browser speech synthesis voice quality varies by operating system and installed language voices.
