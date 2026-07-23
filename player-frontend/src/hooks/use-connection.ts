import { useCallback, useEffect, useState } from 'react';

import { checkHealth } from '@/services/play-service';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * 健康检查与连接状态，见 mobile-client.md §6.1 / §8.1 / api.md §4。
 * baseUrl 变化时自动重连。连接失败不阻塞用户修改后端地址。
 */
export function useConnection(baseUrl: string) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const retry = useCallback(async () => {
    setStatus('connecting');
    try {
      await checkHealth(baseUrl);
      setStatus('connected');
    } catch {
      setStatus('disconnected');
    }
  }, [baseUrl]);

  useEffect(() => {
    void retry();
  }, [retry]);

  return { status, retry };
}
