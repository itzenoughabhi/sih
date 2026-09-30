FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for GIS and GDAL/GEOS
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/backend/
WORKDIR /app/backend

ENV PYTHONPATH=/app:/app/backend
ENV DATA_DIR=/app/backend/data
ENV DEMO_DIR=/app/backend/data/demo
ENV UPLOAD_DIR=/app/backend/data/uploads

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

