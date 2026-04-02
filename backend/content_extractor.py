"""
Extract readable content from YouTube videos, blog posts, and articles.
"""

import asyncio
import re
from dataclasses import dataclass
from typing import Literal

import httpx
import trafilatura
from langsmith import traceable
from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
    YouTubeTranscriptApi,
)

from logger import Timer, extraction_log

SourceType = Literal["youtube", "blog", "article", "podcast"]

# Max characters sent to the LLM (~25k chars ≈ ~6k tokens — leaves ample room)
MAX_CONTENT_CHARS = 25_000

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


@dataclass
class ExtractedContent:
    title: str
    content: str
    source_type: SourceType


# ── YouTube ───────────────────────────────────────────────────────────────────


def _extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]{11})",
        r"youtube\.com/embed/([^&\n?#]{11})",
        r"youtube\.com/shorts/([^&\n?#]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(
        "Could not extract a YouTube video ID from the URL. "
        "Make sure it's a valid youtube.com or youtu.be link."
    )


def _fetch_transcript_sync(video_id: str) -> str:
    """Fetch transcript synchronously (runs in a thread pool)."""
    try:
        transcript_entries = YouTubeTranscriptApi.get_transcript(video_id)
    except TranscriptsDisabled:
        raise ValueError(
            "This video has transcripts disabled. "
            "Try a video that has captions or subtitles available."
        )
    except NoTranscriptFound:
        raise ValueError(
            "No transcript was found for this video. "
            "It may be in an unsupported language or the creator hasn't added captions."
        )

    return " ".join(entry["text"] for entry in transcript_entries)


async def _fetch_youtube_title(url: str, video_id: str) -> str:
    """Fetch video title via YouTube's free oEmbed endpoint (no API key needed)."""
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://youtu.be/{video_id}&format=json"
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(oembed_url, headers={"User-Agent": USER_AGENT})
            if resp.status_code == 200:
                return resp.json().get("title", "YouTube Video")
    except Exception:
        pass
    return "YouTube Video"


@traceable(name="extract_youtube")
async def extract_youtube(url: str) -> ExtractedContent:
    """Extract transcript and title from a YouTube video URL."""
    timer = Timer()
    video_id = _extract_video_id(url)
    extraction_log.info("youtube_extract | video_id=%s | url=%s", video_id, url)

    # Run sync transcript API in a thread to avoid blocking the event loop
    transcript, title = await asyncio.gather(
        asyncio.to_thread(_fetch_transcript_sync, video_id),
        _fetch_youtube_title(url, video_id),
    )

    # Truncate to avoid huge token bills on very long videos
    truncated = len(transcript) > MAX_CONTENT_CHARS
    content = transcript[:MAX_CONTENT_CHARS]
    if truncated:
        content += "\n\n[Transcript truncated for processing]"

    extraction_log.info(
        "youtube_extract | done | title=%r | transcript_chars=%d | truncated=%s | elapsed_ms=%d",
        title, len(transcript), truncated, timer.elapsed_ms,
    )
    extraction_log.debug("youtube_transcript_preview | %s", transcript[:500])

    return ExtractedContent(title=title, content=content, source_type="youtube")


# ── Articles / Blogs / Podcasts ───────────────────────────────────────────────


def _extract_with_trafilatura(html: str) -> str | None:
    """Run trafilatura extraction synchronously (runs in a thread pool)."""
    return trafilatura.extract(
        html,
        include_comments=False,
        include_tables=False,
        no_fallback=False,
        favor_recall=True,
    )


@traceable(name="extract_article")
async def extract_article(url: str) -> ExtractedContent:
    """Extract main content and title from any public article / blog / podcast page."""
    timer = Timer()
    extraction_log.info("article_extract | url=%s", url)

    try:
        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPStatusError as e:
        if e.response.status_code in (401, 403):
            raise ValueError(
                "This page requires a login or is behind a paywall. "
                "Try pasting a publicly accessible link."
            )
        raise ValueError(f"Failed to fetch the URL (HTTP {e.response.status_code}).")
    except httpx.TimeoutException:
        raise ValueError("The page took too long to load. Please try again.")
    except Exception as e:
        raise ValueError(f"Could not fetch the URL: {e}")

    # Extract main content in a thread
    text = await asyncio.to_thread(_extract_with_trafilatura, html)

    if not text or len(text.strip()) < 100:
        raise ValueError(
            "Could not extract readable text from this page. "
            "It may be a dynamic app, a paywall page, or require JavaScript to render. "
            "Try a different link or paste the article text directly."
        )

    # Extract title from HTML <title> tag
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else url

    # Clean common title suffixes added by CMSes
    for suffix in [" | Medium", " - Medium", " | Substack", " | Dev.to", " - Dev.to", " | Hashnode"]:
        title = title.removesuffix(suffix)

    truncated = len(text) > MAX_CONTENT_CHARS
    content = text[:MAX_CONTENT_CHARS]
    if truncated:
        content += "\n\n[Content truncated for processing]"

    extraction_log.info(
        "article_extract | done | title=%r | content_chars=%d | truncated=%s | elapsed_ms=%d",
        title, len(text), truncated, timer.elapsed_ms,
    )
    extraction_log.debug("article_content_preview | %s", text[:500])

    return ExtractedContent(title=title, content=content, source_type="article")


# ── Dispatcher ────────────────────────────────────────────────────────────────


async def extract(url: str, source_type: SourceType) -> ExtractedContent:
    """Route URL to the correct extractor based on source type."""
    url = url.strip()
    if source_type == "youtube":
        return await extract_youtube(url)
    else:
        # blog, article, podcast — all use the article extractor
        result = await extract_article(url)
        return ExtractedContent(
            title=result.title,
            content=result.content,
            source_type=source_type,
        )
