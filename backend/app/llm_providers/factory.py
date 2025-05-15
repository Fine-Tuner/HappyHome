from app.llm_providers.base_provider import LLMProviderStrategy
from app.llm_providers.gemini_provider import GeminiProvider
from app.llm_providers.openai_provider import OpenAIProvider

_PROVIDER_REGISTRY = {
    "gemini": GeminiProvider,
    "openai": OpenAIProvider,
}


def get_llm_provider(provider_name: str) -> LLMProviderStrategy:
    """
    Factory function to get an instance of an LLM provider strategy.

    Args:
        provider_name: The name of the provider (e.g., "gemini", "openai").

    Returns:
        An instance of the requested LLMProviderStrategy.

    Raises:
        ValueError: If the provider_name is not supported.
    """
    provider_class = _PROVIDER_REGISTRY.get(provider_name.lower())
    if provider_class:
        return provider_class()
    else:
        raise ValueError(
            f"Unsupported LLM provider: '{provider_name}'. Supported providers are: {list(_PROVIDER_REGISTRY.keys())}"
        )
