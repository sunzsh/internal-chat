# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制项目文件到工作目录
COPY . .

# 进入server目录
WORKDIR /usr/src/app/server

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 8081

# 启动应用
CMD ["node", "index.js"]