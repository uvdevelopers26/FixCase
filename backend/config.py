import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    """
    Configuración base para todos los ambientes.
    """

    # ==========================
    # Flask
    # ==========================
    SECRET_KEY = os.getenv("SECRET_KEY")
    JSON_SORT_KEYS = False

    # ==========================
    # Base de datos
    # ==========================
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME")

    SQLALCHEMY_DATABASE_URI = (
        "mysql+pymysql://"
        f"{quote_plus(DB_USER)}:"
        f"{quote_plus(DB_PASSWORD)}@"
        f"{DB_HOST}:"
        f"{DB_PORT}/"
        f"{DB_NAME}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    }

    # ==========================
    # JWT
    # ==========================
    JWT_EXPIRATION_HOURS = 8

    # ==========================
    # API
    # ==========================
    API_NAME = "InfraTrack"
    API_VERSION = "1.0.0"


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = False


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}