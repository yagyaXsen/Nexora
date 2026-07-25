import logging
import smtplib
from abc import ABC, abstractmethod
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


class Mailer(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, html: str) -> None:
        """Deliver an HTML email or raise an exception."""


class ConsoleMailer(Mailer):
    """Development mailer. It deliberately logs the rendered reset link only
    locally, making the complete reset flow testable without a provider."""

    def send(self, to: str, subject: str, html: str) -> None:
        logger.info("Console email to %s | %s\n%s", to, subject, html)


class SmtpMailer(Mailer):
    def send(self, to: str, subject: str, html: str) -> None:
        if not settings.SMTP_HOST:
            raise RuntimeError("SMTP_HOST must be configured when MAILER=smtp")

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        message["To"] = to
        message.set_content("Open this message in an HTML-capable email client.")
        message.add_alternative(html, subtype="html")

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)


def get_mailer() -> Mailer:
    driver = settings.MAILER.lower()
    if driver == "console":
        return ConsoleMailer()
    if driver == "smtp":
        return SmtpMailer()
    raise RuntimeError(f"Unsupported MAILER driver: {settings.MAILER}")
