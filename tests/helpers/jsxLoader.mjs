import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as babel from "@babel/core";
import presetReact from "@babel/preset-react";

export function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".css")) {
    return {
      url: `data:text/javascript,export default {};`,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}

/*
  Vite exposes `import.meta.env.VITE_*` at build time; plain Node
  has no such thing (import.meta only has `.url` natively), so any
  component under test that reads import.meta.env.* (e.g.
  AdminKycPanel.jsx's API base URL) throws immediately when
  imported outside Vite. This babel plugin rewrites every
  `import.meta.env` access to a plain object literal built from
  this process's real env vars, so components read whatever
  VITE_* value the test actually sets via process.env, exactly as
  Vite would substitute it - no separate mocking layer, and no
  change to the component source itself.
*/
const importMetaEnvPlugin = () => ({
  visitor: {
    MetaProperty(path) {
      if (
        path.node.meta.name === "import" &&
        path.node.property.name === "meta"
      ) {
        const parent = path.parentPath;
        if (
          parent.isMemberExpression() &&
          parent.node.property.name === "env"
        ) {
          parent.replaceWithSourceString(
            "({" +
              Object.keys(process.env)
                .map((key) => `${JSON.stringify(key)}: ${JSON.stringify(process.env[key])}`)
                .join(",") +
              "})"
          );
        }
      }
    },
  },
});

export async function load(url, context, nextLoad) {
  if (url.endsWith(".jsx")) {
    const filePath = fileURLToPath(url);
    const source = await readFile(filePath, "utf8");

    /*
      Pass the preset as an already-imported module object rather
      than the string "@babel/preset-react" - letting Babel resolve
      the preset by name internally triggers its own require() call,
      which collides with this same loader hook being active for
      module resolution (ERR_METHOD_NOT_IMPLEMENTED: resolveSync).
      Passing the resolved object sidesteps Babel's resolution path
      entirely.
    */
    const { code } = await babel.transformAsync(source, {
      filename: filePath,
      presets: [[presetReact, { runtime: "automatic" }]],
      plugins: [importMetaEnvPlugin],
      sourceMaps: "inline",
    });

    return {
      format: "module",
      source: code,
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
