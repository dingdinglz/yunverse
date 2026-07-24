import { describe, expect, it } from "vitest";

import {
  describeDeviceEvent,
  describeRecognition,
  describeRecording,
  imuMagnitude,
} from "@/lib/ringFormat";
import type {
  DeviceEvent,
  RecognitionEvent,
  RecordingEvent,
} from "@/types/ring";

describe("imuMagnitude", () => {
  it("computes accel and gyro magnitudes", () => {
    const m = imuMagnitude([3, 4, 0, 0, 0, 0]);
    expect(m.accel).toBeCloseTo(5);
    expect(m.gyro).toBeCloseTo(0);
  });
});

describe("describeDeviceEvent", () => {
  it("labels key single press", () => {
    const ev = { type: "event", at: "", data: { kind: "key_single" } } as DeviceEvent;
    expect(describeDeviceEvent(ev).tone).toBe("info");
  });
  it("labels errors with danger tone", () => {
    const ev = { type: "event", at: "", data: { kind: "error", message: "boom" } } as DeviceEvent;
    const r = describeDeviceEvent(ev);
    expect(r.tone).toBe("danger");
    expect(r.text).toBe("boom");
  });
  it("labels hmm gesture by name", () => {
    const ev = { type: "event", at: "", data: { kind: "hmm_gesture", name: "wave" } } as DeviceEvent;
    expect(describeDeviceEvent(ev).text).toContain("wave");
  });
});

describe("describeRecognition", () => {
  it("formats percent", () => {
    const ev = { type: "recognition", at: "", data: { name: "转圈", confidence: 0.912 } } as RecognitionEvent;
    const r = describeRecognition(ev);
    expect(r.tone).toBe("ok");
    expect(r.text).toContain("91%");
    expect(r.text).toContain("转圈");
  });
});

describe("describeRecording", () => {
  it("describes done state", () => {
    const ev = { type: "recording", at: "", data: { state: "done", name: "甩", sampleCount: 5 } } as RecordingEvent;
    expect(describeRecording(ev)).toContain("完成");
  });
  it("describes rep progress (1-indexed)", () => {
    const ev = { type: "recording", at: "", data: { state: "rep_recording", currentRep: 2, targetReps: 5 } } as RecordingEvent;
    expect(describeRecording(ev)).toContain("第 3 次");
  });
});
