"""
LLM integration — generates 3 parallel post versions using Claude Opus 4.6.

Features:
  - LangSmith tracing via @traceable (set LANGCHAIN_TRACING_V2=true + LANGCHAIN_API_KEY)
  - Structured file logging (llm.log)
  - 3 versions generated concurrently, each with a distinct structural angle
  - Web-search context injected into prompt for richer output
"""

import asyncio
import os
from dataclasses import dataclass

import anthropic
from langsmith import traceable

from logger import Timer, llm_log

MODEL = "claude-opus-4-6"

# ── Tone descriptions (voice / personality) ───────────────────────────────────

TONE_DESCRIPTIONS: dict[str, str] = {
    "thought_leader": (
        "an authoritative thought leader who educates and inspires. "
        "Open with a bold, declarative statement or a surprising insight. "
        "Use phrases like 'Here's what most people miss…' or 'After studying X, I learned…'. "
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
        "Open with 'Unpopular opinion:' or 'Hot take:' or 'Everyone says X, but…'. "
        "Challenge the dominant narrative with compelling evidence. "
        "Be provocative but not offensive."
    ),
}

# ── Structural angles (3 versions) ────────────────────────────────────────────

ANGLES = [
    {
        "id":          "hook_insights",
        "label":       "Hook & Insights",
        "instruction": (
            "Open with a powerful hook — a surprising fact, bold statement, or provocative question "
            "that makes someone stop scrolling. Then deliver 3-5 key insights in a clear, scannable structure. "
            "End with a reflection or call to action that invites comments."
        ),
    },
    {
        "id":          "story_arc",
        "label":       "Story Arc",
        "instruction": (
            "Open with a specific scene, moment, or 'I was X when I discovered Y' setup. "
            "Build a personal narrative frame around the main ideas — lead with the journey, not the conclusion. "
            "Weave in the insights as discoveries. End with the lesson and an open question."
        ),
    },
    {
        "id":          "bold_take",
        "label":       "Bold Take",
        "instruction": (
            "Challenge one conventional assumption from this content. "
            "Open with 'Here's what nobody is talking about:' or 'The real lesson here isn't X, it's Y.' "
            "Be provocative, specific, and grounded. Push back on the obvious interpretation. "
            "End with a question that sparks debate."
        ),
    },
]

# ── Platform formatting ────────────────────────────────────────────────────────

PLATFORM_INSTRUCTIONS: dict[str, str] = {
    "linkedin": (
        "FORMAT — LinkedIn post:\n"
        "• First line = hook. Must compel someone to click 'see more'. Make it punchy.\n"
        "• Short paragraphs (1-3 sentences). Blank line between each.\n"
        "• End with an engaging QUESTION to drive comments.\n"
        "• Add 3-5 hashtags on the final line.\n"
        "• No markdown (no **bold**, no bullets — use → or plain dashes if needed).\n"
        "• Target: 250-450 words."
    ),
    "twitter": (
        "FORMAT — Twitter/X thread:\n"
        "• Tweet 1 = hook. Must stand alone as retweetable. Under 240 chars.\n"
        "• Number every tweet: 1/, 2/, 3/ …\n"
        "• Each tweet ≤275 characters. Be strict.\n"
        "• 7-10 tweets total. One clear point per tweet.\n"
        "• Last tweet: brief summary + 'Follow for more' CTA.\n"
        "• No markdown."
    ),
}

SYSTEM_PROMPT = (
    "You are an expert social media content strategist for tech founders, software engineers, "
    "indie hackers, and startup builders.\n\n"
    "Your posts are known for hooks that stop the scroll, making complex ideas simple and "
    "actionable, sounding human (not like AI filler), and driving genuine engagement.\n\n"
    "Output ONLY the post text — no preamble, no 'Here is your post:', no explanation."
)


# ── Data model ─────────────────────────────────────────────────────────────────

@dataclass
class PostVersion:
    version: int
    angle_id: str
    angle_label: str
    content: str


# ── Core generation ────────────────────────────────────────────────────────────

@traceable(name="generate_single_version", run_type="llm")
async def _generate_single_version(
    *,
    content: str,
    title: str,
    platform: str,
    tone: str,
    source_type: str,
    search_context: str,
    angle: dict,
    version_num: int,
) -> PostVersion:
    """Generate one post version. Decorated with @traceable for LangSmith."""
    tone_desc = TONE_DESCRIPTIONS.get(tone, TONE_DESCRIPTIONS["thought_leader"])
    platform_instr = PLATFORM_INSTRUCTIONS.get(platform, PLATFORM_INSTRUCTIONS["linkedin"])

    source_label = {
        "youtube":  "YouTube video / podcast",
        "blog":     "blog post",
        "article":  "article",
        "podcast":  "podcast episode",
    }.get(source_type, "content")

    search_block = f"\n\n{search_context}" if search_context else ""

    prompt = (
        f"Repurpose the following {source_label} into a {platform} post.\n\n"
        f"Title: {title}\n\n"
        f"--- MAIN CONTENT ---\n{content}\n--- END CONTENT ---"
        f"{search_block}\n\n"
        f"Write in the voice of {tone_desc}\n\n"
        f"Structural angle for THIS version:\n{angle['instruction']}\n\n"
        f"{platform_instr}"
    )

    timer = Timer()
    llm_log.info(
        "llm_request | version=%d | angle=%s | model=%s | platform=%s | tone=%s | prompt_chars=%d",
        version_num, angle["id"], MODEL, platform, tone, len(prompt),
    )

    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async with client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = await stream.get_final_message()

    output_text = message.content[0].text.strip() if message.content else ""

    llm_log.info(
        "llm_response | version=%d | angle=%s | output_chars=%d | input_tokens=%d | output_tokens=%d | elapsed_ms=%d",
        version_num, angle["id"],
        len(output_text),
        message.usage.input_tokens,
        message.usage.output_tokens,
        timer.elapsed_ms,
    )
    llm_log.debug("llm_output | version=%d | angle=%s |\n%s", version_num, angle["id"], output_text)

    return PostVersion(
        version=version_num,
        angle_id=angle["id"],
        angle_label=angle["label"],
        content=output_text,
    )


@traceable(name="generate_post", run_type="chain")
async def generate_post(
    *,
    content: str,
    title: str,
    platform: str,
    tone: str,
    source_type: str,
    search_context: str = "",
) -> list[PostVersion]:
    """
    Generate 3 post versions concurrently — one per structural angle.
    Returns list ordered [hook_insights, story_arc, bold_take].
    """
    llm_log.info(
        "generate_post | title=%r | platform=%s | tone=%s | source_type=%s | search_ctx=%d chars",
        title, platform, tone, source_type, len(search_context),
    )

    tasks = [
        _generate_single_version(
            content=content,
            title=title,
            platform=platform,
            tone=tone,
            source_type=source_type,
            search_context=search_context,
            angle=angle,
            version_num=i + 1,
        )
        for i, angle in enumerate(ANGLES)
    ]

    versions = await asyncio.gather(*tasks)
    llm_log.info("generate_post | complete | versions=%d", len(versions))
    return list(versions)
