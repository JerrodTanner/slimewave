# Production image for slimewave.
#
# Three stages: build the SvelteKit bundle, build a static Go binary, then
# copy both onto a minimal runtime image. The Go binary serves the API, the
# music library and the SPA, so the container runs one process.

# --- stage 1: the frontend ---
FROM node:22-alpine AS web
WORKDIR /web
# Install against the lockfile first so dependency layers cache independently
# of source changes.
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- stage 2: the server ---
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ ./cmd/
COPY internal/ ./internal/
# CGO off: the SQLite driver is pure Go, so the binary is fully static.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/slimewave ./cmd/slimewave

# --- stage 3: runtime ---
FROM alpine:3.20
RUN adduser -D -u 10001 app
WORKDIR /app

COPY --from=build /out/slimewave /app/slimewave
COPY --from=web   /web/build     /app/web/build
# Content served straight off disk.
COPY audio/ /app/audio/
COPY PDFs/  /app/PDFs/

# The SQLite file lives here; mount a volume over it to keep data across
# deploys, since the image itself is replaced on every push.
RUN mkdir -p /app/data && chown -R app:app /app
USER app
VOLUME ["/app/data"]

ENV SLIMEWAVE_ADDR=:8001 \
    SLIMEWAVE_DB=/app/data/slimewave.db \
    SLIMEWAVE_WEB_DIR=/app/web/build \
    SLIMEWAVE_AUDIO_DIR=/app/audio \
    SLIMEWAVE_DOCS_DIR=/app/PDFs \
    SLIMEWAVE_SECURE_COOKIES=true

EXPOSE 8001
ENTRYPOINT ["/app/slimewave"]
