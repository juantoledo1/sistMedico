# MedFlow Pro - Backend Dockerfile
FROM python:3.11-slim

# Labels
LABEL maintainer="MedFlow Pro Team"
LABEL version="1.0.0"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Puerto
EXPOSE 8000

# Directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY app/ ./app/

# Crear usuario no root (seguridad)
RUN adduser --disabled-password --gecos "" appuser || true
RUN chown -R appuser:appuser /app
USER appuser

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]