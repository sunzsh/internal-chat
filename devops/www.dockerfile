FROM registry.cn-shanghai.aliyuncs.com/kk_plus_plus/nginx:stable-alpine
COPY /www /usr/src/www
COPY /devops/nginxvhost.conf /etc/nginx/conf.d/default.conf