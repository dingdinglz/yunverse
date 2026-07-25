"""语音指令处理：ASR 转写 + LLM 意图识别 + 乐器切换执行。

使用 StepFun API（OpenAI 兼容格式），不依赖 LangChain。
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

import httpx

if TYPE_CHECKING:
    from .state_store import StateStore

logger = logging.getLogger(__name__)

INSTRUMENT_ALIASES: dict[str, str] = {
    "吉他": "guitar",
    "guitar": "guitar",
    "琵琶": "pipa",
    "pipa": "pipa",
    "唢呐": "suona",
    "suona": "suona",
}

CHANGE_INSTRUMENT_TOOL = {
    "type": "function",
    "function": {
        "name": "change_instrument",
        "description": "切换当前演奏乐器",
        "parameters": {
            "type": "object",
            "properties": {
                "instrument": {
                    "type": "string",
                    "enum": ["guitar", "pipa", "suona"],
                    "description": "目标乐器: guitar=吉他, pipa=琵琶, suona=唢呐",
                }
            },
            "required": ["instrument"],
        },
    },
}

SYSTEM_PROMPT = (
    "你是一个智能乐器控制助手。用户会通过语音告诉你想切换到哪个乐器。"
    "支持的乐器有：吉他(guitar)、琵琶(pipa)、唢呐(suona)。"
    "如果用户明确表达了切换乐器的意图，请调用 change_instrument 工具。"
    "如果用户的话与乐器切换无关，直接回复即可，不要调用工具。"
)


@dataclass
class VoiceConfig:
    enabled: bool = False
    stepfun_api_key: str = ""
    stepfun_base_url: str = "https://api.stepfun.com/v1"
    asr_model: str = "stepaudio-2.5-asr"
    llm_model: str = "step-3.7-flash"


class VoiceAgent:
    def __init__(self, config: VoiceConfig) -> None:
        self._cfg = config
        self._client = httpx.AsyncClient(
            base_url=config.stepfun_base_url,
            headers={"Authorization": f"Bearer {config.stepfun_api_key}"},
            timeout=30.0,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def transcribe(self, audio_path: str) -> str | None:
        """音频文件 → 文本（StepFun ASR）。"""
        path = Path(audio_path)
        if not path.exists():
            logger.warning("语音文件不存在: %s", audio_path)
            return None

        try:
            with open(path, "rb") as f:
                resp = await self._client.post(
                    "/audio/transcriptions",
                    files={"file": (path.name, f, "audio/wav")},
                    data={"model": self._cfg.asr_model, "language": "zh"},
                )
            resp.raise_for_status()
            text = resp.json().get("text", "").strip()
            logger.info("ASR 识别结果: %s", text)
            return text or None
        except Exception as e:
            logger.error("ASR 请求失败: %s", e)
            return None

    async def parse_intent(self, text: str) -> dict[str, Any] | None:
        """文本 → 意图（StepFun LLM + function calling）。"""
        try:
            resp = await self._client.post(
                "/chat/completions",
                json={
                    "model": self._cfg.llm_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": text},
                    ],
                    "tools": [CHANGE_INSTRUMENT_TOOL],
                    "tool_choice": "auto",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]["message"]
            tool_calls = choice.get("tool_calls")
            if not tool_calls:
                logger.info("LLM 未调用工具，回复: %s", choice.get("content", ""))
                return None
            call = tool_calls[0]
            if call["function"]["name"] == "change_instrument":
                args = json.loads(call["function"]["arguments"])
                return {"instrument": args["instrument"]}
        except Exception as e:
            logger.error("LLM 意图解析失败: %s", e)
        return None

    async def process_voice_command(
        self,
        audio_path: str,
        state_store: "StateStore",
        publish_fn: Any = None,
    ) -> dict[str, Any]:
        """完整语音指令流程：ASR → 意图 → 执行切换。"""

        def _pub(state: str, **kwargs: Any) -> None:
            if publish_fn:
                publish_fn("voice", {"state": state, **kwargs})

        _pub("processing", phase="asr")
        text = await self.transcribe(audio_path)
        if not text:
            _pub("error", message="语音识别失败")
            return {"switched": False, "reason": "asr_failed"}

        _pub("processing", phase="intent", text=text)
        intent = await self.parse_intent(text)
        if not intent:
            _pub("no_match", text=text, reason="unrecognized")
            return {"switched": False, "text": text, "reason": "unrecognized"}

        instrument = intent["instrument"]
        state_store.update_selection(instrument, None)
        _pub("done", instrument=instrument, text=text)
        logger.info("语音切换乐器: %s (原文: %s)", instrument, text)
        return {"switched": True, "instrument": instrument, "text": text}
