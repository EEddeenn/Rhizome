export interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null;
}

export interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: unknown[];
}

export function isMdxJsxFlowElement(node: unknown): node is MdxJsxFlowElement {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "mdxJsxFlowElement"
  );
}

export function createMdxElement(
  name: string,
  attrs: Record<string, string | undefined>
): MdxJsxFlowElement {
  const attributes: MdxJsxAttribute[] = Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([attrName, value]) => ({
      type: "mdxJsxAttribute" as const,
      name: attrName,
      value: value ?? null,
    }));

  return {
    type: "mdxJsxFlowElement",
    name,
    attributes,
    children: [],
  };
}
