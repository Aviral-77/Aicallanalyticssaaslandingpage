"""
Web search integration via Tavily.

Used to enrich extracted content with fresh, relevant context before
passing to the LLM — resulting in more accurate and timely social posts.

If TAVILY_API_KEY is not set the module gracefully returns empty results
so the rest of the pipeline continues unaffected.
"""

import asyncio
import os
from dataclasses import dataclass

from logger import Timer, search_log


@dataclass
class SearchResult:
    title: str
    url: str
    content: str
    score: float


def _search_sync(query: str, max_results: int) -> list[SearchResult]:
    """Synchronous Tavily call — runs in a thread pool."""
    from tavily import TavilyClient  # imported lazily so missing key doesn't crash startup

    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    response = client.search(
        query,
        max_results=max_results,
        search_depth="basic",
        include_answer=False,
    )
    return [
        SearchResult(
            title=r.get("title", ""),
            url=r.get("url", ""),
            content=r.get("content", ""),
            score=float(r.get("score", 0)),
        )
        for r in response.get("results", [])
    ]


async def search_web(query: str, max_results: int = 4) -> list[SearchResult]:
    """
    Search the web for `query` and return up to `max_results` snippets.

    Returns an empty list if TAVILY_API_KEY is missing or the call fails —
    so callers never have to guard against this.
    """
    if not os.getenv("TAVILY_API_KEY"):
        search_log.info("TAVILY_API_KEY not set — skipping web search")
        return []

    timer = Timer()
    try:
        results = await asyncio.to_thread(_search_sync, query, max_results)
        search_log.info(
            "search | query=%r | results=%d | elapsed_ms=%d",
            query, len(results), timer.elapsed_ms,
        )
        for r in results:
            search_log.debug("  result | score=%.3f | url=%s | title=%r", r.score, r.url, r.title)
        return results
    except Exception as exc:
        search_log.warning("search failed | query=%r | error=%s", query, exc)
        return []


def build_search_query(title: str, source_type: str) -> str:
    """Derive a focused search query from content title and type."""
    source_label = {
        "youtube": "video insights",
        "blog":    "key takeaways",
        "article": "analysis",
        "podcast": "podcast summary",
    }.get(source_type, "key insights")
    # Keep it tight — Tavily works best with concise queries
    return f"{title} {source_label}"


def format_search_context(results: list[SearchResult]) -> str:
    """Format search results into a context block for the LLM prompt."""
    if not results:
        return ""
    lines = ["Additional context from the web (use to add depth, not to replace the main content):"]
    for i, r in enumerate(results, 1):
        snippet = r.content[:400].strip()
        lines.append(f"\n[{i}] {r.title}\n{snippet}")
    return "\n".join(lines)
