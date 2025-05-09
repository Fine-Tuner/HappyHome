import os

from google.genai import Client


class GeminiClientSingleton:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiClientSingleton, cls).__new__(cls)
            # Initialize the Gemini client only once
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set.")
            cls._client = Client(
                api_key=api_key,
            )
        return cls._instance

    @property
    def client(self) -> Client:
        if self._client is None:
            # This condition should theoretically not be met if __new__ is implemented correctly
            # but serves as a safeguard.
            raise RuntimeError("Gemini client not initialized.")
        return self._client


# Function to get the singleton instance's client
def get_gemini_client() -> Client:
    return GeminiClientSingleton().client


# Singleton instance for easy access
gemini_client = get_gemini_client()
