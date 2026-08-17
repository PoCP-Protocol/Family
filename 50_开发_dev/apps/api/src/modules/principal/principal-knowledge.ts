/**
 * W2R-103B:编译知识 bundle 加载器(api 侧 glue)。
 * principal-ai 保持纯函数(不读文件);由本模块从 knowledge/compiled 读入 bundle,
 * 交 retrieveGroundedKnowledge 产出 GroundedKnowledge,注入实时模型输入。
 * 找不到 bundle → grounded=false 空引用(不空谈、不编造)。
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { retrieveGroundedKnowledge, type GroundedKnowledge, type KnowledgeChainBundle } from '@family/principal-ai';

// intervention_id → 编译文件名(仅 LISTEN_BEFORE_RESPOND,W2R-103B 不扩知识主题)
const COMPILED_SLUG: Record<string, string> = {
  LISTEN_BEFORE_RESPOND: 'listen_before_respond',
};

/** 从当前模块位置向上查找 knowledge/compiled 目录(兼容 ts-node/src 与 dist)。 */
function findCompiledDir(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 12; i += 1) {
    const candidate = join(dir, 'knowledge', 'compiled');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const bundleCache = new Map<string, KnowledgeChainBundle | null>();

function loadBundle(interventionId: string): KnowledgeChainBundle | null {
  if (bundleCache.has(interventionId)) return bundleCache.get(interventionId) ?? null;
  let bundle: KnowledgeChainBundle | null = null;
  const slug = COMPILED_SLUG[interventionId];
  if (slug) {
    try {
      const dir = findCompiledDir(__dirname);
      const file = dir ? join(dir, `${slug}.json`) : null;
      if (file && existsSync(file)) bundle = JSON.parse(readFileSync(file, 'utf8')) as KnowledgeChainBundle;
    } catch {
      bundle = null; // 读/解析失败 → 安全退化为无 grounding
    }
  }
  bundleCache.set(interventionId, bundle);
  return bundle;
}

/** 取某 intervention 的循证链;找不到/失败 → grounded=false(FAIL SAFE,不编造)。 */
export function loadGroundedKnowledge(interventionId: string): GroundedKnowledge {
  return retrieveGroundedKnowledge(loadBundle(interventionId), interventionId);
}
