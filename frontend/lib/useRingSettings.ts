"use client";

// 戒指设置页数据编排 hook：
// - 打开 SSE 事件流（/ring/events）接收 status / imu / event / recognition / recording
// - 轮询 /ring/status 作为兜底
// - 暴露连接/录制/手势/识别开关等动作
// - 卸载时关闭 SSE、清定时器、中断在途请求

import { useCallback, useEffect, useRef, useState } from "react";

import { apiUrl } from "@/lib/apiClient";
import {
  cancelRecording,
  connectRing,
  deleteGesture,
  disconnectRing,
  getRingStatus,
  listGestures,
  repStart,
  repStop,
  setRecognition,
  startRecording,
} from "@/lib/ringService";
import {
  describeDeviceEvent,
  describeRecognition,
  describeRecording,
} from "@/lib/ringFormat";
import {
  RING_EVENT_LOG_MAX,
  RING_EVENTS_PATH,
  RING_IMU_WINDOW,
  RING_STATUS_POLL_MS,
} from "@/constants/enums";
import { ApiClientError } from "@/types/api";
import type {
  AudioFileInfo,
  EventLogItem,
  GestureTemplateInfo,
  RingEvent,
  RingStatus,
} from "@/types/ring";

export interface ImuPoint {
  ax: number; ay: number; az: number;
  gx: number; gy: number; gz: number;
}

export interface RingSettings {
  status: RingStatus | null;
  streamOnline: boolean;
  gestures: GestureTemplateInfo[];
  imu: ImuPoint[];
  eventLog: EventLogItem[];
  lastRecognition: { name: string; confidence: number } | null;
  audioFiles: AudioFileInfo[];
  lastError: string | null;
  busy: boolean;
  // 动作
  connect: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshGestures: () => Promise<void>;
  removeGesture: (name: string) => Promise<void>;
  beginRecording: (name: string, reps: number) => Promise<void>;
  recStart: () => Promise<void>;
  recStop: () => Promise<void>;
  recCancel: () => Promise<void>;
  toggleRecognition: (enabled: boolean) => Promise<void>;
}

