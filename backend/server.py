import asyncio
import logging
import os
import socket
import subprocess
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from starlette.responses import JSONResponse, Response, StreamingResponse

ROOT_DIR = Path(__file__).parent
OPEN_SPECTER_BACKEND_DIR = Path("/app/open-specter-main/backend")
NODE_BACKEND_PORT = int(os.environ.get("OPEN_SPECTER_NODE_BACKEND_PORT", "3001"))
NODE_BACKEND_URL = f"http://127.0.0.1:{NODE_BACKEND_PORT}"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("open-specter-runtime-proxy")

app = FastAPI(title="Open Specter runtime proxy")
node_process: Optional[subprocess.Popen] = None

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) == 0


async def wait_for_node_backend(timeout_seconds: int = 30) -> bool:
    for _ in range(timeout_seconds * 5):
        if port_open(NODE_BACKEND_PORT):
            return True
        await asyncio.sleep(0.2)
    return False


@app.on_event("startup")
async def startup_node_backend() -> None:
    global node_process
    if port_open(NODE_BACKEND_PORT):
        logger.info("Open Specter Node backend already running on port %s", NODE_BACKEND_PORT)
        return

    dist_entry = OPEN_SPECTER_BACKEND_DIR / "dist" / "index.js"
    if not dist_entry.exists():
        logger.error("Open Specter backend build artifact is missing: %s", dist_entry)
        return

    log_file = open("/tmp/open-specter-node-backend.log", "ab", buffering=0)
    node_process = subprocess.Popen(
        ["node", "dist/index.js"],
        cwd=str(OPEN_SPECTER_BACKEND_DIR),
        stdout=log_file,
        stderr=log_file,
        env={**os.environ, "PORT": str(NODE_BACKEND_PORT)},
        start_new_session=True,
    )
    if await wait_for_node_backend():
        logger.info("Started Open Specter Node backend on port %s", NODE_BACKEND_PORT)
    else:
        logger.error("Open Specter Node backend did not become ready; see /tmp/open-specter-node-backend.log")


@app.on_event("shutdown")
async def shutdown_node_backend() -> None:
    global node_process
    if node_process and node_process.poll() is None:
        node_process.terminate()
        try:
            node_process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            node_process.kill()


@app.get("/")
async def root() -> dict:
    return {
        "ok": True,
        "service": "Open Specter runtime proxy",
        "node_backend": NODE_BACKEND_URL,
        "node_backend_ready": port_open(NODE_BACKEND_PORT),
    }


@app.api_route("/api", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_open_specter_backend(request: Request, path: str = "") -> Response:
    if not port_open(NODE_BACKEND_PORT):
        return JSONResponse(
            status_code=503,
            content={"detail": "Open Specter Node backend is not running"},
        )

    target = f"{NODE_BACKEND_URL}/{path}"
    if request.url.query:
        target = f"{target}?{request.url.query}"

    excluded_request_headers = {"host", "content-length", "connection"}
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in excluded_request_headers
    }
    body = await request.body()

    client = httpx.AsyncClient(timeout=None, follow_redirects=False)
    try:
        outbound = client.build_request(
            request.method,
            target,
            headers=headers,
            content=body,
        )
        upstream = await client.send(outbound, stream=True)
    except Exception as exc:
        await client.aclose()
        logger.exception("Failed to proxy request to Open Specter backend")
        return JSONResponse(status_code=502, content={"detail": str(exc)})

    excluded_response_headers = {
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "connection",
    }
    response_headers = {
        key: value
        for key, value in upstream.headers.items()
        if key.lower() not in excluded_response_headers
    }

    return StreamingResponse(
        upstream.aiter_raw(),
        status_code=upstream.status_code,
        headers=response_headers,
        background=BackgroundTask(_close_upstream, upstream, client),
    )


async def _close_upstream(upstream: httpx.Response, client: httpx.AsyncClient) -> None:
    await upstream.aclose()
    await client.aclose()
