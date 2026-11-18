# Build image backend untuk layanan hosting (Render, Railway, Fly.io, dll).
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY . .
RUN go mod tidy && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/notes-server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/notes-server /notes-server
ENV GIN_MODE=release
EXPOSE 8080
ENTRYPOINT ["/notes-server"]
