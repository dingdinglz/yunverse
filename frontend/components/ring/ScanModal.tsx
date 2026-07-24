"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/Button";
import { RING_SCAN_TIMEOUT_S } from "@/constants/enums";
import { scanRing } from "@/lib/ringService";
import type { RingDevice } from "@/types/ring";

import {
  type RingFavorite,
  isFavorite,
  addFavorite,
  removeFavorite,
} from "@/lib/ringFavorites";

export default function ScanModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}) {
  const [devices, setDevices] = useState<Map<string, RingDevice>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const startScan = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setScanning(true);
    setDevices(new Map());

    const loop = async () => {
      while (!ctrl.signal.aborted) {
        try {
          const { devices: found } = await scanRing(RING_SCAN_TIMEOUT_S, ctrl.signal);
          if (ctrl.signal.aborted) break;
          setDevices((prev) => {
            const next = new Map(prev);
            for (const d of found) next.set(d.address, d);
            return next;
          });
        } catch {
          if (ctrl.signal.aborted) break;
        }
      }
    };
    loop().finally(() => setScanning(false));
  }, []);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    if (open) {
      startScan();
    }
    return () => stopScan();
  }, [open, startScan, stopScan]);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const toggleFavorite = (dev: RingDevice) => {
    if (isFavorite(dev.address)) {
      removeFavorite(dev.address);
    } else {
      addFavorite({ address: dev.address, name: dev.name ?? undefined });
    }
    forceUpdate((n) => n + 1);
  };

  if (!open) return null;

  const deviceList = Array.from(devices.values()).sort(
    (a, b) => (b.rssi ?? -999) - (a.rssi ?? -999),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-border bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-semibold text-foreground">扫描 Ring 设备</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <span
            className={`h-2 w-2 rounded-full ${scanning ? "animate-pulse bg-ok" : "bg-muted"}`}
          />
          <span className="text-sm text-muted">
            {scanning
              ? `持续扫描中... 已发现 ${devices.size} 个设备`
              : `扫描结束，共 ${devices.size} 个设备`}
          </span>
        </div>

        <div className="max-h-[360px] overflow-y-auto px-5 py-3">
          {deviceList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              {scanning ? (
                <>
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-info" />
                  <p className="text-sm text-muted">正在搜索附近的 Ring 设备...</p>
                </>
              ) : (
                <p className="text-sm text-muted">未发现设备</p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {deviceList.map((d) => {
                const active = selected === d.address;
                const fav = isFavorite(d.address);
                return (
                  <li key={d.address}>
                    <div
                      className={[
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 transition",
                        active
                          ? "border-info/50 bg-info-soft"
                          : "border-border bg-surface hover:bg-surface-muted",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        className="flex flex-1 flex-col text-left"
                        onClick={() => setSelected(d.address)}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {d.name ?? "未命名设备"}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {d.address}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        {d.rssi != null && (
                          <span className="font-mono text-xs text-muted">
                            {d.rssi} dBm
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleFavorite(d)}
                          className={[
                            "rounded p-1 transition",
                            fav
                              ? "text-warning hover:text-warning/70"
                              : "text-muted hover:text-foreground",
                          ].join(" ")}
                          title={fav ? "取消收藏" : "收藏"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button onClick={handleSelect} disabled={!selected}>
            选择并连接
          </Button>
        </footer>
      </div>
    </div>
  );
}
