#!/bin/bash

# Docker 构建脚本
# 用法: ./docker-build.sh [环境]
# 环境: prod (默认) | dev

set -e

ENV="${1:-prod}"
IMAGE_NAME="opensabre-admin"
VERSION="$(node -p "require('./package.json').version")"

case "$ENV" in
    "prod")
        echo "构建生产环境镜像..."
        docker build -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" .
        echo "生产环境镜像构建完成: ${IMAGE_NAME}:${VERSION}"
        ;;
    *)
        echo "错误: 未知环境 '$ENV'"
        echo "用法: $0 [prod|dev]"
        exit 1
        ;;
esac

echo ""
echo "可用镜像:"
docker images | grep "${IMAGE_NAME}"
