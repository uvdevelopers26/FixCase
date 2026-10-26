import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()


def _requerida(nombre):
    valor = os.getenv(nombre)
    if not valor:
        raise RuntimeError(f"Falta la variable {nombre} en el archivo .env")
    return valor


def build_database_uri(motor=None):
    """
    Construye la URI de conexión según el motor.

    DB_ENGINE=mysql  -> MariaDB/MySQL con las variables DB_*   (motor anterior)
    DB_ENGINE=mssql  -> SQL Server con las variables MSSQL_*

    Cambiar DB_ENGINE en el .env es todo lo que se necesita para alternar
    entre ambos motores.
    """
    motor = (motor or os.getenv("DB_ENGINE", "mysql")).strip().lower()

    if motor == "mssql":
        puerto = os.getenv("MSSQL_PORT")
        url = URL.create(
            "mssql+pyodbc",
            username=_requerida("MSSQL_USER"),
            password=_requerida("MSSQL_PASSWORD"),
            host=_requerida("MSSQL_HOST"),
            port=int(puerto) if puerto else None,
            database=_requerida("MSSQL_NAME"),
            query={
                "driver": os.getenv("MSSQL_DRIVER", "ODBC Driver 18 for SQL Server"),
                "TrustServerCertificate": os.getenv("MSSQL_TRUST_CERT", "yes"),
            },
        )
        # SQLAlchemy escapa por sí mismo los caracteres especiales de la clave
        return url.render_as_string(hide_password=False)

    if motor == "mysql":
        return (
            "mysql+pymysql://"
            f"{quote_plus(_requerida('DB_USER'))}:"
            f"{quote_plus(os.getenv('DB_PASSWORD', ''))}@"
            f"{_requerida('DB_HOST')}:"
            f"{os.getenv('DB_PORT', '3306')}/"
            f"{_requerida('DB_NAME')}"
        )

    raise RuntimeError(f"DB_ENGINE no válido: {motor!r}. Usa 'mysql' o 'mssql'.")


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
    DB_ENGINE = os.getenv("DB_ENGINE", "mysql").strip().lower()

    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME")

    SQLALCHEMY_DATABASE_URI = build_database_uri()

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