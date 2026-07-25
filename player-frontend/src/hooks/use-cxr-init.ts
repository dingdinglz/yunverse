import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  requestAuthorization,
  addAuthorizationListener,
  initialize,
} from '../../modules/rokid-cxr/src';

/**
 * CXR-L 初始化 Hook，在 app 启动时调用一次。
 * 流程：requestAuthorization → 监听 token → initialize(token)
 * 失败不阻塞应用，仅输出警告日志。
 */
export function useCxrInit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 非 Android 平台跳过整个 CXR 流程
    if (Platform.OS !== 'android') {
      console.log('[CXR] Skipped on non-Android platform');
      return;
    }

    let subscription: { remove: () => void } | null = null;

    const init = async () => {
      try {
        // 1. 注册授权结果监听
        subscription = addAuthorizationListener(
          async (event: { token?: string; error?: string }) => {
            if (event.error) {
              console.warn('[CXR] Authorization failed:', event.error);
              return;
            }

            if (!event.token) {
              console.warn('[CXR] Authorization returned empty token');
              return;
            }

            // 2. 拿到 token 后初始化连接
            try {
              const success = await initialize(event.token);
              if (success) {
                console.log('[CXR] Initialized successfully');
              } else {
                console.warn('[CXR] Initialization returned false');
              }
            } catch (e) {
              console.warn('[CXR] Initialize failed:', e);
            }
          }
        );

        // 3. 触发授权流程
        await requestAuthorization();
        console.log('[CXR] Authorization dialog triggered');
      } catch (e) {
        console.warn('[CXR] Init failed:', e);
      }
    };

    init();

    return () => {
      subscription?.remove();
    };
  }, []);
}
