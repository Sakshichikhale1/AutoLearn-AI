import wikipedia
import requests
import logging
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

class KnowledgeService:
    def get_related_knowledge(self, topic: str) -> dict:
        """
        Fetch knowledge from Wikipedia with DuckDuckGo fallback.
        1. Wikipedia exact match
        2. Wikipedia fuzzy search
        3. DuckDuckGo snippet
        """
        if not topic:
            return {"title": "Unknown", "summary": "No topic provided.", "url": ""}

        # 1. Wikipedia Exact/Fuzzy
        try:
            # Try to get the page directly
            try:
                page = wikipedia.page(topic, auto_suggest=True)
                logger.info(f"Wikipedia: Found exact/suggested match for {topic}")
                return {
                    "title": page.title,
                    "summary": wikipedia.summary(topic, sentences=3, auto_suggest=True),
                    "url": page.url
                }
            except wikipedia.DisambiguationError as e:
                # If ambiguous, pick the first option
                best_option = e.options[0]
                page = wikipedia.page(best_option)
                logger.info(f"Wikipedia: Disambiguated {topic} to {best_option}")
                return {
                    "title": page.title,
                    "summary": wikipedia.summary(best_option, sentences=3),
                    "url": page.url
                }
            except wikipedia.PageError:
                # Try fuzzy search
                search_results = wikipedia.search(topic)
                if search_results:
                    best_match = search_results[0]
                    page = wikipedia.page(best_match)
                    logger.info(f"Wikipedia: Fuzzy match {topic} -> {best_match}")
                    return {
                        "title": page.title,
                        "summary": wikipedia.summary(best_match, sentences=3),
                        "url": page.url
                    }
        except Exception as e:
            logger.warning(f"Wikipedia failed for {topic}: {str(e)}")

        # 2. DuckDuckGo Fallback
        logger.info(f"Knowledge: Falling back to DuckDuckGo for {topic}")
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(topic, max_results=1))
                if results:
                    res = results[0]
                    return {
                        "title": res.get("title", topic),
                        "summary": res.get("body", "No summary available."),
                        "url": res.get("href", "")
                    }
        except Exception as e:
            logger.error(f"DuckDuckGo fallback failed: {str(e)}")

        return {
            "title": topic,
            "summary": "We couldn't find detailed information on this specific topic, but you can explore more via the links provided.",
            "url": f"https://www.google.com/search?q={topic}"
        }

knowledge_service = KnowledgeService()
