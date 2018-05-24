FROM quanxiaoxiao/env

RUN mkdir /norice

WORKDIR /norice

RUN npm link
