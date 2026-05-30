FROM python:3.11-slim-bookworm

LABEL maintainer="Studio Order Management"
LABEL description="摄影工作室订单管理系统 - Docker 部署"

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    QT_QPA_PLATFORM=xcb \
    DISPLAY=:0 \
    LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    locales \
    libxcb1 \
    libxcb-cursor0 \
    libxcb-xinerama0 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-randr0 \
    libxcb-render-util0 \
    libxcb-shape0 \
    libxcb-sync1 \
    libxcb-xfixes0 \
    libxcb-xkb1 \
    libxkbcommon-x11-0 \
    libxkbcommon0 \
    libfontconfig1 \
    libfreetype6 \
    libdbus-1-3 \
    libegl1 \
    libgl1 \
    libglib2.0-0 \
    libx11-6 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libpulse0 \
    libasound2 \
    libssl3 \
    libcups2 \
    fonts-wqy-microhei \
    fonts-wqy-zenhei \
    x11-apps \
    xauth \
    && sed -i 's/# zh_CN.UTF-8 UTF-8/zh_CN.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen zh_CN.UTF-8 \
    && update-locale LANG=zh_CN.UTF-8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --timeout 300 --retries 5 PySide6>=6.6.0 \
    && pip install --no-cache-dir --timeout 120 --retries 5 Pillow>=10.0.0 \
    && pip install --no-cache-dir --timeout 120 --retries 5 openpyxl>=3.1.0

COPY . .

RUN mkdir -p /app/thumbnails /app/exports /app/backups /app/logs \
    && chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["python", "main.py"]
