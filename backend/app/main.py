"""FastAPI 应用装配 (backend.md §4 / api.md §2,§12,§13)。

- 挂载 /api/v1 路由
- CORS（默认允许 http://localhost:3000）
- 统一异常处理（ApiError / 参数校验 / 未捕获错误 -> api.md 失败结构）
- 可选 X-Device-Token 鉴权（默认关闭）
- lifespan：启动播放执行器与（可选）戒指 worker，关闭时优雅停止
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import SERVICE_NAME, SERVICE_VERSION
from .api import router
from .audio_resource import AudioResource
from .config import BASE_DIR, Config, load_config
from .envelope import ApiError, error_body, new_request_id
from .gesture import GestureStore, TechniqueRegistry
from .orchestrator import Orchestrator
from .playback import AfplayPlayer, PlaybackExecutor, Player
from .ring_api import router as ring_router
from .ring_manager import RingManager
from .score_api import router as score_router
from .score_store import ScoreStore
from .state_store import StateStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def create_app(
    config: Config | None = None,
    player: Player | None = None,
    start_ring: bool | None = None,
) -> FastAPI:
    cfg = config or load_config()

    # -- 组件装配 --------------------------------------------------------
    registry = TechniqueRegistry(cfg.gesture.techniques)
    gesture_store = GestureStore(
        registry,
        expire_ms=cfg.gesture.expireMs,
        mapping=cfg.gesture.mapping,
        fallback=cfg.gesture.fallbackTechnique,
        min_confidence=cfg.gesture.minConfidence,
    )
    audio = AudioResource(cfg.audio_root, root_name=Path(cfg.audio.rootDir).name or "audio")
    playback = PlaybackExecutor(
        player or AfplayPlayer(),
        device=cfg.playback.device,
    )
    state_store = StateStore(max_size=cfg.history.maxSize)
    scores_dir = BASE_DIR / "scores"
    score_store = ScoreStore(
        scores_dir,
        on_change=lambda snap: state_store._publish({"type": "score", "data": snap}),
    )
    orchestrator = Orchestrator(gesture_store, audio, playback, state_store, score_store)

    ring_enabled = cfg.ring.enabled if start_ring is None else start_ring
    ring_manager = RingManager(gesture_store, gesture_config=cfg.gesture, state_store=state_store)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await playback.start()
        if ring_enabled and cfg.ring.address:
            ring_manager.auto_connect(cfg.ring.address)
        logger.info("%s v%s 已就绪", SERVICE_NAME, SERVICE_VERSION)
        try:
            yield
        finally:
            ring_manager.shutdown()
            await playback.stop()

    app = FastAPI(title=SERVICE_NAME, version=SERVICE_VERSION, lifespan=lifespan)

    # 共享组件挂到 app.state
    app.state.cfg = cfg
    app.state.registry = registry
    app.state.gesture_store = gesture_store
    app.state.audio = audio
    app.state.playback = playback
    app.state.state_store = state_store
    app.state.orchestrator = orchestrator
    app.state.score_store = score_store
    app.state.ring_manager = ring_manager

    # -- CORS (api.md §13：不使用通配，明确来源) ------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors.allowOrigins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -- 可选鉴权 (api.md §12) ------------------------------------------
    if cfg.auth.enabled:
        @app.middleware("http")
        async def device_token_mw(request: Request, call_next):
            path = request.url.path
            if request.method == "OPTIONS" or path.endswith("/health") or not path.startswith("/api/"):
                return await call_next(request)
            token = request.headers.get("X-Device-Token")
            if not token or token != cfg.auth.token:
                return JSONResponse(
                    status_code=401,
                    content=error_body("UNAUTHORIZED", "设备令牌无效或缺失"),
                )
            return await call_next(request)

    # -- 统一异常处理 ---------------------------------------------------
    @app.exception_handler(ApiError)
    async def _api_error_handler(request: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.http_status,
            content=error_body(exc.code, exc.message, exc.details, new_request_id()),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        details: dict = {}
        if errors:
            first = errors[0]
            loc = [x for x in first.get("loc", []) if x != "body"]
            details = {
                "field": ".".join(str(x) for x in loc) if loc else None,
                "reason": first.get("msg"),
            }
            if "input" in first:
                details["value"] = first.get("input")
        return JSONResponse(
            status_code=400,
            content=error_body("INVALID_PARAMETER", "请求参数不合法", details, new_request_id()),
        )

    @app.exception_handler(Exception)
    async def _unhandled_handler(request: Request, exc: Exception):
        logger.exception("未处理异常: %s", exc)
        return JSONResponse(
            status_code=500,
            content=error_body("INTERNAL_ERROR", "内部错误", request_id=new_request_id()),
        )

    app.include_router(router)
    app.include_router(ring_router)
    app.include_router(score_router)
    return app


app = create_app()


def main() -> None:
    import uvicorn

    cfg = load_config()
    uvicorn.run(app, host=cfg.server.host, port=cfg.server.port)


if __name__ == "__main__":
    main()
