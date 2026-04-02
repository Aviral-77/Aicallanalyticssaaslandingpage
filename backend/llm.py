"""
LLM integration for generating social media posts using Claude.
Uses claude-opus-4-6 with streaming to avoid request timeouts.
"""

import os

import anthropic

MODEL = "claude-opus-4-6"

# ── Tone descriptions ─────────────────────────────────────────────────────────

TONE_DESCRIPTIONS: dict[str, str] = {
    "thought_leader": (
        "an authoritative thought leader who educates and inspires. "
        "Open with a bold, declarative statement or a surprising insight. "
        "Use phrases like 'Here's what most people miss...' or 'After studying X, I learned...'. "
        "Be confident and assertive."
    ),
    "casual": (
        "a casual, approachable friend sharing something cool they just discovered. "
        "Use first-person, contractions, and everyday language. "
        "Be relatable and conversational — like you're texting a colleague."
    ),
    "storytelling": (
        "a compelling storyteller. Open with a specific moment, scene, or memory. "
        "Build a mini narrative arc: setup → discovery/conflict → insight → takeaway. "
        "Make it personal and emotionally resonant."
    ),
    "data_driven": (
        "an analytical expert who leads with data and evidence. "
        "Open with a surprising statistic or counterintuitive finding. "
        "Back every claim with numbers, research, or specific examples. "
        "Quantify the impact wherever possible."
    ),
    "contrarian": (
        "a bold contrarian who challenges conventional wisdom. "
        "Open with 'Unpopular opinion:' or 'Hot take:' or 'Everyone says X, but...'. "
        "Challenge the dominant narrative with compelling evidence. "
        "Be provocative but not offensive."
    ),
}

# ── Platform-specific formatting instructions ─────────────────────────────────

PLATFORM_INSTRUCTIONS: dict[str, str] = {
    "linkedin": """
FORMAT RULES for LinkedIn:
- The FIRST LINE is the hook — it must compel someone to click "see more". Make it punchy, curious, or bold.
- Use short paragraphs (1-3 sentences). Insert a blank line between each paragraph.
- Structure: Hook → 3-5 key insights or points → Personal takeaway → Call to action
- End with an engaging QUESTION to drive comments (e.g., "What's your take on this?")
- Add 3-5 relevant hashtags on the final line (e.g., #buildinpublic #startups #AI)
- Do NOT use markdown formatting (no **bold**, no bullet symbols like • or ▸ — use plain → or dashes if needed)
- Target length: 250-450 words
""",
    "twitter": """
FORMAT RULES for Twitter/X thread:
- Tweet 1 is the HOOK — it must stand alone as shareable and make people want to read more. Keep under 240 chars.
- Number every tweet: 1/, 2/, 3/, ... etc.
- Each individual tweet must be under 275 characters (be strict about this)
- Write 7-10 tweets total
- Each tweet should deliver ONE clear insight, fact, or point
- Final tweet: brief summary + "Follow for more" CTA
- Do NOT use markdown formatting
- No emoji unless it genuinely adds clarity
""",
}

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert social media content strategist specializing in content for tech founders, software engineers, indie hackers, and startup builders.

Your job: take raw content (transcripts, articles, blog posts) and transform it into high-performing social media posts that grow an audience.

Your posts are known for:
- Hooks that stop the scroll
- Making complex ideas simple and actionable
- Sounding human, not like AI-generated filler
- Driving genuine engagement (comments, shares, saves)

You write for an audience of builders — people who value substance over fluff."""


# ── Main generation function ──────────────────────────────────────────────────


async def generate_post(
    content: str,
    title: str,
    platform: str,
    tone: str,
    source_type: str,
) -> str:
    """
    Generate a social media post from extracted content.

    Uses streaming to avoid HTTP timeout on slow networks.
    Returns the complete generated post text.
    """
    tone_desc = TONE_DESCRIPTIONS.get(tone, TONE_DESCRIPTIONS["thought_leader"])
    platform_instr = PLATFORM_INSTRUCTIONS.get(platform, PLATFORM_INSTRUCTIONS["linkedin"])

    source_label = {
        "youtube": "YouTube video / podcast",
        "blog": "blog post",
        "article": "article",
        "podcast": "podcast episode",
    }.get(source_type, "content")

    user_prompt = f"""Repurpose the following {source_label} into a {platform} post.

Content title: {title}

---
{content}
---

Write in the voice of {tone_desc}

{platform_instr}

Output ONLY the final post text. No preamble, no "Here is your post:", no explanation. Just the post itself, ready to copy and paste."""

    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Use streaming to avoid timeout on long generations
    async with client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        message = await stream.get_final_message()

    if not message.content:
        raise RuntimeError("LLM returned an empty response.")

    return message.content[0].text.strip()
