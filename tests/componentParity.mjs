import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default || traverseModule;

export function findUnboundRenderedComponents(relativeFile) {
  const filename = path.resolve(relativeFile);
  const source = fs.readFileSync(filename, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  const unbound = new Set();

  traverse(ast, {
    JSXOpeningElement(nodePath) {
      const name = nodePath.node.name;
      if (name.type !== "JSXIdentifier" || !/^[A-Z]/.test(name.name)) return;
      if (!nodePath.scope.hasBinding(name.name)) unbound.add(name.name);
    },
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      if (
        callee.type !== "Identifier" ||
        !["adminOnlyPanel", "ownerOnlyPanel", "superAdminOnlyPanel", "moderatorOnlyPanel"].includes(callee.name)
      ) return;

      const component = nodePath.node.arguments[0];
      if (
        component?.type === "Identifier" &&
        /^[A-Z]/.test(component.name) &&
        !nodePath.scope.hasBinding(component.name)
      ) {
        unbound.add(component.name);
      }
    },
  });

  return [...unbound].sort();
}
