/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 编排域仓储(自有 pg pool + 事务)。
 * 只写编排 NON_CANONICAL 表(0020);绝不写 GrowthPriority/GrowthAction/OutcomeObservation。
 * 读取 consents/persons/life_stage 仅为构建 Eligibility 上下文 + subject 校验(只读,不复制真相)。
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export interface EligibilityFacts {
  serviceConsentGranted: boolean;
  aiPersonalizationConsentGranted: boolean;
  ageInScope: boolean;              // 严格 12–15;不可证=false
}

export interface SubjectCheck {
  exists: boolean;
  isChild: boolean;
  inFamily: boolean;
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

  private ageFromBirthDate(bd: Date | string | null): number | null {
    let birthYear = NaN, birthMonth = 1, birthDay = 1;
    if (bd instanceof Date) { birthYear = bd.getFullYear(); birthMonth = bd.getMonth() + 1; birthDay = bd.getDate(); }
    else if (typeof bd === 'string') { birthYear = Number(bd.slice(0, 4)); birthMonth = Number(bd.slice(5, 7)) || 1; birthDay = Number(bd.slice(8, 10)) || 1; }
    if (!Number.isFinite(birthYear)) return null;
    const now = new Date();
    let age = now.getFullYear() - birthYear;
    const m = (now.getMonth() + 1) - birthMonth;
    if (m < 0 || (m === 0 && now.getDate() < birthDay)) age -= 1;
    return age;
  }

  /** subject 必须存在、属于该家庭、是 CHILD、且年龄严格 12–15(否则各项 false,fail closed)。 */
  async checkSubject(familyId: string, subjectPersonId: string): Promise<SubjectCheck> {
    const r = await this.pool.query<{ family_id: string; person_type: string; birth_date: Date | string | null }>(
      `select family_id, person_type, birth_date from persons where person_id=$1 limit 1`, [subjectPersonId],
    );
    const row = r.rows[0];
    if (!row) return { exists: false, isChild: false, inFamily: false, ageInScope: false };
    const inFamily = row.family_id === familyId;
    const isChild = row.person_type === 'CHILD';
    // 优先精确 birth_date 年龄;否则用显式 life-stage(EARLY_ADOLESCENCE_12_15)证明;都不可证=false。
    let ageInScope = false;
    const age = this.ageFromBirthDate(row.birth_date);
    if (age != null) ageInScope = age >= 12 && age <= 15;
    else {
      const ls = await this.pool.query(
        `select 1 from life_stage_assignments where family_id=$1 and child_id=$2 and life_stage_code='EARLY_ADOLESCENCE_12_15' limit 1`,
        [familyId, subjectPersonId],
      );
      ageInScope = (ls.rowCount ?? 0) >= 1;
    }
    return { exists: true, isChild, inFamily, ageInScope };
  }

  /** 读取构建 Eligibility 所需的时变事实(两 consent + age)。T1 与 T2 各调用一次。 */
  async loadEligibilityFacts(familyId: string, subjectPersonId: string): Promise<EligibilityFacts> {
    const consentRows = await this.pool.query<{ purpose: string }>(
      `select purpose from consents
        where family_id=$1 and subject_person_id=$2 and purpose in ('SERVICE','AI_PERSONALIZATION') and status='GRANTED'`,
      [familyId, subjectPersonId],
    );
    const granted = new Set(consentRows.rows.map((r) => r.purpose));
    const subj = await this.checkSubject(familyId, subjectPersonId);
    return {
      serviceConsentGranted: granted.has('SERVICE'),
      aiPersonalizationConsentGranted: granted.has('AI_PERSONALIZATION'),
      ageInScope: subj.ageInScope,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
