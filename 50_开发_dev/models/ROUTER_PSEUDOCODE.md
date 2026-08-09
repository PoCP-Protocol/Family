# Model Router Pseudocode

```ts
function route(req: ModelRequest): RouteDecision {
  const policy = resolvePolicy(req.taskType, req.taskRisk, req.dataClass);

  const candidates = registry.models
    .filter(m => allowedByDataClass(m, req.dataClass))
    .filter(m => hasCapabilities(m, policy.requiredCapabilities))
    .filter(m => passesBlockingEval(m, req.evalProfile));

  if (!candidates.length) {
    return { type: "ABSTAIN", reason: "NO_APPROVED_MODEL" };
  }

  const ranked = candidates
    .map(m => ({ model: m, score: weightedScore(m, req) }))
    .sort(desc("score"));

  return {
    type: "ROUTE",
    primary: ranked[0].model,
    fallbacks: policy.fallbackAllowed ? ranked.slice(1, 3).map(x => x.model) : [],
    humanGateRequired: req.taskRisk === "HIGH" || policy.humanGateRequired,
  };
}
```

## 路由不是只按价格
优先级：
1. 数据权限
2. Safety blocking threshold
3. Professional quality
4. Grounding
5. Latency / Cost
