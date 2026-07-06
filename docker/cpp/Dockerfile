FROM alpine:3.19

RUN apk add --no-cache g++ make

RUN addgroup -S devora && adduser -S devora -G devora
RUN mkdir -p /app && chown devora:devora /app

USER devora
WORKDIR /app

CMD ["sh"]
