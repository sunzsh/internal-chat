## 普通镜像构建，随系统版本构建 amd/arm
#docker build -t ly2022/internal-chat:1.0 -f ./Dockerfile .

# 兼容 amd、arm 构建镜像
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap
docker buildx build --load --platform linux/amd64 -t ly2022/internal-chat:1.0 -f ./Dockerfile .
