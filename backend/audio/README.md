# 音频资源目录

后端按以下约定查找 WAV 文件（`app/audio_resource.py`）：

```
audio/<instrument>/<key_pathCode>/<technique>/<note>.wav
```

- `instrument`：`guitar` / `pipa`
- `key_pathCode`：音调的文件安全写法。接口传 `C#`/`Db`，落地为 `C_sharp`/`D_flat`；无升降号（如 `C`、`D`）保持原样。
- `technique`：技法编码，默认 `normal`
- `note`：`do` `ri` `mi` `fa` `so` `la` `xi` `do_high`

示例：

```
audio/pipa/D/normal/so.wav
audio/guitar/C_sharp/normal/do_high.wav
```

查找规则：优先完整匹配；缺失则回退同乐器同音调的 `normal` 技法；仍不存在返回 `AUDIO_NOT_FOUND`。

索引在服务启动时构建；运行中新增文件后需重启服务（或调用 `AudioResource.reindex()`）。

> 最小验证资源建议：吉他 C 调、琵琶 D 调的 `normal` 技法 `do`..`do_high`（见 backend.md §12）。
