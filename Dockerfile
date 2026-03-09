FROM node:20-alpine AS build

COPY . /build

WORKDIR /build


RUN npm install

ENV NODE_ENV=production

RUN npm run export

FROM joseluisq/static-web-server:2.11-alpine

COPY --from=build /build/out /public
EXPOSE 8787

WORKDIR /public

CMD ["static-web-server", "--port", "8787", "--root", "/public", "--log-level", "info"]
