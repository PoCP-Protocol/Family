/**
 * MM1-B1.1 · Avatar Composition Root (§J)
 *
 * FamilyLocal2DAvatarGateway 是唯一自持真实数字人。此 root 保留矩阵结构,
 * 以便未来 (通过配置) 允许接入其它 avatar provider,但业务代码不会散 if 分支。
 */

import { FakeAvatarGateway, type AvatarGateway } from '../../index';
import { FamilyLocal2DAvatarGateway } from '../familyLocal2d';

export type AvatarCompositionMode =
  | 'FAKE'
  | 'FAMILY_LOCAL_2D'
  | 'BLOCKED_UNSUPPORTED';

export interface AvatarCompositionResult {
  mode: AvatarCompositionMode;
  avatar: AvatarGateway | null;
  provider_id: string | null;
  telemetry: {
    AVATAR_MODE: AvatarCompositionMode;
    IDENTITY_LOCK: 'TRUE' | 'FALSE';
  };
  reason?: string;
}

export interface AvatarCompositionOptions {
  env?: NodeJS.ProcessEnv;
}

export function buildAvatarComposition(opts: AvatarCompositionOptions = {}): AvatarCompositionResult {
  const env = opts.env ?? process.env;
  const raw = (env.FPAI_AVATAR_PROVIDER ?? 'FAMILY_LOCAL_2D').toString().toUpperCase();
  // 兼容 registry 命名 avatar.fake_baseline / avatar.family_local_2d
  const preferred = raw
    .replace(/^AVATAR\./, '')
    .replace(/_BASELINE$/, '')
    .replace(/^FAMILY_LOCAL_2D$/, 'FAMILY_LOCAL_2D');

  if (preferred === 'FAKE') {
    return {
      mode: 'FAKE',
      avatar: new FakeAvatarGateway(),
      provider_id: 'avatar.fake',
      telemetry: { AVATAR_MODE: 'FAKE', IDENTITY_LOCK: 'FALSE' },
    };
  }
  if (preferred === 'FAMILY_LOCAL_2D') {
    return {
      mode: 'FAMILY_LOCAL_2D',
      avatar: new FamilyLocal2DAvatarGateway(),
      provider_id: 'avatar.family_local_2d',
      telemetry: { AVATAR_MODE: 'FAMILY_LOCAL_2D', IDENTITY_LOCK: 'TRUE' },
    };
  }
  return {
    mode: 'BLOCKED_UNSUPPORTED',
    avatar: null,
    provider_id: null,
    telemetry: { AVATAR_MODE: 'BLOCKED_UNSUPPORTED', IDENTITY_LOCK: 'FALSE' },
    reason: `unsupported avatar provider: ${preferred}`,
  };
}
