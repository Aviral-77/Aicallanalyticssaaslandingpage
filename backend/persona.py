"""
Voice persona analysis — reads sample LinkedIn posts and produces a precise
style guide that is injected into all subsequent generation prompts.

No LinkedIn OAuth is needed: the user pastes 3-4 of their own posts in Settings.
Gemini analyses the writing style and stores a reusable voice profile.
"""

import os

import google.generativeai as genai

from logger import llm_log

PERSONA_SYSTEM = (
    "You are an expert writing coach and style analyst. "
    "You study sample posts and produce a precise, actionable style guide "
    "that another writer could follow to replicate that person's voice exactly."
)


async def analyze_voice(sample_posts: list[str]) -> str:
    """
    Analyse `sample_posts` and return a 4-6 sentence voice profile.
    Returns an empty string if posts are empty or Gemini is unavailable.
    """
    clean = [p.strip() for p in sample_posts if p.strip()]
    if not clean:
        return ""

    joined = "\n\n---\n\n".join(clean)

    prompt = (
        "Here are sample LinkedIn posts written by a specific person:\n\n"
        f"{joined}\n\n"
        "Analyse their unique writing voice. Describe:\n"
        "1. Typical sentence structure and length\n"
        "2. How they open posts (hook style — question, bold claim, story, stat, etc.)\n"
        "3. Use of formatting (line breaks, bullets, emojis, capitalisation)\n"
        "4. Tone and personality (e.g. direct, warm, analytical, provocative)\n"
        "5. Recurring phrases, word choices, or structural patterns\n\n"
        "Write a concise style guide (4-6 sentences) that a writer could follow "
        "to perfectly replicate this person's voice. Be specific — avoid generic advice."
    )

    llm_log.info("persona_analyze | posts=%d | total_chars=%d", len(clean), len(joined))

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=PERSONA_SYSTEM,
        )
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(max_output_tokens=600),
        )
        profile = response.text.strip() if response.text else ""
        llm_log.info("persona_analyze_done | profile_chars=%d", len(profile))
        return profile
    except Exception as exc:
        llm_log.warning("persona_analyze_failed | error=%s", exc)
        return ""


def voice_prompt_block(voice_profile: str) -> str:
    """
    Format the voice profile for injection into a generation prompt.
    Returns an empty string when no profile is set.
    """
    if not voice_profile:
        return ""
    return (
        "\n\nCRITICAL — This post must match the following user's personal writing voice exactly. "
        "Prioritise their voice over the general tone instruction above:\n"
        f"{voice_profile}\n"
    )
