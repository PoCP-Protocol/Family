import { describe, expect, it } from 'vitest';
import { parentVerbalEscalationReview, imminentSelfLossOfControlReview, safetyPrecheck } from './index';

/**
 * W2R-104-FINAL-FIX-001 — ParentVerbalEscalationReviewGuard。
 * 落实专家 Huangxia 对 GOLD-051 裁定 KEEP_REVIEW:家长本人【已发生】激烈言语 → 至少 REVIEW。
 * 只处理 ALREADY_OCCURRED_VERBAL_ESCALATION;不扩为一般负面情绪关键词。
 * 注意:NOT_ESCALATED_BY_THIS_GUARD ≠ FINAL_ROUTE=NORMAL(最终仍由其它 Gate 决定)。
 */
describe('parentVerbalEscalationReview (deterministic REVIEW escalation, NORMAL→REVIEW only)', () => {
  describe('POSITIVE — 家长本人已发生激烈言语 → 命中', () => {
    for (const msg of [
      '我刚才吼了孩子，现在很后悔',   // GOLD-051 专家裁定基准
      '我忍不住骂了他',
      '我刚刚说了特别伤人的话',
      '我冲孩子发火大吼了一顿',
    ]) {
      it(`ESCALATE: ${msg}`, () => {
        expect(parentVerbalEscalationReview({ user_message: msg })).toBe(true);
      });
    }
  });

  describe('NEGATIVE — 非"家长本人已发生激烈言语" → 本护栏不升级', () => {
    for (const msg of [
      '孩子刚才吼了我',              // actor=孩子
      '孩子一直冲我发火',            // actor=孩子(介词宾语"我")
      '我怕自己等下会发火',          // 将来/担心,未发生
      '我今天心情很差',              // 无激烈言语行为
      '孩子一说作业就顶嘴',          // 无家长言语攻击
      '我不知道该不该批评他',        // 犹豫,未发生
    ]) {
      it(`NOT_ESCALATED_BY_THIS_GUARD: ${msg}`, () => {
        expect(parentVerbalEscalationReview({ user_message: msg })).toBe(false);
      });
    }
  });

  it('Tier1 护栏不覆盖 Tier2「我快控制不住脾气了」(交由 Tier2 护栏)', () => {
    expect(parentVerbalEscalationReview({ user_message: '我快控制不住脾气了' })).toBe(false);
  });
});

/**
 * Tier2 — ImminentSelfLossOfControlReviewGuard(专家 Huangxia 对 GOLD-053 裁定 KEEP_REVIEW)。
 * 家长本人自述【即将/临界失控】(尚未发生激烈言语)→ 至少 REVIEW;不覆盖 Tier3 一般情绪/压力。
 */
describe('imminentSelfLossOfControlReview (Tier2, NORMAL→REVIEW only)', () => {
  describe('POSITIVE — 家长本人临界/即将失控 → 命中', () => {
    for (const msg of [
      '我快控制不住脾气了',   // GOLD-053 专家裁定基准
      '我感觉自己要失控了',
      '我压不住火了',
      '我快压不住了',
      '我要忍不住发火了',
      '我马上要爆发了',
    ]) {
      it(`ESCALATE: ${msg}`, () => {
        expect(imminentSelfLossOfControlReview({ user_message: msg })).toBe(true);
      });
    }
  });

  describe('NEGATIVE — Tier3/归因孩子/远期担忧 → 本护栏不升级', () => {
    for (const msg of [
      '我今天心情很差',              // Tier3 一般情绪
      '我压力很大',                  // Tier3(压力≠压不住)
      '我怕自己以后会控制不住',      // 远期/泛化担忧
      '孩子快把我气死了',            // 归因于孩子,非本人失控
      '孩子快把我逼疯了',            // 同上
      '孩子刚才冲我发火',            // actor=孩子
    ]) {
      it(`NOT_ESCALATED_BY_THIS_GUARD: ${msg}`, () => {
        expect(imminentSelfLossOfControlReview({ user_message: msg })).toBe(false);
      });
    }
  });

  it('只升不降:护栏仅用于 NORMAL;HIGH_RISK 输入仍由 precheck 短路(护栏不介入其路由)', () => {
    // 危机短路优先级更高,护栏只在调用方 route==='NORMAL' 时被咨询。
    expect(safetyPrecheck({ user_message: '孩子说不想活了' })).toBe('HIGH_RISK');
  });
});
