"""
Voice persona analysis — reads sample LinkedIn posts and produces a structured
style profile that is:
  - Stored as JSON in the DB
  - Displayed as a rich card in the Settings UI
  - Injected as a natural-language style guide into all generation prompts
"""

import json
import os
import re

import google.generativeai as genai

from logger import llm_log


PERSONA_SYSTEM = (
    "You are an expert writing coach and style analyst who specialises in LinkedIn content. "
    "You study sample posts and produce a precise JSON profile so another writer can "
    "perfectly replicate that person's voice."
)


async def analyze_voice(sample_posts: list[str]) -> dict:
    """
    Analyse `sample_posts` and return a structured voice profile dict.
    Returns an empty dict if posts are empty or Gemini is unavailable.
    """
    clean = [p.strip() for p in sample_posts if p.strip()]
    if not clean:
        return {}

    joined = "\n\n---\n\n".join(clean)

    prompt = (
        "Here are sample LinkedIn posts written by a specific person:\n\n"
        f"{joined}\n\n"
        "Analyse their unique writing voice and return ONLY a JSON object with these exact keys:\n"
        "{\n"
        '  "summary": "One sentence describing their overall voice and style",\n'
        '  "hook_style": "How they open posts (e.g. bold claim, question, stat, story)",\n'
        '  "tone": "one of: thought_leader | casual | storytelling | data_driven | contrarian",\n'
        '  "tone_label": "Human-readable tone label",\n'
        '  "sentence_style": "Their sentence length and rhythm",\n'
        '  "structure": "How they structure a post (e.g. hook → bullets → CTA)",\n'
        '  "key_phrases": ["up to 5 recurring phrases or patterns they use"],\n'
        '  "formatting": "Their use of line breaks, emojis, bullets, capitalisation",\n'
        '  "cta_style": "How they close posts and drive engagement"\n'
        "}\n\n"
        "Be specific and actionable. Output ONLY valid JSON — no markdown, no explanation."
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
            generation_config=genai.types.GenerationConfig(max_output_tokens=700),
        )
        raw = response.text.strip() if response.text else ""
        profile = _parse_json(raw)
        llm_log.info("persona_analyze_done | keys=%s", list(profile.keys()))
        return profile
    except Exception as exc:
        llm_log.warning("persona_analyze_failed | error=%s", exc)
        return {}


def _parse_json(raw: str) -> dict:
    """Strip markdown fences and parse JSON. Returns empty dict on failure."""
    cleaned = re.sub(r"^```[a-z]*\n?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    try:
        data = json.loads(cleaned)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        llm_log.warning("persona_json_parse_failed | raw=%r", raw[:200])
        return {}


def voice_prompt_block(voice_profile_json: str) -> str:
    """
    Convert the stored JSON voice profile into a natural-language style guide
    for injection into generation prompts.
    Returns empty string if no profile set.
    """
    if not voice_profile_json:
        return ""

    try:
        profile = json.loads(voice_profile_json)
    except (json.JSONDecodeError, TypeError):
        # Legacy plain-text profile — inject as-is
        return (
            "\n\nCRITICAL — Match this user's personal writing voice exactly:\n"
            f"{voice_profile_json}\n"
            "Prioritise their voice over the general tone instruction above.\n"
        )

    if not profile:
        return ""

    lines = [
        "\n\nCRITICAL — Write in this specific user's voice. Match it exactly:",
        f"Overall voice: {profile.get('summary', '')}",
        f"Hook style: {profile.get('hook_style', '')}",
        f"Sentence style: {profile.get('sentence_style', '')}",
        f"Post structure: {profile.get('structure', '')}",
        f"Formatting habits: {profile.get('formatting', '')}",
        f"CTA style: {profile.get('cta_style', '')}",
    ]
    phrases = profile.get("key_phrases", [])
    if phrases:
        lines.append(f"Recurring phrases to mirror: {', '.join(repr(p) for p in phrases)}")
    lines.append("Prioritise this voice over the general tone instruction above.\n")

    return "\n".join(lines)
