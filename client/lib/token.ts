import * as kit from "@solana/kit";

import * as token from "@solana-program/token-2022";

export function hasExtension(mintAccount: kit.Account<token.Mint, string>, kind: string): boolean {
  const extensions = kit.unwrapOption(mintAccount.data.extensions);
  
  if (extensions === null) return false;

  const extension = extensions.find(extension => extension["__kind"] === kind);

  if (!extension) return false;

  return true;
}

export function getExtension(mintAccount: kit.Account<token.Mint, string>, kind: string): token.Extension {
  const extensions = kit.unwrapOption(mintAccount.data.extensions);
  
  if (extensions === null) throw new Error("No extensions found");

  const extension = extensions.find(extension => extension["__kind"] === kind);

  if (!extension) throw new Error("Extension not exists");

  return extension;
}
