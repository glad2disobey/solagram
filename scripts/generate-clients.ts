import path from "node:path";
import fs from "node:fs/promises";

import { createFromRoot } from "codama";
import { rootNodeFromAnchor, AnchorIdl } from "@codama/nodes-from-anchor";
import { renderVisitor as renderJavaScriptVisitor } from "@codama/renderers-js";

import solagramIdl from '../target/idl/solagram.json';
import messengerIdl from '../target/idl/messenger.json';

const anchorIdlBundleList = [
  { program: "solagram", idl: solagramIdl },
  { program: "messenger", idl: messengerIdl },
];

const jsClientPath = path.join(__dirname, "..", "clients", "js", "src", "generated");
const jsClientIndexPath = path.join(jsClientPath, "index.ts");

(async () => {
  for await (const bundle of anchorIdlBundleList) {
    const codama = createFromRoot(rootNodeFromAnchor(bundle.idl as AnchorIdl));

    const javaScriptVisitor = renderJavaScriptVisitor(path.join(jsClientPath, bundle.program));
    await codama.accept(javaScriptVisitor);
  }

  await fs.writeFile(jsClientIndexPath, "", { flag: "w" });

  for await (const bundle of anchorIdlBundleList)
    await fs.appendFile(
      jsClientIndexPath,
      `export * as ${ bundle.program } from "./${ bundle.program }";\n`,
    );
})();
