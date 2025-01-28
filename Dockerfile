# 第一阶段：构建服务器
FROM node:16.20.2 AS server

# 设置工作目录
WORKDIR /server

# 先复制 package.json 和 package-lock.json，以便更好地利用 Docker 缓存
COPY server/package.json server/package-lock.json ./

# 安装依赖
RUN npm install

# 复制服务器代码
COPY server .

# 全局安装 pkg，用于将 Node.js 应用打包成可执行文件
RUN npm install -g pkg

# 使用 pkg 打包应用，指定目标为 node16，并指定输出文件名为 internal-chat
RUN pkg . --targets node16 -o internal-chat


# 第二阶段：构建前端并使用 nginx 提供服务
FROM nginx:alpine AS www

# 安装依赖库，可能包括 libstdc++ 和其他基础库
RUN apk add --no-cache libc6-compat libstdc++
RUN apk add --no-cache nano

# 从 server 阶段复制打包好的可执行文件
COPY --from=server /server/internal-chat /server/internal-chat
COPY --from=server /server/room_pwd.json /server/room_pwd.json

# 复制 nginx 配置文件到容器中
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 复制前端静态文件到 nginx 的默认静态文件目录
COPY www /usr/share/nginx/html

# 暴露端口
EXPOSE 3411

# 启动
CMD ["sh", "-c", "nginx -g 'daemon off;' & /server/internal-chat 8081"]