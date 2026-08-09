import { Injectable } from '@nestjs/common';
import type { AuditMeta } from '@family/contracts';

/**
 * 审计基础(TASK-001 AC8):接受 actor / correlationId / source 元数据。
 * bootstrap 阶段以结构化日志落地;后续 Sprint 接 outbox/audit 表(database/0002)。
 */
@Injectable()
export class AuditService {
  record(action: string, meta: AuditMeta, payload: Record<string, unknown> = {}): void {
    const entry = {
      kind: 'AUDIT',
      action,
      actor: meta.actor,
      correlationId: meta.correlationId,
      source: meta.source,
      occurredAt: meta.occurredAt,
      payload,
    };
    console.log(JSON.stringify(entry));
  }
}
