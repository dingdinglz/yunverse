"""曲谱模式 API（列表 / 详情 / 开始 / 推进 / 停止）。

路由前缀 /api/v1/scores，与主接口分离。
"""

from __future__ import annotations

from fastapi import APIRouter, Request

from .envelope import ApiError, success_body

router = APIRouter(prefix="/api/v1/scores")


@router.get("")
async def list_scores(request: Request):
    """获取可用曲谱列表。"""
    score_store = request.app.state.score_store
    return success_body({"scores": score_store.list_scores()})


@router.get("/active")
async def get_active_score(request: Request):
    """获取当前活跃曲谱状态（进度、窗口音符等）。"""
    score_store = request.app.state.score_store
    return success_body(score_store.active_state())


@router.get("/{score_id}")
async def get_score(request: Request, score_id: str):
    """获取曲谱完整详情（含全部 notes）。"""
    score_store = request.app.state.score_store
    score = score_store.get_score(score_id)
    if score is None:
        raise ApiError("SCORE_NOT_FOUND", f"曲谱不存在: {score_id}", {"scoreId": score_id})
    return success_body(score)


@router.post("/{score_id}/start")
async def start_score(request: Request, score_id: str):
    """激活曲谱模式：设置当前曲谱并将进度归零。"""
    score_store = request.app.state.score_store
    try:
        state = score_store.start(score_id)
    except KeyError:
        raise ApiError("SCORE_NOT_FOUND", f"曲谱不存在: {score_id}", {"scoreId": score_id})
    return success_body(state)


@router.post("/stop")
async def stop_score(request: Request):
    """停止曲谱模式。"""
    score_store = request.app.state.score_store
    state = score_store.stop()
    return success_body(state)


@router.post("/advance")
async def advance_score(request: Request):
    """手动推进到下一个音符（不依赖演奏匹配）。"""
    score_store = request.app.state.score_store
    state = score_store.advance()
    return success_body(state)
