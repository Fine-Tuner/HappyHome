"""Common decorators used across the application."""

from typing import TypeVar

T = TypeVar("T")


def not_implemented(cls: type[T]) -> type[T]:
    """Decorator that raises NotImplementedError when trying to instantiate a class.

    Args:
        cls: The class to be decorated

    Returns:
        The decorated class that raises NotImplementedError on instantiation

    Raises:
        NotImplementedError: When trying to instantiate the decorated class
    """

    def wrapper(*args, **kwargs):
        raise NotImplementedError(f"{cls.__name__} is not implemented yet")

    return wrapper
