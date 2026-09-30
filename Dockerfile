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

# Copy requirements from either root or backend/ directory
COPY requirements.txt* backend/requirements.txt* /app/
RUN if [ -f /app/requirements.txt ]; then pip install --no-cache-dir -r /app/requirements.txt; else pip install --no-cache-dir -r /app/backend/requirements.txt; fi

# Copy backend files cleanly regardless of build context (root or backend)
COPY . /app/temp_src/
RUN if [ -d /app/temp_src/backend ]; then \
        cp -r /app/temp_src/backend /app/backend; \
    else \
        mkdir -p /app/backend && cp -r /app/temp_src/* /app/backend/; \
    fi && rm -rf /app/temp_src

WORKDIR /app/backend

ENV PYTHONPATH=/app:/app/backend
ENV DATA_DIR=/app/backend/data
ENV DEMO_DIR=/app/backend/data/demo
ENV UPLOAD_DIR=/app/backend/data/uploads

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
