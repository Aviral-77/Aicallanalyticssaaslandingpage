"""
LinkedIn profile scraper using Playwright.

Navigates to the user's recent-activity page and extracts the text of their
latest posts. Falls back to the profile page if the activity feed is unavailable.

Requires Playwright browser binaries:
    playwright install --with-deps chromium
"""

import asyncio
import re
from dataclasses import dataclass

from logger import extraction_log


@dataclass
class ScrapeResult:
    posts: list[str]
    error: str = ""


# Selector strategies for different LinkedIn page versions
_POST_SELECTORS = [
    ".feed-shared-update-v2__description .feed-shared-text span[dir='ltr']",
    ".update-components-text span[dir='ltr']",
    ".feed-shared-inline-show-more-text span[dir='ltr']",
    "[data-test-id='main-feed-activity-card__commentary'] span",
    ".feed-shared-text-view span",
]

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def _activity_url(profile_url: str) -> str:
    """Convert profile URL to recent-activity URL."""
    base = profile_url.rstrip("/")
    if "/recent-activity" not in base:
        base += "/recent-activity/all/"
    return base


async def scrape_posts(profile_url: str, max_posts: int = 5) -> ScrapeResult:
    """
    Scrape recent LinkedIn posts from `profile_url`.

    Returns up to `max_posts` post strings and an error string (empty = success).
    Never raises — always returns a ScrapeResult.
    """
    try:
        from playwright.async_api import async_playwright  # lazy import
    except ImportError:
        return ScrapeResult(
            posts=[],
            error=(
                "Playwright is not installed. "
                "Run: pip install playwright && playwright install --with-deps chromium"
            ),
        )

    extraction_log.info("linkedin_scrape | url=%s", profile_url)

    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            )
            ctx = await browser.new_context(
                user_agent=_USER_AGENT,
                viewport={"width": 1280, "height": 900},
                locale="en-US",
                extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
            )

            # Basic stealth — hide webdriver flag
            await ctx.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )

            page = await ctx.new_page()

            # ── Try activity feed ──────────────────────────────────────────────
            activity = _activity_url(profile_url)
            extraction_log.info("linkedin_scrape | navigating to %s", activity)

            try:
                await page.goto(activity, wait_until="domcontentloaded", timeout=20_000)
            except Exception as nav_err:
                await browser.close()
                return ScrapeResult(posts=[], error=f"Navigation failed: {nav_err}")

            # Check for login wall
            current_url = page.url
            if "authwall" in current_url or "/login" in current_url or "/checkpoint" in current_url:
                await browser.close()
                extraction_log.info("linkedin_scrape | login wall encountered")
                return ScrapeResult(
                    posts=[],
                    error=(
                        "LinkedIn requires you to be logged in to view this profile's posts. "
                        "Please paste your posts manually below."
                    ),
                )

            # Wait a bit for dynamic content
            await asyncio.sleep(2)

            posts = await _extract_posts(page)

            # ── If no posts found, try the main profile page ───────────────────
            if not posts:
                extraction_log.info("linkedin_scrape | no posts on activity page, trying profile")
                try:
                    await page.goto(profile_url, wait_until="domcontentloaded", timeout=15_000)
                    await asyncio.sleep(2)
                    posts = await _extract_posts(page)
                except Exception:
                    pass

            await browser.close()

            if not posts:
                return ScrapeResult(
                    posts=[],
                    error=(
                        "Could not find posts on this profile. "
                        "LinkedIn may have blocked the request, or the profile has no public posts. "
                        "Please paste your recent posts manually."
                    ),
                )

            unique = _deduplicate(posts)[:max_posts]
            extraction_log.info("linkedin_scrape | found %d posts", len(unique))
            return ScrapeResult(posts=unique)

    except Exception as exc:
        extraction_log.warning("linkedin_scrape | error=%s", exc)
        return ScrapeResult(posts=[], error=f"Scraping failed: {exc}")


async def _extract_posts(page) -> list[str]:
    """Try each selector strategy and return the first batch of results."""
    for selector in _POST_SELECTORS:
        try:
            posts: list[str] = await page.eval_on_selector_all(
                selector,
                "(els) => els.map(el => el.innerText.trim()).filter(t => t.length > 60)",
            )
            if posts:
                return posts
        except Exception:
            continue
    return []


def _deduplicate(posts: list[str]) -> list[str]:
    """Remove duplicate / near-duplicate post texts."""
    seen: list[str] = []
    for p in posts:
        p_clean = re.sub(r"\s+", " ", p).strip()
        if not any(_similarity(p_clean, s) > 0.85 for s in seen):
            seen.append(p_clean)
    return seen


def _similarity(a: str, b: str) -> float:
    """Rough word-overlap similarity (0-1)."""
    wa = set(a.lower().split())
    wb = set(b.lower().split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)
