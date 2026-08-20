import {
  MultimodalAssistRequest,
  MultimodalAssistResponse,
  MultimodalContextSnapshot,
  validateMultimodalRequest,
} from './multimodal.contract';

export interface MultimodalRuntimePort {
  run(snapshot: MultimodalContextSnapshot): Promise<{ textEquivalent: string; artifactRef: string }>;
}

export interface MultimodalPolicyPort {
  resolveContext(input: MultimodalAssistRequest): Promise<MultimodalContextSnapshot | null>;
  recordBlocked(input: MultimodalAssistRequest, blockCode: string): Promise<void>;
}

export class MultimodalService {
  constructor(
    private readonly policy: MultimodalPolicyPort,
    private readonly runtime: MultimodalRuntimePort,
  ) {}

  async assist(input: MultimodalAssistRequest): Promise<MultimodalAssistResponse> {
    try {
      validateMultimodalRequest(input);
    } catch (error) {
      const blockCode = error instanceof Error ? error.message : 'MULTIMODAL_REQUEST_BLOCKED';
      await this.policy.recordBlocked(input, blockCode);
      return { status: 'BLOCKED', blockCode, textEquivalent: '当前材料无法处理，你仍可以使用文字方式继续，或选择退出。' };
    }

    const snapshot = await this.policy.resolveContext(input);
    if (!snapshot) {
      await this.policy.recordBlocked(input, 'MULTIMODAL_CONTEXT_UNAVAILABLE');
      return { status: 'UNAVAILABLE', blockCode: 'MULTIMODAL_CONTEXT_UNAVAILABLE', textEquivalent: '当前无法确认可用的家庭服务范围，请稍后重试或使用文字方式继续。' };
    }

    try {
      const result = await this.runtime.run(snapshot);
      return {
        status: 'DERIVED_DRAFT_PRIVATE',
        artifactRef: result.artifactRef,
        textEquivalent: result.textEquivalent,
      };
    } catch {
      await this.policy.recordBlocked(input, 'MULTIMODAL_RUNTIME_BLOCKED');
      return { status: 'BLOCKED', blockCode: 'MULTIMODAL_RUNTIME_BLOCKED', textEquivalent: '当前材料无法处理，未改变家庭记录；你可以改用文字方式继续。' };
    }
  }
}
