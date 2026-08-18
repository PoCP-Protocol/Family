# ByteDance / 抖音式数据建模研究事实摘要

## Sources

1. ByteDance Monolith official repository: https://github.com/bytedance/monolith
2. Monolith paper abstract and metadata: https://arxiv.org/abs/2209.07663
3. Monolith paper HTML full text: https://ar5iv.labs.arxiv.org/html/2209.07663

## Verified facts

The official ByteDance Monolith repository describes Monolith as a deep learning framework for large-scale recommendation modeling. Its README highlights two relevant capabilities: collisionless embedding tables for unique representation of different ID features, and real-time training to capture recent trends and interests. The repository states that it supports batch/real-time training and serving. The public repository was archived on 2025-10-13 and is now read-only; this is a source-status fact, not a claim that Family should copy its implementation.

The Monolith paper describes recommendation workloads as dominated by sparse, categorical and dynamically changing features, with non-stationary distributions/concept drift. It separates dense and sparse parameters, uses a dynamic collisionless hash table for sparse IDs, applies filtering/expiration for low-frequency or stale IDs, and closes the serving-feedback-training loop through online training. The architecture includes workers, parameter servers, model serving and a streaming engine. The paper explicitly discusses trade-offs between real-time learning and system reliability.

## Family translation, not direct copying

Family should borrow the separation between stable object identity and dynamic behavior features, the explicit feedback/interaction facts, time-aware expiration, online projection/feature freshness, and distinct serving/read paths. Family must not copy ByteDance user profiling or expose child/family embeddings as permanent labels. Family behavior data must remain tenant/family scoped, consent-bound, purpose-limited and revocable. The initial Family implementation should use deterministic event facts and bounded ephemeral context rather than online model training.

Recommended Family layers inspired by the findings:

| Layer | Family interpretation | Prohibited interpretation |
|---|---|---|
| Stable catalog/master | ResourceAsset, ServiceOffering, Activity, ProductOffering, Provider, policy and schema objects | Dynamic behavior treated as master data |
| Interaction facts | page_view, candidate_opened, explain_requested, decision, no_action, booking/test operation events | Child score, family ranking or permanent profile |
| Stream/projection | near-real-time read-model refresh, audit and bounded LLM context refresh | Cross-family learning or unapproved external sharing |
| Dynamic feature/context | short-lived consented preferences and recent session context | Permanent child/family embeddings or public persona |
| Serving layer | Gateway + Read Model + tool policy + validator | Direct model/provider bypass or unrestricted recommendation |
| Expiration | retention and purpose-based expiry for interaction/context data | Indefinite retention by default |

## Design conclusion

The useful ByteDance pattern for Family is not “build a TikTok recommender.” It is to distinguish stable master data from rapidly changing interaction facts, build a bounded event-to-projection loop, keep context fresh and expirable, and separate serving from training. Family remains AI-native but must keep training/fine-tuning/self-learning HOLD; DEV/TEST may run real LLM inference with synthetic/test data only, and all API keys remain env/secret injected without storage or echo.

## Additional public findings: graph and multi-scenario systems

TTGL, a TikTok multi-scenario universal graph learning paper published in KDD 2025, describes a heterogeneous graph that links behaviors across video, search, live streaming and e-commerce scenarios and produces shared representations for multiple serving contexts. The paper reports that its graph system handles very large node/edge volumes and feeds graph representations into online serving pipelines. The quantitative improvements in the paper are research results for TikTok and are not evidence for Family educational outcomes.

GraphScale, a ByteDance paper published at CIKM 2024, describes separating workers that store graph data from workers that perform training, allowing data fetching and computation to overlap asynchronously. The paper reports production deployment at TikTok; the engineering pattern relevant to Family is the separation of durable data storage, feature/context computation and serving projections, not the scale or model itself.

## Family adaptation

Family should model cross-scenario relationships as typed, consented interaction facts and bounded graph projections rather than a single universal family embedding. A shared graph may connect an admitted resource, a family Need, a selected Decision, a service offering, an activity and a learning artifact, but each edge must carry tenant_id, family_id where applicable, purpose, source, consent scope, created_at, expires_at and visibility. Cross-family graph edges are prohibited in the current product boundary.

Family can adopt a storage/compute/serving separation at the modular-monolith level: PostgreSQL base facts remain authoritative; a projection builder computes bounded read models; the LLM Gateway serves only a minimal validated context snapshot. No online training, fine-tuning or self-learning is introduced by this research. Dynamic context expires and is revocable; it cannot become a permanent child/family label or public profile.

## Additional references

4. TTGL: Large-scale Multi-scenario Universal Graph Learning at TikTok, ACM KDD 2025: https://dl.acm.org/doi/10.1145/3711896.3737269
5. GraphScale: A Framework to Enable Machine Learning over Billion-node Graphs, ACM CIKM 2024: https://dl.acm.org/doi/10.1145/3627673.3680021
6. GraphScale arXiv record: https://arxiv.org/abs/2407.15452
