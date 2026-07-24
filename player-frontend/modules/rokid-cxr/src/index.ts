import {
  requireNativeModule,
  EventEmitter,
  type Subscription,
} from 'expo-modules-core';

const RokidCxr = requireNativeModule('RokidCxr');
const emitter = new EventEmitter(RokidCxr);

export type AuthorizationEvent = {
  token?: string;
  error?: string;
};

/**
 * 触发 Rokid AI App 授权对话框。
 * 授权结果通过 onAuthorizationResult 事件回传。
 */
export function requestAuthorization(): Promise<void> {
  return RokidCxr.requestAuthorization();
}

/**
 * 监听授权结果事件。
 * @param callback 授权结果回调，包含 token 或 error
 * @returns 订阅对象，调用 .remove() 取消监听
 */
export function addAuthorizationListener(
  callback: (event: AuthorizationEvent) => void
): Subscription {
  return emitter.addListener('onAuthorizationResult', callback);
}

/**
 * 初始化 CXR-L 连接。
 * @param token 认证 token（从授权流程获取）
 * @returns 是否初始化成功
 */
export function initialize(token: string): Promise<boolean> {
  return RokidCxr.initialize(token);
}

/**
 * 推送演奏状态到眼镜端。
 * @param json 序列化后的 PlayStatePacket JSON
 * @returns 是否发送成功
 */
export function sendPlayState(json: string): Promise<boolean> {
  return RokidCxr.sendPlayState(json);
}

/**
 * 断开 CXR-L 连接。
 */
export function disconnect(): Promise<void> {
  return RokidCxr.disconnect();
}
