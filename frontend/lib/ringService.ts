// 戒指设置页的后端 API 封装（对应 app/ring_api.py）。
// 扫描/连接是耗时操作，用更长的超时。

import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";
import { RING_LONG_TIMEOUT_MS, RING_SCAN_TIMEOUT_S } from "@/constants/enums";
import type {
  GestureTemplateInfo,
  GestureTrigger,
  RecordingState,
  RingDevice,
  RingStatus,
} from "@/types/ring";

export function getRingStatus(signal?: AbortSignal): Promise<RingStatus> {
  return apiGet<RingStatus>("/ring/status", { signal });
}

export function scanRing(
  timeoutS: number = RING_SCAN_TIMEOUT_S,
  signal?: AbortSignal,
): Promise<{ devices: RingDevice[] }> {
  return apiPost<{ devices: RingDevice[] }>(
    "/ring/scan",
    { timeoutS },
    { signal, timeoutMs: RING_LONG_TIMEOUT_MS },
  );
}

export function connectRing(
  address: string,
  signal?: AbortSignal,
): Promise<RingStatus> {
  return apiPost<RingStatus>(
    "/ring/connect",
    { address },
    { signal, timeoutMs: RING_LONG_TIMEOUT_MS },
  );
}

export function disconnectRing(signal?: AbortSignal): Promise<RingStatus> {
  return apiPost<RingStatus>("/ring/disconnect", undefined, { signal });
}

export function listGestures(
  signal?: AbortSignal,
): Promise<{ method: "dtw" | "hmm"; gestures: GestureTemplateInfo[] }> {
  return apiGet<{ method: "dtw" | "hmm"; gestures: GestureTemplateInfo[] }>("/ring/gestures", { signal });
}

export function deleteGesture(
  name: string,
  signal?: AbortSignal,
): Promise<{ deleted: string }> {
  return apiDelete<{ deleted: string }>(
    `/ring/gestures/${encodeURIComponent(name)}`,
    { signal },
  );
}

export function startRecording(
  name: string,
  reps: number,
  signal?: AbortSignal,
): Promise<RecordingState & { state: string }> {
  return apiPost<RecordingState & { state: string }>(
    "/ring/gestures/record/start",
    { name, reps },
    { signal },
  );
}

export function repStart(signal?: AbortSignal): Promise<{ state: string }> {
  return apiPost<{ state: string }>(
    "/ring/gestures/record/rep/start",
    undefined,
    { signal },
  );
}

export function repStop(signal?: AbortSignal): Promise<{ state: string }> {
  return apiPost<{ state: string }>(
    "/ring/gestures/record/rep/stop",
    undefined,
    { signal },
  );
}

export function cancelRecording(
  signal?: AbortSignal,
): Promise<{ state: string }> {
  return apiPost<{ state: string }>(
    "/ring/gestures/record/cancel",
    undefined,
    { signal },
  );
}

export function setRecognition(
  enabled: boolean,
  signal?: AbortSignal,
): Promise<{ recognitionEnabled: boolean }> {
  return apiPost<{ recognitionEnabled: boolean }>(
    "/ring/recognition",
    { enabled },
    { signal },
  );
}

// ---------------------------------------------------------------------------
// 手势→技法映射
// ---------------------------------------------------------------------------
export interface GestureMappingData {
  mapping: Record<string, string>;
  instrumentMapping: Record<string, Record<string, string>>;
  triggers: GestureTrigger[];
  techniques: { code: string; name: string }[];
}

export function getGestureMapping(
  signal?: AbortSignal,
): Promise<GestureMappingData> {
  return apiGet<GestureMappingData>("/ring/mapping", { signal });
}

export function setGestureMapping(
  mapping: Record<string, string>,
  signal?: AbortSignal,
): Promise<{ mapping: Record<string, string> }> {
  return apiPut<{ mapping: Record<string, string> }>(
    "/ring/mapping",
    { mapping },
    { signal },
  );
}

export function setSingleMapping(
  gestureName: string,
  technique: string | null,
  signal?: AbortSignal,
): Promise<{ mapping: Record<string, string> }> {
  return apiPut<{ mapping: Record<string, string> }>(
    `/ring/mapping/${encodeURIComponent(gestureName)}`,
    { technique },
    { signal },
  );
}

// ---------------------------------------------------------------------------
// 乐器专属映射
// ---------------------------------------------------------------------------
export function setInstrumentSingleMapping(
  instrument: string,
  gestureName: string,
  technique: string | null,
  signal?: AbortSignal,
): Promise<{ instrumentMapping: Record<string, Record<string, string>> }> {
  return apiPut<{ instrumentMapping: Record<string, Record<string, string>> }>(
    `/ring/mapping/instrument/${encodeURIComponent(instrument)}/${encodeURIComponent(gestureName)}`,
    { technique },
    { signal },
  );
}

// ---------------------------------------------------------------------------
// 手势触发发音
// ---------------------------------------------------------------------------
export function setGestureTriggers(
  triggers: GestureTrigger[],
  signal?: AbortSignal,
): Promise<{ triggers: GestureTrigger[] }> {
  return apiPut<{ triggers: GestureTrigger[] }>(
    "/ring/triggers",
    { triggers },
    { signal },
  );
}
