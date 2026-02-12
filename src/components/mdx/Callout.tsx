type CalloutType = "note" | "tip" | "warning" | "danger" | "info";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const styles: Record<CalloutType, { border: string; bg: string; icon: string }> = {
  note: {
    border: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
    icon: "ℹ️",
  },
  tip: {
    border: "border-green-500",
    bg: "bg-green-50 dark:bg-green-950",
    icon: "💡",
  },
  warning: {
    border: "border-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950",
    icon: "⚠️",
  },
  danger: {
    border: "border-red-500",
    bg: "bg-red-50 dark:bg-red-950",
    icon: "🚨",
  },
  info: {
    border: "border-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950",
    icon: "📖",
  },
};

export function Callout({ type = "note", title, children }: CalloutProps) {
  const style = styles[type];

  return (
    <div className={`my-4 border-l-4 ${style.border} ${style.bg} p-4 rounded-r`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{style.icon}</span>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
