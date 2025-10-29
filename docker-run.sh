#!/bin/bash

# Docker 运行脚本
# 用法: ./docker-run.sh [环境]
# 环境: prod (默认) | dev

set -e

ENV="${1:-prod}"
IMAGE_NAME="opensabre-admin"
CONTAINER_NAME="opensabre-admin-${ENV}"

case "$ENV" in
    "prod")
        PORT="8080"
        echo "启动生产环境容器..."
        docker run -d \
            --name "${CONTAINER_NAME}" \
            -p "${PORT}:80" \
            --restart unless-stopped \
            "${IMAGE_NAME}:latest"
        echo "生产环境容器已启动，访问: http://localhost:${PORT}"
        ;;
    *)
        echo "错误: 未知环境 '$ENV'"
        echo "用法: $0 [prod|dev]"
        exit 1
        ;;
esac

echo ""
echo "容器状态:"
docker ps | grep "${CONTAINER_NAME}"
