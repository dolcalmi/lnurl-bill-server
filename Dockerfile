FROM node:18-alpine AS BUILD_IMAGE

WORKDIR /app

RUN apk update && apk add git

COPY ./*.json ./yarn.lock ./

RUN yarn install --frozen-lockfile

COPY ./src ./src

RUN yarn build

RUN rm -rf /app/node_modules
RUN yarn install --frozen-lockfile --production

FROM gcr.io/distroless/nodejs:18
COPY --from=BUILD_IMAGE /app/lib /app/lib
COPY --from=BUILD_IMAGE /app/node_modules /app/node_modules

WORKDIR /app
COPY ./*.js ./package.json ./tsconfig.json ./yarn.lock ./

USER 1000

ARG BUILDTIME
ARG COMMITHASH
ARG PORT=3000

ENV BUILDTIME ${BUILDTIME}
ENV COMMITHASH ${COMMITHASH}
ENV PORT ${PORT}

EXPOSE ${PORT}

CMD ["lib/servers/run.js"]
