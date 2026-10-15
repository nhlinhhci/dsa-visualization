# --- Build giao diện ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Image chạy thật: Node + Python, g++, JDK để chạy code sinh viên ---
FROM node:22-bookworm-slim
# gdb: đọc biến cục bộ của code C++.
# iproute2, procps, util-linux: các lệnh ip, pkill, prlimit, unshare, setpriv mà sandbox dùng.
# tini: PID 1 thu dọn tiến trình mồ côi (xem ENTRYPOINT).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 g++ gdb default-jdk-headless iproute2 procps util-linux tini \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# Server chỉ dùng module có sẵn của Node nên không cần node_modules.
COPY package.json ./
COPY server ./server
COPY src ./src
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DSA_SANDBOX=1 \
    MAX_CONCURRENT_RUNS=4
EXPOSE 8080

# Chạy bằng root để server tạo được sandbox (đổi uid, tách mạng) cho từng lượt chạy code;
# bản thân code sinh viên luôn chạy bằng uid không có quyền.
# tini làm PID 1: tiến trình con mồ côi bị pkill (vd. fork bomb) được thu dọn ngay. Nếu không, zombie
# cứ tích lại và vẫn bị tính vào giới hạn --nproc của uid sandbox, làm slot đó hỏng luôn.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server/index.js"]
