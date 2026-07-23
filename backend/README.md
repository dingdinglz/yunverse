# 虚拟乐器演奏项目后端 (virtual-instrument-backend)

接收手机端演奏请求（乐器 + 音调 + 音符），结合戒指手势解析出技法，选择并播放
对应 WAV；同时向电脑网页前端提供状态与历史查询。实现遵循 `backend.md`（设计）
与 `../api.md`（HTTP API 规范）。

## 环境与依赖

- Python 3.11+
- 使用 [uv](https://github.com/astral-sh/uv) 管理

```bash
uv venv
uv pip install -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple \
    fastapi "uvicorn[standard]" numpy bleak
uv pip install -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple pytest httpx
```

## 运行

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080
# 或
uv run python -m app.main
```

- 基础地址：`http://localhost:8080/api/v1`
- 健康检查：`GET /api/v1/health`

## 接口 (详见 ../api.md)

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET  | `/api/v1/health` | 健康检查 |
| GET  | `/api/v1/config` | 枚举配置（乐器/音调/音符/技法） |
| POST | `/api/v1/play` | 触发一次演奏 |
| GET  | `/api/v1/state` | 当前演奏状态 |
| GET  | `/api/v1/history` | 历史记录 |
| POST | `/api/v1/ring/gesture` | 上报戒指手势 |

## 配置 (config.json，见 backend.md §8)

关键项：`server.port`、`audio.rootDir`、`playback.queueMode/maxQueue`、
`gesture.expireMs/fallbackTechnique/mapping`、`history.maxSize`、
`cors.allowOrigins`、`ring.enabled/address`、`auth.enabled/token`。

部分项支持环境变量覆盖：`APP_PORT`、`APP_HOST`、`AUDIO_ROOT`、`RING_ENABLED`、`RING_ADDRESS`。

## 音频资源

见 `audio/README.md`。目录约定：`audio/<instrument>/<key_pathCode>/<technique>/<note>.wav`。
默认目录为空，`/play` 在缺资源时返回 `AUDIO_NOT_FOUND`。

## 戒指集成

- `POST /api/v1/ring/gesture`：戒指网关/硬件服务上报手势。
- 实时 BLE：把 `ring.enabled` 设为 `true` 并配置 `ring.address`，后端会用后台线程
  连接戒指、开启 IMU、实时识别手势并更新技法（代码见 `app/ring_worker.py`，
  复用 `vendor/` 下的 `gesture_engine`/`gesture_store`/`ring_sound_SDK`）。
- 手势→技法映射规则文档待补充；默认所有手势回退到 `normal`，可在
  `config.json` 的 `gesture.mapping` / `gesture.techniques` 中扩展。

## 测试

```bash
uv run pytest
```

## 目录结构

```
app/            # 后端源码（分层：api / orchestrator / gesture / audio / playback / state）
vendor/         # 从 advx 复制的戒指识别代码（gesture_engine/gesture_store/ring_sound_SDK/gestures）
audio/          # 音频资源目录（约定见 audio/README.md）
config.json     # 运行配置
tests/          # pytest 用例
```
