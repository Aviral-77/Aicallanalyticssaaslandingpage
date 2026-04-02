"""
Structured logging for Repost AI backend.

Log files (auto-rotated at 10 MB, 5 backups each):
  logs/app.log        — general request/lifecycle events
  logs/extraction.log — content extraction pipeline
  logs/llm.log        — LLM prompts, outputs, timing
  logs/search.log     — web search queries and results
"""

import logging
import logging.handlers
import time
from pathlib import Path

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-14s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_configured = False


def _make_handler(filename: str) -> logging.handlers.RotatingFileHandler:
    handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / filename,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))
    return handler


def setup_logging() -> None:
    """Call once at application startup."""
    global _configured
    if _configured:
        return
    _configured = True

    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))
    console.setLevel(logging.INFO)

    # Root logger — INFO to console
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.addHandler(console)
    root.addHandler(_make_handler("app.log"))

    # Domain-specific loggers write to their own files too
    for name, filename in [
        ("extraction", "extraction.log"),
        ("llm",        "llm.log"),
        ("search",     "search.log"),
    ]:
        lg = logging.getLogger(name)
        lg.addHandler(_make_handler(filename))
        lg.propagate = True  # still goes to root (console + app.log)


# ── Convenience getters ───────────────────────────────────────────────────────

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


extraction_log = logging.getLogger("extraction")
llm_log        = logging.getLogger("llm")
search_log     = logging.getLogger("search")
app_log        = logging.getLogger("app")


# ── Timing helper ─────────────────────────────────────────────────────────────

class Timer:
    def __init__(self) -> None:
        self._start = time.perf_counter()

    @property
    def elapsed_ms(self) -> int:
        return int((time.perf_counter() - self._start) * 1000)
