# 虚拟乐器演奏项目 API 文档

## 1. 文档概述

本文档定义虚拟乐器演奏项目的后端 HTTP API。API 服务连接手机客户端、电脑网站前端和后端播放系统。手机客户端通过 API 触发演奏，电脑网站前端通过 API 获取当前状态和历史记录。

本文档中的接口使用 JSON 作为请求和响应格式。接口路径统一以 `/api/v1` 开头。除健康检查外，所有接口都建议返回统一响应结构，便于客户端处理成功和失败场景。

## 2. 基础约定

### 2.1 Base URL

开发环境示例：

```text
http://localhost:8080/api/v1
```

局域网演示环境示例：

```text
http://192.168.1.10:8080/api/v1
```

### 2.2 Content-Type

请求体为 JSON 的接口必须使用：

```text
Content-Type: application/json
```

响应体默认使用：

```text
Content-Type: application/json; charset=utf-8
```

### 2.3 统一响应格式

成功响应格式：

```json
{
  "success": true,
  "data": {},
  "requestId": "req_20260723224300001"
}
```

失败响应格式：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "note 参数不合法",
    "details": {
      "field": "note",
      "value": "sol"
    }
  },
  "requestId": "req_20260723224300001"
}
```

### 2.4 时间格式

所有时间字段使用 ISO 8601 格式，并带时区信息。例如：

```text
2026-07-23T22:43:00+08:00
```

### 2.5 乐器编码

| code | 展示名称 | 说明 |
| --- | --- | --- |
| guitar | 吉他 | 首期支持乐器 |
| pipa | 琵琶 | 首期支持乐器，中国传统乐器琵琶 |

### 2.6 音调编码

音调支持标准音名 C、D、E、F、G、A、B 及其升降号变体。推荐默认支持以下编码：

```json
["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]
```

接口可保留对 B#、Cb、E#、Fb 的扩展能力，但是否启用取决于后端音频资源配置。

### 2.7 音符编码

| code | 展示名 | 说明 |
| --- | --- | --- |
| do | do | 1 级音 |
| ri | ri | 2 级音 |
| mi | mi | 3 级音 |
| fa | fa | 4 级音 |
| so | so | 5 级音 |
| la | la | 6 级音 |
| xi | xi | 7 级音 |
| do_high | do | 高音 1 级音 |

用户需求中提到七个按钮，同时列出 do ri mi fa so la xi do。接口建议支持 `do_high`，以便表达最后一个高音 do。如果产品最终确认只有七个按钮，可在配置接口中不返回 `do_high`。

### 2.8 技法编码

技法由后端根据戒指手势确定。具体手势到技法的映射规则详见手势说明文档（待补充）。接口中先约定基础默认技法：

| code | 展示名称 | 说明 |
| --- | --- | --- |
| normal | 普通演奏 | 无有效手势或默认技法 |

后续可以扩展 `pluck`、`strum`、`slide`、`vibrato` 等编码，具体以配置接口返回为准。

## 3. 接口列表

| 方法 | 路径 | 用途 | 调用方 |
| --- | --- | --- | --- |
| GET | /api/v1/health | 健康检查 | 手机客户端、电脑网站前端 |
| GET | /api/v1/config | 获取枚举配置 | 手机客户端、电脑网站前端 |
| POST | /api/v1/play | 触发一次演奏播放 | 手机客户端 |
| GET | /api/v1/state | 获取当前演奏状态 | 电脑网站前端 |
| GET | /api/v1/history | 获取历史记录 | 电脑网站前端 |
| POST | /api/v1/ring/gesture | 上报戒指手势 | 戒指网关或硬件服务 |

## 4. 健康检查接口

### 4.1 基本信息

```text
GET /api/v1/health
```

该接口用于检查后端服务是否可用。手机客户端和电脑网站前端可以在启动时调用。

### 4.2 请求参数

无。

### 4.3 成功响应示例

HTTP 状态码：`200`

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "virtual-instrument-backend",
    "version": "1.0.0",
    "time": "2026-07-23T22:43:00+08:00"
  },
  "requestId": "req_20260723224300001"
}
```

### 4.4 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| status | string | 服务状态，正常为 `ok` |
| service | string | 服务名称 |
| version | string | 服务版本 |
| time | string | 服务端当前时间 |

## 5. 获取枚举配置接口

### 5.1 基本信息

```text
GET /api/v1/config
```

该接口用于获取当前后端支持的乐器、音调、音符和技法。手机客户端可以用它渲染选择器，电脑网站前端可以用它做展示映射。

### 5.2 请求参数

无。

### 5.3 成功响应示例

HTTP 状态码：`200`

```json
{
  "success": true,
  "data": {
    "instruments": [
      {
        "code": "guitar",
        "name": "吉他",
        "enabled": true
      },
      {
        "code": "pipa",
        "name": "琵琶",
        "enabled": true
      }
    ],
    "keys": [
      "C",
      "C#",
      "Db",
      "D",
      "D#",
      "Eb",
      "E",
      "F",
      "F#",
      "Gb",
      "G",
      "G#",
      "Ab",
      "A",
      "A#",
      "Bb",
      "B"
    ],
    "notes": [
      {
        "code": "do",
        "label": "do",
        "degree": 1
      },
      {
        "code": "ri",
        "label": "ri",
        "degree": 2
      },
      {
        "code": "mi",
        "label": "mi",
        "degree": 3
      },
      {
        "code": "fa",
        "label": "fa",
        "degree": 4
      },
      {
        "code": "so",
        "label": "so",
        "degree": 5
      },
      {
        "code": "la",
        "label": "la",
        "degree": 6
      },
      {
        "code": "xi",
        "label": "xi",
        "degree": 7
      },
      {
        "code": "do_high",
        "label": "do",
        "degree": 8
      }
    ],
    "techniques": [
      {
        "code": "normal",
        "name": "普通演奏"
      }
    ]
  },
  "requestId": "req_20260723224300002"
}
```

### 5.4 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| instruments | array | 可用乐器列表 |
| keys | array | 可用音调列表 |
| notes | array | 可用音符按钮列表 |
| techniques | array | 可用技法列表 |

## 6. 触发演奏接口

### 6.1 基本信息

```text
POST /api/v1/play
```

该接口由手机客户端调用，用于触发一次演奏。手机客户端发送乐器、音调和音符。后端收到请求后，根据当前戒指手势确定技法，并播放对应 WAV 文件一次。

### 6.2 请求体

```json
{
  "instrument": "pipa",
  "key": "D",
  "note": "so"
}
```

### 6.3 请求字段说明

| 字段 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| instrument | string | 是 | pipa | 乐器编码，支持 `guitar`、`pipa` |
| key | string | 是 | D | 音调，支持 C、D、E、F、G、A、B 及升降号变体 |
| note | string | 是 | so | 音符编码，支持 do、ri、mi、fa、so、la、xi、do_high |

### 6.4 成功响应示例

HTTP 状态码：`200`

```json
{
  "success": true,
  "data": {
    "eventId": "evt_20260723224300001",
    "instrument": {
      "code": "pipa",
      "name": "琵琶"
    },
    "key": "D",
    "note": {
      "code": "so",
      "label": "so"
    },
    "technique": {
      "code": "normal",
      "name": "普通演奏"
    },
    "audio": {
      "path": "audio/pipa/D/normal/so.wav",
      "format": "wav"
    },
    "playback": {
      "played": true,
      "status": "played",
      "submittedAt": "2026-07-23T22:43:00+08:00"
    },
    "warnings": []
  },
  "requestId": "req_20260723224300003"
}
```

### 6.5 使用默认技法的成功响应示例

当戒指未连接或手势过期时，后端可以使用默认技法 `normal`，并通过 `warnings` 提示。

```json
{
  "success": true,
  "data": {
    "eventId": "evt_20260723224300002",
    "instrument": {
      "code": "guitar",
      "name": "吉他"
    },
    "key": "C#",
    "note": {
      "code": "do_high",
      "label": "do"
    },
    "technique": {
      "code": "normal",
      "name": "普通演奏"
    },
    "audio": {
      "path": "audio/guitar/C_sharp/normal/do_high.wav",
      "format": "wav"
    },
    "playback": {
      "played": true,
      "status": "played",
      "submittedAt": "2026-07-23T22:43:05+08:00"
    },
    "warnings": [
      "戒指未连接，已使用默认技法 normal"
    ]
  },
  "requestId": "req_20260723224300004"
}
```

### 6.6 失败响应示例：参数错误

HTTP 状态码：`400`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "instrument 参数不合法",
    "details": {
      "field": "instrument",
      "value": "drum",
      "allowedValues": ["guitar", "pipa"]
    }
  },
  "requestId": "req_20260723224300005"
}
```

### 6.7 失败响应示例：音频资源不存在

HTTP 状态码：`404`

```json
{
  "success": false,
  "error": {
    "code": "AUDIO_NOT_FOUND",
    "message": "未找到对应的音频资源",
    "details": {
      "instrument": "pipa",
      "key": "D",
      "note": "so",
      "technique": "normal",
      "expectedPath": "audio/pipa/D/normal/so.wav"
    }
  },
  "requestId": "req_20260723224300006"
}
```

### 6.8 失败响应示例：播放设备不可用

HTTP 状态码：`503`

```json
{
  "success": false,
  "error": {
    "code": "PLAYBACK_DEVICE_UNAVAILABLE",
    "message": "播放设备不可用，请检查音频输出设备",
    "details": {
      "device": "default"
    }
  },
  "requestId": "req_20260723224300007"
}
```

## 7. 获取当前状态接口

### 7.1 基本信息

```text
GET /api/v1/state
```

该接口由电脑网站前端调用，用于展示当前乐器、音调、技法、最近音符和戒指连接状态。

### 7.2 请求参数

无。

### 7.3 成功响应示例

HTTP 状态码：`200`

```json
{
  "success": true,
  "data": {
    "instrument": {
      "code": "pipa",
      "name": "琵琶"
    },
    "key": "D",
    "note": {
      "code": "so",
      "label": "so"
    },
    "technique": {
      "code": "normal",
      "name": "普通演奏"
    },
    "playback": {
      "status": "played",
      "lastPlayedAt": "2026-07-23T22:43:00+08:00",
      "lastEventId": "evt_20260723224300001"
    },
    "ring": {
      "connected": true,
      "deviceId": "ring-001",
      "gestureCode": "gesture_001",
      "confidence": 0.93,
      "updatedAt": "2026-07-23T22:42:59+08:00"
    }
  },
  "requestId": "req_20260723224300008"
}
```

### 7.4 空状态响应示例

服务刚启动且尚未发生演奏时，可以返回空闲状态。

```json
{
  "success": true,
  "data": {
    "instrument": null,
    "key": null,
    "note": null,
    "technique": null,
    "playback": {
      "status": "idle",
      "lastPlayedAt": null,
      "lastEventId": null
    },
    "ring": {
      "connected": false,
      "deviceId": null,
      "gestureCode": null,
      "confidence": null,
      "updatedAt": null
    }
  },
  "requestId": "req_20260723224300009"
}
```

## 8. 获取历史记录接口

### 8.1 基本信息

```text
GET /api/v1/history
```

该接口由电脑网站前端调用，用于展示最近演奏历史。

### 8.2 Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| limit | number | 否 | 50 | 返回条数，建议最大 100 |
| cursor | string | 否 | 无 | 分页游标，首屏可不传 |

请求示例：

```text
GET /api/v1/history?limit=50
```

### 8.3 成功响应示例

HTTP 状态码：`200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "eventId": "evt_20260723224300001",
        "instrument": {
          "code": "pipa",
          "name": "琵琶"
        },
        "key": "D",
        "note": {
          "code": "so",
          "label": "so"
        },
        "technique": {
          "code": "normal",
          "name": "普通演奏"
        },
        "audio": {
          "path": "audio/pipa/D/normal/so.wav",
          "format": "wav"
        },
        "playback": {
          "status": "played",
          "played": true
        },
        "warnings": [],
        "createdAt": "2026-07-23T22:43:00+08:00"
      },
      {
        "eventId": "evt_20260723224255001",
        "instrument": {
          "code": "guitar",
          "name": "吉他"
        },
        "key": "C#",
        "note": {
          "code": "do_high",
          "label": "do"
        },
        "technique": {
          "code": "normal",
          "name": "普通演奏"
        },
        "audio": {
          "path": "audio/guitar/C_sharp/normal/do_high.wav",
          "format": "wav"
        },
        "playback": {
          "status": "played",
          "played": true
        },
        "warnings": [
          "戒指未连接，已使用默认技法 normal"
        ],
        "createdAt": "2026-07-23T22:42:55+08:00"
      }
    ],
    "nextCursor": null
  },
  "requestId": "req_20260723224300010"
}
```

### 8.4 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| items | array | 历史记录列表，按时间倒序排列 |
| nextCursor | string 或 null | 下一页游标，没有更多数据时为 null |

## 9. 戒指手势上报接口

### 9.1 基本信息

```text
POST /api/v1/ring/gesture
```

该接口由戒指网关或硬件服务调用，用于向后端上报当前手势。后端会根据手势更新当前技法。具体手势编码和技法映射规则详见手势说明文档（待补充）。

### 9.2 请求体

```json
{
  "deviceId": "ring-001",
  "gestureCode": "gesture_001",
  "confidence": 0.93,
  "timestamp": "2026-07-23T22:42:59+08:00"
}
```

### 9.3 请求字段说明

| 字段 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| deviceId | string | 是 | ring-001 | 戒指设备 ID |
| gestureCode | string | 是 | gesture_001 | 手势编码 |
| confidence | number | 否 | 0.93 | 置信度，范围 0 到 1 |
| timestamp | string | 是 | 2026-07-23T22:42:59+08:00 | 手势发生时间 |

### 9.4 成功响应示例

HTTP 状态码：`200`

```json
{
  "success": true,
  "data": {
    "accepted": true,
    "deviceId": "ring-001",
    "gestureCode": "gesture_001",
    "technique": {
      "code": "normal",
      "name": "普通演奏"
    },
    "updatedAt": "2026-07-23T22:43:00+08:00"
  },
  "requestId": "req_20260723224300011"
}
```

### 9.5 失败响应示例

HTTP 状态码：`400`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "confidence 必须在 0 到 1 之间",
    "details": {
      "field": "confidence",
      "value": 1.5
    }
  },
  "requestId": "req_20260723224300012"
}
```

