"""引用核验：把卡片里写的文献名目，拿去 Crossref 换成真实 DOI。

为什么必须有这一步：凭记忆写下的文献看上去和真文献一模一样。
未核验的引用在本体系里溯源为 `unverified`，按 evidence 的门禁不能用于下结论。
核验通过后才可升级为 `third_party_real`。

离线环境下 `verify()` 会返回 status="offline"，卡片保持 unverified —— 不会假装成功。
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict

CROSSREF = "https://api.crossref.org/works"
UA = "byresearch/0.1 (family-growth research module)"


@dataclass
class Match:
    status: str            # "ok" | "not_found" | "offline"
    doi: str = ""
    title: str = ""
    year: int | None = None
    container: str = ""
    score: float = 0.0
    query: str = ""

    def as_dict(self) -> dict:
        return asdict(self)


def verify(bibliographic: str, timeout: float = 20.0) -> Match:
    """用书目字符串查 Crossref，返回最佳匹配。

    bibliographic 建议写成 "作者 年份 标题" 的形式，命中率最高。
    """
    params = urllib.parse.urlencode(
        {
            "query.bibliographic": bibliographic,
            "rows": 1,
            "select": "DOI,title,issued,container-title,score",
        }
    )
    req = urllib.request.Request(f"{CROSSREF}?{params}", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return Match(status="offline", query=bibliographic)

    items = payload.get("message", {}).get("items") or []
    if not items:
        return Match(status="not_found", query=bibliographic)

    it = items[0]
    parts = (it.get("issued") or {}).get("date-parts") or [[None]]
    year = parts[0][0] if parts and parts[0] else None
    titles = it.get("title") or [""]
    containers = it.get("container-title") or [""]
    return Match(
        status="ok",
        doi=it.get("DOI", ""),
        title=titles[0] if titles else "",
        year=year,
        container=containers[0] if containers else "",
        score=float(it.get("score") or 0.0),
        query=bibliographic,
    )


def pending(lib) -> list[tuple[str, str]]:
    """列出所有待核验的引用：(卡片 id, 书目字符串)。

    只挑 source 看起来像文献名目、而不是 DOI/URL/本地路径的证据。
    """
    out = []
    for card in lib.cards.values():
        for ev in card.evidence:
            src = (ev.source or "").strip()
            if not src:
                continue
            if src.startswith(("10.", "http", "doi:", "D:\\", "/")):
                continue
            out.append((card.id, src))
    return out
