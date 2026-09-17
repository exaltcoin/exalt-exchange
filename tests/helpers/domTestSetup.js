import { JSDOM } from "jsdom";

/*
  node:test has no built-in DOM. This constructs one via jsdom and
  exposes the globals React / @testing-library/react expect, before
  any component module is imported. Import this file first, always
  via a bare `import "./helpers/domTestSetup.js";` with no named
  imports, so its side effects run before anything else in the test
  file.

  IDEMPOTENT BY DESIGN: when multiple design-system test files run
  in the same Node process (e.g. `node --test tests/designSystem*`
  expands to several file arguments in one invocation, and this
  sandbox's Node does not fully process-isolate them), each file
  importing this module used to construct a BRAND NEW JSDOM
  instance and reassign global.document/window - orphaning any
  listeners/refs a previous file's components (Dialog's focus trap,
  Popover's outside-click handler, etc.) had attached to the old
  document. That orphaned state kept the process's event loop alive
  after the actual tests finished, which surfaced as a hang/SIGKILL
  with no useful test-level error. Guarding construction so the
  SAME jsdom instance is reused across every file in one process
  fixes this at the root, rather than working around it per test.
*/
let dom = globalThis.__EX2_TEST_DOM__;

if (!dom) {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });

  globalThis.__EX2_TEST_DOM__ = dom;

  global.window = dom.window;
  global.document = dom.window.document;

  Object.defineProperty(global, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });

  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.customElements = dom.window.customElements;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.localStorage = dom.window.localStorage;

  // jsdom may not expose PointerEvent. Tests only need standard
  // event bubbling/cancelation semantics for pointerdown here, so
  // MouseEvent is a safe test-environment fallback.
  if (typeof dom.window.PointerEvent === "undefined") {
    dom.window.PointerEvent = dom.window.MouseEvent;
  }

  global.PointerEvent = dom.window.PointerEvent;

  if (typeof global.requestAnimationFrame === "undefined") {
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  }

  /*
    jsdom has no ResizeObserver/IntersectionObserver implementation.
    @floating-ui/react's autoUpdate() (used by the Popover primitive)
    relies on ResizeObserver to reposition when the trigger/content
    size changes - a no-op stub is sufficient for tests, which only
    need positioning logic to not throw, not to actually reposition
    pixel-perfectly in a headless DOM with no real layout engine.
  */
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
} else {
  /*
    Already initialized by an earlier file in this same process -
    reuse it. Also clear any leftover DOM nodes (e.g. a previous
    file's un-portaled toast/popover container that outlived its
    test) so each file starts from a clean <body>.
  */
  global.document.body.innerHTML = "";
  global.document.body.style.overflow = "";
}

/*
  See Popover.jsx's comment on whileElementsMounted: @floating-ui/react's
  autoUpdate() continuously repositions on real scroll/resize/element-size
  changes - meaningless under jsdom (no real layout engine ever fires
  those events) and empirically a source of test-environment-only hangs
  here. Real browser usage is completely unaffected; this flag is only
  ever read by Popover.jsx and only ever set here, in the test harness.
  Set unconditionally (outside the if/else above) so it's present
  whether this is the first file in the process or a later one reusing
  the shared dom.
*/
globalThis.__EX2_DISABLE_FLOATING_AUTO_UPDATE__ = true;

export { dom };
