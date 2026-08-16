/**
 * @family/program-runtime · Program Resource Provider(共享包)。
 * Program Runtime 是【一种可被平台编排的 Program Resource】,不是平台中心。
 * 只管:内容 ref / 节奏 / 交付检查点 / 进度投影;绝不拥有 Family Fact / GrowthPriority / GrowthAction / Observation / Review 真相。
 * 消费方:Consumer Web / Ops / Service Orchestrator / Notifications / Reports —— 均消费本包,浏览器不再是 SSOT。
 */
export * from './program-types';
export * from './program-runtime';
export { COMMUNICATION_21DAY } from './communication-21day';