export function useRingSettings(): RingSettings {
  const [status, setStatus] = useState<RingStatus | null>(null);
  const [streamOnline, setStreamOnline] = useState(false);
  const [gestures, setGestures] = useState<GestureTemplateInfo[]>([]);
  const [imu, setImu] = useState<ImuPoint[]>([]);
  const [eventLog, setEventLog] = useState<EventLogItem[]>([]);
  const [lastRecognition, setLastRecognition] = useState<
    { name: string; confidence: number } | null
  >(null);
  const [audioFiles, setAudioFiles] = useState<AudioFileInfo[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const controllersRef = useRef<Set<AbortController>>(new Set());
  const logSeq = useRef(0);

  const newController = useCallback(() => {
    const c = new AbortController();
    controllersRef.current.add(c);
    return c;
  }, []);
  const releaseController = useCallback((c: AbortController) => {
    controllersRef.current.delete(c);
  }, []);

  const pushLog = useCallback(
    (text: string, tone: EventLogItem["tone"], at: string) => {
      logSeq.current += 1;
      const item: EventLogItem = { id: `${logSeq.current}`, at, text, tone };
      setEventLog((prev) => [item, ...prev].slice(0, RING_EVENT_LOG_MAX));
    },
    [],
  );

  const refreshGestures = useCallback(async () => {
    const c = newController();
    try {
      const { gestures: list } = await listGestures(c.signal);
      setGestures(list);
    } catch (err) {
      if (!c.signal.aborted && err instanceof ApiClientError) {
        setLastError(err.message);
      }
    } finally {
      releaseController(c);
    }
  }, [newController, releaseController]);

  // --- 动作包装：统一 busy + 错误处理 ---------------------------------
  const runAction = useCallback(
    async (fn: (signal: AbortSignal) => Promise<void>) => {
      const c = newController();
      setBusy(true);
      setLastError(null);
      try {
        await fn(c.signal);
      } catch (err) {
        if (!c.signal.aborted) {
          setLastError(
            err instanceof ApiClientError ? err.message : "操作失败",
          );
        }
        throw err;
      } finally {
        setBusy(false);
        releaseController(c);
      }
    },
    [newController, releaseController],
  );

  const connect = useCallback(
    (address: string) =>
      runAction(async (signal) => {
        const s = await connectRing(address, signal);
        setStatus(s);
      }).catch(() => {}),
    [runAction],
  );

  const disconnect = useCallback(
    () =>
      runAction(async (signal) => {
        const s = await disconnectRing(signal);
        setStatus(s);
      }).catch(() => {}),
    [runAction],
  );

  const removeGesture = useCallback(
    (name: string) =>
      runAction(async (signal) => {
        await deleteGesture(name, signal);
        await refreshGestures();
      }).catch(() => {}),
    [runAction, refreshGestures],
  );

  const beginRecording = useCallback(
    (name: string, reps: number) =>
      runAction(async (signal) => {
        await startRecording(name, reps, signal);
      }).catch(() => {}),
    [runAction],
  );

  const recStart = useCallback(
    () => runAction((signal) => repStart(signal).then(() => {})).catch(() => {}),
    [runAction],
  );
  const recStop = useCallback(
    () => runAction((signal) => repStop(signal).then(() => {})).catch(() => {}),
    [runAction],
  );
  const recCancel = useCallback(
    () =>
      runAction((signal) => cancelRecording(signal).then(() => {})).catch(
        () => {},
      ),
    [runAction],
  );

  const toggleRecognition = useCallback(
    (enabled: boolean) =>
      runAction(async (signal) => {
        await setRecognition(enabled, signal);
      }).catch(() => {}),
    [runAction],
  );

  // --- 处理单条 SSE 事件 ----------------------------------------------
  const handleEvent = useCallback(
    (ev: RingEvent) => {
      switch (ev.type) {
        case "status":
          setStatus(ev.data);
          break;
        case "imu": {
          const points: ImuPoint[] = ev.data.samples.map((s) => ({
            ax: s[0], ay: s[1], az: s[2],
            gx: s[3], gy: s[4], gz: s[5],
          }));
          setImu((prev) => [...prev, ...points].slice(-RING_IMU_WINDOW));
          break;
        }
        case "event": {
          const { text, tone } = describeDeviceEvent(ev);
          pushLog(text, tone, ev.at);
          break;
        }
        case "recognition": {
          setLastRecognition(ev.data);
          const { text, tone } = describeRecognition(ev);
          pushLog(text, tone, ev.at);
          break;
        }
        case "recording": {
          pushLog(describeRecording(ev), "info", ev.at);
          if (ev.data.state === "done") {
            void refreshGestures();
          }
          break;
        }
        case "audio": {
          setAudioFiles((prev) => [...prev, ev.data]);
          break;
        }
      }
    },
    [pushLog, refreshGestures],
  );

  // --- SSE 生命周期 + 初始拉取 + 轮询兜底 ------------------------------
  useEffect(() => {
    const controllers = controllersRef.current;
    let source: EventSource | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const openStream = () => {
      if (closed) return;
      source = new EventSource(apiUrl(RING_EVENTS_PATH));
      source.onopen = () => setStreamOnline(true);
      source.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data) as RingEvent);
        } catch {
          /* 忽略心跳/坏帧 */
        }
      };
      source.onerror = () => {
        setStreamOnline(false);
        source?.close();
        if (!closed) {
          reconnectTimer = setTimeout(openStream, 3000);
        }
      };
    };

    // 初始状态 + 手势列表
    (async () => {
      const c = new AbortController();
      controllers.add(c);
      try {
        setStatus(await getRingStatus(c.signal));
      } catch {
        /* SSE 首帧也会带 status */
      } finally {
        controllers.delete(c);
      }
      await refreshGestures();
    })();

    openStream();

    // 轮询兜底（SSE 已推 status，这里防止漏更新）
    const poll = setInterval(async () => {
      const c = new AbortController();
      controllers.add(c);
      try {
        setStatus(await getRingStatus(c.signal));
      } catch {
        /* 忽略 */
      } finally {
        controllers.delete(c);
      }
    }, RING_STATUS_POLL_MS);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(poll);
      source?.close();
      controllers.forEach((c) => c.abort());
      controllers.clear();
    };
  }, [handleEvent, refreshGestures]);

  return {
    status,
    streamOnline,
    gestures,
    imu,
    eventLog,
    lastRecognition,
    audioFiles,
    lastError,
    busy,
    connect,
    disconnect,
    refreshGestures,
    removeGesture,
    beginRecording,
    recStart,
    recStop,
    recCancel,
    toggleRecognition,
  };
}
