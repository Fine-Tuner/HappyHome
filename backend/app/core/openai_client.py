import os

from openai import OpenAI


class OpenAIClientSingleton:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenAIClientSingleton, cls).__new__(cls)
            # Initialize the OpenAI client only once
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set.")
            cls._client = OpenAI(api_key=api_key)
        return cls._instance

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            # This condition should theoretically not be met if __new__ is implemented correctly
            # but serves as a safeguard.
            raise RuntimeError("OpenAI client not initialized.")
        return self._client


# Function to get the singleton instance's client
def get_openai_client() -> OpenAI:
    return OpenAIClientSingleton().client


# Optional: Keep the old variable name for compatibility if needed,
# but ideally, refactor usage to call get_openai_client()
openai_client = get_openai_client()
