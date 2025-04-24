import json
import logging
from typing import TypeVar

from pydantic import BaseModel, TypeAdapter, ValidationError

from app.core.openai_client import openai_client

T = TypeVar("T", bound=BaseModel)


def parse_and_validate_openai_response(
    content: str,
    validation_model: type[BaseModel] | type[list[BaseModel]],
    model: str,
    max_retries: int = 3,
) -> BaseModel | list[BaseModel]:
    """
    Parses the content from an OpenAI response, validates it against a Pydantic model
    (or a list of Pydantic models) using TypeAdapter, and attempts to fix errors
    by re-prompting the LLM up to max_retries times.
    Returns the Pydantic model instance (or list of instances).
    """
    last_error = None
    previous_response_id = None

    # Prepare a TypeAdapter once
    adapter = TypeAdapter(validation_model)

    for attempt in range(1, max_retries + 1):
        try:
            # Extract and clean the raw JSON text
            cleaned = content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[len("```json") :]
            if cleaned.endswith("```"):
                cleaned = cleaned[: -len("```")]
            cleaned = cleaned.strip()

            # 1) Load into Python primitives
            raw_data = json.loads(cleaned)

            # 2) Validate & convert with TypeAdapter
            validated_instance = adapter.validate_python(raw_data)

            logging.info(f"Parsed & validated on attempt {attempt}")
            return validated_instance

        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            logging.warning(f"Attempt {attempt}/{max_retries} failed: {e}")
            if attempt == max_retries:
                logging.error("Exceeded max retries parsing/validation.")
                break

            # Ask LLM to fix its JSON output
            fix_prompt = (
                "The previous parsing resulted in an error: {e}. "
                "Please review and output only a corrected JSON object."
            )
            try:
                response = openai_client.responses.create(
                    model=model,
                    temperature=0.0,
                    top_p=1,
                    previous_response_id=previous_response_id,
                    input=[
                        {"role": "user", "content": fix_prompt},
                        {"role": "user", "content": content},
                    ],
                )
                previous_response_id = response.id
                content = response.output_text
                if not content:
                    raise RuntimeError(
                        f"LLM correction attempt {attempt} returned no content."
                    )

            except Exception as api_err:
                last_error = api_err
                logging.error(f"API error during correction attempt: {api_err}")
                if attempt == max_retries:
                    logging.error("Exceeded max retries due to API errors.")
                # continue to next attempt

        except Exception as e:
            last_error = e
            logging.error(f"Unexpected error on attempt {attempt}: {e}", exc_info=True)
            if attempt == max_retries:
                logging.error("Exceeded max retries due to unexpected error.")

    raise RuntimeError(
        f"Failed to parse and validate after {max_retries} attempts. Last error: {last_error}"
    )