## 10. 错误码定义

| 错误码 | HTTP 状态码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| INVALID_PARAMETER | 400 | 请求参数错误 | 客户端检查字段和枚举值 |
| AUDIO_NOT_FOUND | 404 | 找不到对应 WAV 音频 | 补齐音频资源或切换配置 |
| PLAYBACK_DEVICE_UNAVAILABLE | 503 | 播放设备不可用 | 检查音频输出设备 |
| PLAYBACK_FAILED | 500 | 播放任务提交失败 | 查看后端日志 |
| INTERNAL_ERROR | 500 | 内部错误 | 查看后端日志并排查 |
| SERVICE_UNAVAILABLE | 503 | 服务暂时不可用 | 稍后重试 |

## 11. 状态码建议

参数错误返回 `400`。接口不存在返回 `404`。音频资源不存在也可返回 `404`，并使用错误码 `AUDIO_NOT_FOUND` 区分。播放设备不可用返回 `503`。服务内部异常返回 `500`。成功触发播放返回 `200`。

## 12. 鉴权预留

开发阶段可以不启用鉴权。正式使用时建议客户端在请求头中携带设备令牌：

```text
X-Device-Token: dev-token-example
```

后端可以根据令牌区分手机客户端、电脑网站前端和戒指网关。若启用鉴权，未携带令牌或令牌无效时返回：

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "设备令牌无效或缺失"
  },
  "requestId": "req_20260723224300013"
}
```

## 13. CORS 建议

电脑网站前端需要跨域访问后端时，后端应配置允许的来源。开发环境可允许 `http://localhost:5173`。正式环境应配置明确域名或局域网地址，不建议直接允许所有来源。

## 14. WebSocket 扩展建议

本期可以通过轮询获取当前状态和历史记录。后续若需要更实时的电脑网站展示，可增加 WebSocket 接口，例如：

```text
GET /api/v1/ws/events
```

后端在每次演奏事件产生时推送消息：

```json
{
  "type": "play_event",
  "data": {
    "eventId": "evt_20260723224300001",
    "instrument": {
      "code": "pipa",
      "name": "琵琶"
    },
    "key": "D",
    "note": {
      "code": "so",
      "label": "so"
    },
    "technique": {
      "code": "normal",
      "name": "普通演奏"
    },
    "createdAt": "2026-07-23T22:43:00+08:00"
  }
}
```

该接口为扩展建议，不属于本期必须实现范围。
