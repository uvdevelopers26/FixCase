from enum import Enum


class RolUsuario(str, Enum):
    ADMIN = "ADMIN"
    COORDINADOR = "COORDINADOR"
    BIOMEDICO = "BIOMEDICO"
    TECNICO = "TECNICO"
    CONSULTA = "CONSULTA"


class EstadoTarea(str, Enum):
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"


class EstadoActivo(str, Enum):
    ACTIVO = True
    INACTIVO = False


class TipoMantenimiento(str, Enum):
    PREVENTIVO = "Preventivo"
    CORRECTIVO = "Correctivo"
    PREDICTIVO = "Predictivo"
    INSTALACION = "Instalación"
    CALIBRACION = "Calibración"


class Prioridad(str, Enum):
    BAJA = "Baja"
    MEDIA = "Media"
    ALTA = "Alta"
    CRITICA = "Crítica"