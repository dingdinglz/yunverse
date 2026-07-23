export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3"
    >
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-danger"
        aria-hidden
      />
      <div className="text-sm">
        <p className="font-medium text-danger">后端连接异常</p>
        <p className="mt-0.5 text-danger/80">
          {message}。已保留最近一次成功获取的数据，恢复后将自动刷新。
        </p>
      </div>
    </div>
  );
}
