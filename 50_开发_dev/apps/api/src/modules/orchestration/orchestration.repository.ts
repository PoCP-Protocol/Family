/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 编排域仓储(自有 pg pool + 事务)。
 * 只写编排 NON_CANONICAL 表(0020);绝不写 GrowthPriority/GrowthAction/OutcomeObservation。
 * 读取 consents/persons 仅为构建 Eligibility 上下文(只读,不复制真相)。
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export interface EligibilityFacts {
  aiPersonalizationConsentGranted: boolean;
  subjectExists: boolean;
  ageInScope: boolean;
}

@Injectable()
export class OrchestrationRepository implements OnModuleDestroy {
  private readonly pool: pg.Pool;
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({ connectionString });
  }

  async withTransaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(client);
      await client.query('commit');
      return result;
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
  }

  query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[]): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params as never[]);
  }

  /** 读取构建 Eligibility 所需的时变事实(consent / subject / age)。T1 与 T2 各调用一次。 */
  async loadEligibilityFacts(familyId: string, subjectPersonId: string): Promise<EligibilityFacts> {
    const consent = await this.pool.query(
      `select 1 from consents
        where family_id=$1 and subject_person_id=$2 and purpose='AI_PERSONALIZATION' and status='GRANTED' limit 1`,
      [familyId, subjectPersonId],
    );
    const person = await this.pool.query<{ birth_date: string | null }>(
      `select birth_date from persons where person_id=$1 and family_id=$2 and person_type='CHILD' limit 1`,
      [subjectPersonId, familyId],
    );
    const subjectExists = (person.rowCount ?? 0) >= 1;
    // V1 纵切:12–15。若有 birth_date 则粗判年龄区间;缺失时按当前纵切默认 in-scope(life-stage 已在 onboarding 捕获)。
    let ageInScope = true;
    const bd = person.rows[0]?.birth_date;
    if (bd) {
      const birthYear = Number(bd.slice(0, 4));
      if (Number.isFinite(birthYear)) {
        // 不使用不可用的 Date.now();仅当明显越界(<8 或 >18 岁,按纵切年份 2026 粗算)时判 out-of-scope。
        const approxAge = 2026 - birthYear;
        ageInScope = approxAge >= 8 && approxAge <= 18;
      }
    }
    return {
      aiPersonalizationConsentGranted: (consent.rowCount ?? 0) >= 1,
      subjectExists,
      ageInScope,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
