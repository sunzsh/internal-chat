# 使用 Node.js 16 作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口（默认 8081，可通过环境变量或启动参数修改）
EXPOSE 8081

# 启动应用
# 支持通过环境变量 PORT 指定端口，或通过命令行参数指定
# 例如：docker run -e PORT=8081 或 docker run -- 8082
CMD ["sh", "-c", "node index.js ${PORT:-8081}"]

