FROM eclipse-temurin:21-jdk-alpine

RUN addgroup -S devora && adduser -S devora -G devora
RUN mkdir -p /app && chown devora:devora /app

USER devora
WORKDIR /app

CMD ["sh"]
