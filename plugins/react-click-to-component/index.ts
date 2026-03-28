import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PluginOption } from "vite";

export const reactClickToComponent = (): PluginOption => {
  let root = "";
  let base = "";
  let isServe = false;

  return {
    name: "react-click-to-component",
    configResolved(config) {
      root = config.root;
      base = config.base;
      isServe = config.command === "serve";
    },
    // Fix React 19 not injecting source in jsxDEV
    transform: {
      filter: { id: /jsx-dev-runtime\.js/u },
      handler(code) {
        if (!isServe) return;
        if (code.includes("_source")) return; // React <19, no hack needed

        // React 19: inject source into _debugInfo
        const defineIndex = code.indexOf('"_debugInfo"');
        if (defineIndex === -1) return;
        const valueIndex = code.indexOf("value: null", defineIndex);
        if (valueIndex === -1) return;
        let newCode =
          code.slice(0, valueIndex) +
          "value: source" +
          code.slice(valueIndex + 11);
        if (code.includes("function ReactElement(type, key, self, source,")) {
          return newCode;
        }
        // React 19.2
        newCode = newCode.replaceAll(
          /maybeKey,\s*isStaticChildren/gu,
          "maybeKey, isStaticChildren, source",
        );
        newCode = newCode.replaceAll(
          /(\w+)?,\s*debugStack,\s*debugTask/gu,
          (m, previousArg) => {
            if (previousArg === "source") return m;
            return m.replace("debugTask", "debugTask, source");
          },
        );
        return newCode;
      },
    },
    // Inject the client script into the HTML during dev
    transformIndexHtml() {
      if (!isServe) return;
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: `import "/@id/__x00__react-click-to-component/client";`,
        },
      ];
    },
    resolveId: {
      order: "pre",
      filter: { id: /^react-click-to-component\/client$/u },
      handler(source) {
        return "\0" + source;
      },
    },
    load: {
      filter: { id: /^\0react-click-to-component\/client$/u },
      handler() {
        if (!isServe) return "";
        // Read the client.ts source from this same folder (compiled to JS in prod)
        // During local development you can read the .ts directly if using tsx/ts-node,
        // OR just inline the client code as a string here instead.
        const clientPath = join(import.meta.dirname, "client.ts");
        const clientCode = readFileSync(clientPath, "utf-8");
        return clientCode
          .replace("__ROOT__", root)
          .replace("__BASE__", base);
      },
    },
  };
};
