// @ts-nocheck
/**
 * ARCH-GO-TEST-FULL-FUNCTION-001 · DEV_IMPLEMENTING · PROD_HOLD
 *
 * 多模态体验协议：仅展示本地合成 scenario 和动态状态；不采集麦克风、不上传文件、
 * 不请求外部模型、不训练，也不会把多模态内容写入 Need/Intent/Decision 事实链。
 */
export const MULTIMODAL_POLICY = Object.freeze({
  policy_version: 'multimodal-dev-synthetic.v1',
  allowed_sources: ['SYNTHETIC_TEXT', 'SYNTHETIC_AUDIO_VISUALIZATION', 'SYNTHETIC_IMAGE_SCENE'],
  prohibited_sources: ['LIVE_MICROPHONE', 'FILE_UPLOAD', 'CAMERA_CAPTURE', 'REAL_FAMILY_MEDIA', 'EXTERNAL_MODEL'],
  state_upper_bound: 'READ_ONLY_SYNTHETIC_EXPLANATION',
  training_used: false,
  external_model_called: false,
});

export const SYNTHETIC_MULTIMODAL_SCENARIOS = Object.freeze([
  {
    id: 'synthetic-text-dialogue',
    modality: 'TEXT',
    title: '文字情境：一次想重新开始的对话',
    summary: '一段完全合成的家庭对话片段，用于演示“从当下需要开始”的页面交互。',
    prompt: '“今天先停一停，等我们都准备好了再继续说。”',
    visual: 'text',
    permitted_output: '只显示可由家庭确认的支持入口说明；不形成诊断、标签或建议。',
  },
  {
    id: 'synthetic-audio-rhythm',
    modality: 'AUDIO',
    title: '语音情境：语速与停顿的可视化',
    summary: '一条合成节奏轨迹，用于演示音频材料入口的边界与动态反馈。',
    prompt: '未启用真实录音；页面仅播放合成波形动画和文字说明。',
    visual: 'waveform',
    permitted_output: '只显示“语音材料需要独立同意与治理”的说明；不转写、不判断情绪。',
  },
  {
    id: 'synthetic-image-scene',
    modality: 'IMAGE',
    title: '图像情境：一次家庭共同停下来的时刻',
    summary: '一幅不含真实人物身份的合成插画场景，用于演示图片材料入口。',
    prompt: '未启用真实图片上传、相册访问或人脸/生物特征处理。',
    visual: 'scene',
    permitted_output: '只显示图片材料的隐私边界和文本等价说明；不识别人物、不生成画像。',
  },
]);

export function getSyntheticMultimodalScenario(id) {
  return SYNTHETIC_MULTIMODAL_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}

export function simulateStructuredMaterialResult(scenario) {
  if (!scenario || !MULTIMODAL_POLICY.allowed_sources.includes(`SYNTHETIC_${scenario.modality === 'AUDIO' ? 'AUDIO_VISUALIZATION' : scenario.modality === 'IMAGE' ? 'IMAGE_SCENE' : 'TEXT'}`)) {
    return { safe_stop: true, template_id: 'REF-MULTIMODAL-SOURCE-NOT-ALLOWED', message: '当前材料来源不在内部演示允许范围内，因此不会继续处理。你可以返回或退出。' };
  }
  return {
    safe_stop: false,
    scenario_id: scenario.id,
    policy_version: MULTIMODAL_POLICY.policy_version,
    source_label: `SYNTHETIC_${scenario.modality}`,
    structured_assistance: '仅用于展示一个可解释的服务入口，不是事实结论、诊断、评分、标签或自动 Decision。',
    allowed_state_upper_bound: MULTIMODAL_POLICY.state_upper_bound,
    training_used: false,
    external_model_called: false,
    text_equivalent: `${scenario.title}。${scenario.summary}。${scenario.permitted_output}`,
  };
}

export function multimodalSafeStop(kind) {
  const copy = {
    LIVE_MICROPHONE: '当前内部演示不会启用真实录音或麦克风。你可以使用文字说明路径，或退出。',
    FILE_UPLOAD: '当前内部演示不会上传图片、音频或视频。你可以使用文字说明路径，或退出。',
    CAMERA_CAPTURE: '当前内部演示不会访问相机或处理人脸、生物特征。你可以返回或退出。',
    EXTERNAL_MODEL: '当前内部演示不会向外部模型发送材料，也不会训练或记忆家庭内容。你可以返回或退出。',
  };
  return {
    safe_stop: true,
    template_id: 'REF-MULTIMODAL-REAL-INPUT-NOT-ENABLED',
    message: copy[kind] ?? '当前材料不能进入内部演示处理流程。你可以返回或退出。',
    allowed_state_upper_bound: 'NONE',
    human_gate_required: kind === 'CAMERA_CAPTURE',
  };
}
