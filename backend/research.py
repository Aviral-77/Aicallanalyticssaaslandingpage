"""
Topic research module — runs multiple parallel Tavily searches to build
a rich context block for topic-based post and carousel generation.

If TAVILY_API_KEY is not set, returns a minimal context string so the
LLM can still generate from its own training knowledge.
"""

import asyncio
from dataclasses import dataclass

from logger import Timer, search_log
from search import SearchResult, search_web


@dataclass
class ResearchContext:
    context_str: str
    results: list[SearchResult]


async def research_topic(topic: str) -> ResearchContext:
    """
    Run 3 parallel Tavily searches on different facets of the topic.
    Deduplicates by URL and formats into a context block.
    """
    queries = [
        topic,
        f"{topic} statistics data 2024 2025",
        f"{topic} best practices insights examples",
    ]

    timer = Timer()
    search_log.info("research_topic | topic=%r | queries=%d", topic, len(queries))

    # Run all queries concurrently
    all_result_lists: tuple[list[SearchResult], ...] = await asyncio.gather(
        *[search_web(q, max_results=4) for q in queries]
    )

    # Flatten and deduplicate by URL
    seen_urls: set[str] = set()
    deduplicated: list[SearchResult] = []
    for result_list in all_result_lists:
        for r in result_list:
            if r.url not in seen_urls:
                seen_urls.add(r.url)
                deduplicated.append(r)

    # Sort by score descending
    deduplicated.sort(key=lambda r: r.score, reverse=True)

    search_log.info(
        "research_topic | done | raw=%d | deduped=%d | elapsed_ms=%d",
        sum(len(rl) for rl in all_result_lists),
        len(deduplicated),
        timer.elapsed_ms,
    )

    context_str = _format_research_context(topic, deduplicated)
    return ResearchContext(context_str=context_str, results=deduplicated)


def _format_research_context(topic: str, results: list[SearchResult]) -> str:
    if not results:
        return f"Topic: {topic}\n(No web search results — generate from your knowledge.)"

    lines = [
        f"Research context for topic: {topic!r}",
        "(Use these facts and examples to enrich your content — prioritise recency and specificity)\n",
    ]
    for i, r in enumerate(results[:8], 1):  # cap at 8 sources
        snippet = r.content[:500].strip()
        lines.append(f"[{i}] {r.title}\nURL: {r.url}\n{snippet}\n")

    return "\n".join(lines)
