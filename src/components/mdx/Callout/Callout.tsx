import { CalloutBase } from "./CalloutBase";
import { CalloutFoldable } from "./CalloutFoldable";

type FoldState = "open" | "closed";

interface CalloutProps {
  type?: "note" | "tip" | "warning" | "danger" | "info";
  title?: string;
  fold?: FoldState;
  children: React.ReactNode;
}

export function Callout({ type = "note", title, fold, children }: CalloutProps) {
  if (fold !== undefined) {
    return (
      <CalloutFoldable type={type} title={title} fold={fold}>
        {children}
      </CalloutFoldable>
    );
  }

  return (
    <CalloutBase type={type} title={title}>
      {children}
    </CalloutBase>
  );
}
