"""Configuração centralizada de logs da aplicação."""

import logging.config
import sys

from app.core.config import LOG_LEVEL


def configure_logging() -> None:
    """Configura logs estruturados no stdout, adequados para containers."""
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "standard": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                    "formatter": "standard",
                }
            },
            "root": {"handlers": ["console"], "level": LOG_LEVEL},
        }
    )


configure_logging()
