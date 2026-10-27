FROM python:3.12-alpine

# Security: Create unprivileged devora group and user
RUN addgroup -S devora && adduser -S devora -G devora

# Create working directory and set ownership
RUN mkdir -p /app && chown devora:devora /app

USER devora
WORKDIR /app

# Default command
CMD ["sh"]
