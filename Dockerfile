# Production build for the Slimewave Go web app.
# Multi-stage: compile a static binary, then run it on a minimal Alpine image.

FROM golang:1.22-alpine AS build
WORKDIR /src
# Only stdlib + local package, so module download is a no-op but kept for correctness.
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/slimewave .

FROM alpine:3.20
RUN adduser -D -u 10001 app
WORKDIR /app
# Runtime assets the handlers read by relative path.
COPY --from=build /out/slimewave           /app/slimewave
COPY --from=build /src/*.html              /app/
COPY --from=build /src/styles.css          /app/
COPY --from=build /src/music.json          /app/
COPY --from=build /src/static              /app/static
COPY --from=build /src/audio               /app/audio
COPY --from=build /src/PDFs                /app/PDFs
RUN chown -R app:app /app
USER app
EXPOSE 8001
ENTRYPOINT ["/app/slimewave"]
