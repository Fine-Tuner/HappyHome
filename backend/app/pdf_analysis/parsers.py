import json
from typing import Any

from app.core.openai_client import get_openai_client


def parse_openai_content_as_json(content: str) -> dict[str, Any] | None:
    """
    Parses the potentially noisy string content from an OpenAI response into a JSON object (dict).

    First, it tries a heuristic approach to clean the string (removing markdown code fences)
    and parse it directly. If that fails, it uses GPT-4o-mini to attempt parsing.

    Args:
        content: The raw string content from the OpenAI response.

    Returns:
        A dictionary representing the parsed JSON, or None if parsing fails after both attempts.
    """
    cleaned_content = content.strip()
    # Heuristic cleaning for markdown code fences
    if cleaned_content.startswith("```json"):
        cleaned_content = cleaned_content[7:]
    if cleaned_content.endswith("```"):
        cleaned_content = cleaned_content[:-3]
    cleaned_content = cleaned_content.strip()

    try:
        # Attempt 1: Direct parsing after simple cleaning
        return json.loads(cleaned_content)
    except json.JSONDecodeError:
        # Attempt 2: Use LLM to re-parse if direct parsing failed
        print(
            f"Direct JSON parsing failed for content: '{cleaned_content[:100]}...'. Attempting LLM-based parsing."
        )
        try:
            client = get_openai_client()
            prompt = (
                "The following text is supposed to be a JSON object, but it might have some formatting errors or extra text. "
                "Please extract and return only the valid JSON object. "
                "If it's impossible to extract a valid JSON object, return an empty JSON object {}."
                "\n\nInput text:\n```\n"
                f"{cleaned_content}\n```"
            )
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Or another suitable model
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.0,  # Be precise
            )
            if response.choices and response.choices[0].message.content:
                llm_parsed_content = response.choices[0].message.content.strip()
                # Clean the LLM output as well, just in case it adds fences
                if llm_parsed_content.startswith("```json"):
                    llm_parsed_content = llm_parsed_content[7:]
                if llm_parsed_content.endswith("```"):
                    llm_parsed_content = llm_parsed_content[:-3]
                llm_parsed_content = llm_parsed_content.strip()

                # Handle the case where LLM returns the requested empty object
                if llm_parsed_content == "{}":
                    return {}

                # Try parsing the LLM's cleaned output
                return json.loads(llm_parsed_content)
            else:
                print("LLM parser returned no content.")
                return None
        except json.JSONDecodeError as llm_e:
            print(f"LLM-based JSON parsing also failed: {llm_e}")
            print(f"LLM Output was: {llm_parsed_content}")
            return None
        except Exception as e:
            print(f"Error during LLM-based JSON parsing API call: {e}")
            return None
