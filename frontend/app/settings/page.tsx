import type { Metadata } from "next";

import RingSettings from "@/components/RingSettings";

export const metadata: Metadata = {
  title: "戒指设置 · 虚拟乐器演奏控制台",
  description: "连接 BLE 戒指、录制自定义手势并实时测试",
};

export default function SettingsPage() {
  return <RingSettings />;
}
