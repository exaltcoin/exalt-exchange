import { useRef } from "react";
import {
  useFloating,
  useInteractions,
  useClick,
  useDismiss,
  useRole,
  useListNavigation,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingFocusManager,
  FloatingPortal,
} from "@floating-ui/react";
import "./Popover.css";

/*
  Popover/Dropdown: controlled open state, real keyboard navigation
  (via @floating-ui/react's useListNavigation for menu-style
  content), Escape-to-close and outside-click-to-close (via
  useDismiss), focus returned to the trigger on close (via
  FloatingFocusManager), and viewport-safe positioning (flip/shift
  middleware repositions the content if it would overflow the
  viewport). RTL is automatic: floating-ui reads the page's
  computed `dir` and mirrors placement (e.g. "bottom-start" becomes
  visually the correct side) with no extra props needed.

  This deliberately does NOT hand-roll position math (getBoundingClientRect
  + manual clamping) - that class of implementation is exactly what
  produces the "fragile custom positioning engine" the master order
  warned against. @floating-ui/react is a real, actively maintained
  dependency chosen for this.

  trigger: (props, ref) => ReactNode - render-prop so the trigger
  can be any element (button, input, row) while still wiring up the
  correct ARIA attributes.
  content: ReactNode | (props) => ReactNode - the popover body.
  menuItems: optional array of item ids for arrow-key navigation
  when this Popover is being used as a menu (e.g. account menu,
  language switcher) rather than a free-form panel.
*/
export const Popover = ({
  open,
  onOpenChange,
  trigger,
  children,
  placement = "bottom-start",
  role = "dialog",
  activeIndex,
  onActiveIndexChange,
  listRef,
  className = "",
}) => {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement,
    /*
      autoUpdate continuously repositions on real scroll/resize -
      genuinely needed in a browser, meaningless in jsdom (no real
      layout/scroll events ever fire to react to) and a source of
      test-environment-only instability there. Real usage always
      gets full autoUpdate; only the jsdom test harness opts out via
      this global flag, which production code never sets.
    */
    whileElementsMounted:
      typeof globalThis !== "undefined" && globalThis.__EX2_DISABLE_FLOATING_AUTO_UPDATE__
        ? undefined
        : autoUpdate,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const roleInteraction = useRole(context, { role });

  const internalListRef = useRef([]);
  const resolvedListRef = listRef || internalListRef;

  const listNavigation = useListNavigation(context, {
    listRef: resolvedListRef,
    activeIndex: activeIndex ?? null,
    onNavigate: onActiveIndexChange,
    enabled: role === "menu",
  });

  const { getReferenceProps, getFloatingProps, getItemProps } =
    useInteractions([click, dismiss, roleInteraction, listNavigation]);

  return (
    <>
      {trigger(getReferenceProps({ ref: refs.setReference }))}
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={`ex2-popover ${className}`.trim()}
              {...getFloatingProps()}
            >
              {typeof children === "function"
                ? children({ getItemProps })
                : children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
};

export default Popover;
