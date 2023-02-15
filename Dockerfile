FROM node:16-alpine AS build

COPY . /build

WORKDIR /build


RUN npm install

ENV NODE_ENV=production

RUN npm run build && \
    npm run export

FROM joseluisq/static-web-server:2.11-alpine

COPY --from=build /build/out /public
COPY entrypoint.sh /entrypoint.sh

WORKDIR /public

ENTRYPOINT ["/entrypoint.sh"]
