export const WIKI_LINK_PATTERN = /(!?)\[\[([^\]#|]+)(?:#(\^?[^\]|]+))?(?:\|([^\]]+))?\]\]/g;
export const MD_LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/g;
export const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/gm;
export const BLOCK_ID_PATTERN = /\s\^([a-zA-Z0-9_-]+)\s*$/gm;
