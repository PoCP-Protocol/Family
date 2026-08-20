/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 需求分类(确定性,可检视规则;无 ML/无 embeddings/无 LLM)。
 * V1 仅支持 PARENT_CHILD_COMMUNICATION_CONFLICT;未知需求不臆造类别,返回 null(走安全 unsupported/NO_ACTION)。
 * 输出的能力集合固定小集:{DE_ESCALATION, COMMUNICATION_REOPENING}。绝不诊断/贴标签。
 */
import type { GrowthCapabilityKey, GrowthNeedType } from '@family/contracts';

export interface NeedClassification {
  need_type: GrowthNeedType | null;   // null=当前纵切不支持(不臆造)
  required_capability_keys: GrowthCapabilityKey[];
  confidence: number;                 // 0..1(确定性规则命中数的粗粒度映射,非概率模型)
}

// 亲子沟通冲突的确定性触发词(冲突/情绪 + 沟通/开口 语义)。仅用于路由,不作诊断。
const CONFLICT_TERMS = ['吵', '冲突', '摔门', '争', '发脾气', '闹', '不理', '沉默', '顶嘴', '生气', '吼'];
const REOPEN_TERMS = ['重新开口', '怎么说', '沟通', '开口', '聊', '谈', '说话', '和好', '缓和'];

function hits(text: string, terms: readonly string[]): number {
  let n = 0;
  for (const t of terms) if (text.includes(t)) n += 1;
  return n;
}

/** 分类家长自述文本。命中冲突语义→PARENT_CHILD_COMMUNICATION_CONFLICT + 两能力;否则 null。 */
export function classifyNeed(rawText: string): NeedClassification {
  const text = (rawText ?? '').trim();
  const conflict = hits(text, CONFLICT_TERMS);
  const reopen = hits(text, REOPEN_TERMS);
  if (conflict === 0 && reopen === 0) {
    return { need_type: null, required_capability_keys: [], confidence: 0 };
  }
  // 冲突信号 → 需要先降温(DE_ESCALATION);有"重新开口/沟通"意图 → 需要重启对话(COMMUNICATION_REOPENING)。
  const caps: GrowthCapabilityKey[] = [];
  if (conflict > 0) caps.push('DE_ESCALATION');
  if (reopen > 0 || conflict > 0) caps.push('COMMUNICATION_REOPENING');
  const uniqueCaps = Array.from(new Set(caps));
  const confidence = Math.min(1, (conflict + reopen) / 4);
  return { need_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT', required_capability_keys: uniqueCaps, confidence };
}
