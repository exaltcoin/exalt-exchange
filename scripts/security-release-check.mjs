import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const auditBlockers = (vulnerabilities = {}) => {
  const blockers = [];
  const critical = Number(vulnerabilities.critical || 0);
  const high = Number(vulnerabilities.high || 0);
  if (critical > 0) {
    blockers.push(`runtime audit contains ${critical} critical vulnerability${critical === 1 ? "" : "ies"}`);
  }
  if (high > 0) {
    blockers.push(`runtime audit contains ${high} high vulnerabilit${high === 1 ? "y" : "ies"}`);
  }
  return blockers;
};

const isSensitivePath = (filePath) => {
  const normalized = String(filePath || "").replaceAll("\\", "/");
  if (normalized.endsWith(".env.example")) return false;
  return (
    /(^|\/)\.env(?:\.|$)/.test(normalized) ||
    /(^|\/)node_modules\//.test(normalized) ||
    /(^|\/)dist\//.test(normalized) ||
    /(^|\/)android\/app\/release\//.test(normalized) ||
    /\.(?:jks|keystore|aab|apk)$/i.test(normalized)
  );
};

export const findSensitivePaths = (paths) =>
  paths.filter(isSensitivePath);

export const androidCleartextBlockers = ({
  manifest = "",
  networkPolicy = "",
}) => {
  const blockers = [];
  if (/usesCleartextTraffic="true"/.test(manifest)) {
    blockers.push("release Android manifest permits cleartext traffic");
  }
  if (/cleartextTrafficPermitted="true"/.test(networkPolicy)) {
    blockers.push("release Android network policy permits cleartext traffic");
  }
  return blockers;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const run = () => {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const audit = spawnSync(
    npmCommand,
    ["audit", "--omit=dev", "--json"],
    { cwd: root, encoding: "utf8" }
  );
  const report = JSON.parse(audit.stdout || "{}");
  const tracked = spawnSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
  });
  const blockers = [
    ...auditBlockers(report.metadata?.vulnerabilities),
    ...findSensitivePaths(
      String(tracked.stdout || "")
        .split(/\r?\n/)
        .filter(Boolean)
    ).map((filePath) => `sensitive or generated path is tracked: ${filePath}`),
    ...androidCleartextBlockers({
      manifest: readFileSync(
        path.join(root, "android", "app", "src", "main", "AndroidManifest.xml"),
        "utf8"
      ),
      networkPolicy: readFileSync(
        path.join(
          root,
          "android",
          "app",
          "src",
          "main",
          "res",
          "xml",
          "network_security_config.xml"
        ),
        "utf8"
      ),
    }),
  ];

  if (blockers.length > 0) {
    console.error("Frontend security release check failed:");
    blockers.forEach((blocker) => console.error(`- ${blocker}`));
    process.exitCode = 1;
    return;
  }

  console.log("Frontend security release check passed.");
};

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  run();
}
