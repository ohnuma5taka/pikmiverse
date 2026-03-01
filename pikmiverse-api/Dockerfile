FROM python:3.12-slim-bookworm
WORKDIR /app

ENV PYTHONPATH=/app
ENV TZ=Asia/Tokyo

# tzdata をインストールしてタイムゾーンを設定
RUN apt-get update && apt-get install -y tzdata vim redis-server && \
    ln -snf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    echo "Asia/Tokyo" > /etc/timezone

# 時刻同期用
RUN apt-get update \
 && apt-get install -y --no-install-recommends ntpsec-ntpdate \
 && rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install -U pip
RUN pip install -r requirements.txt

EXPOSE 8000

COPY redis.conf /usr/local/etc/redis/redis.conf
RUN mkdir -p /usr/local/etc/redis/logs

CMD ["sh", "-c", "service redis-server start && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --ws-ping-interval 20 --ws-ping-timeout 60 --loop uvloop --http httptools"]
