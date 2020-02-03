import { useRef, useEffect } from "react";

const EVENTS = [
  "mousemove",
  "keydown",
  "wheel",
  "DOMMouseScroll",
  "mouseWheel",
  "mousedown",
  "touchstart",
  "touchmove",
  "MSPointerDown",
  "MSPointerMove",
  "visibilitychange"
];

export const useIdleTimer = ({
  onIdle = () => {},
  timeout = 1000 * 60 * 20
}) => {
  const timerId = useRef(null);

  const state = useRef({
    idle: false,
    pageX: null,
    pageY: null,
    eventsBound: false,
    oldDate: +new Date(),
    lastActive: +new Date()
  });

  const _toggleIdleState = e => {
    state.current.idle = !state.current.idle;

    if (!state.current.idle) {
      _bindEvents();
    } else {
      onIdle(e);
    }
  };

  const _handleEvent = e => {
    const { idle, pageX, pageY, oldDate, lastActive } = state.current;

    if (e.type === "mousemove") {
      if (e.pageX === pageX && e.pageY === pageY) {
        return;
      }

      if (typeof e.pageX === "undefined" && typeof e.pageY === "undefined") {
        return;
      }

      const elapsed = +new Date() - oldDate;

      if (elapsed < 200) {
        return;
      }
    }

    clearTimeout(timerId.current);
    timerId.current = null;

    const elapsedTimeSinceLastActive = new Date() - lastActive;

    if (idle || (!idle && elapsedTimeSinceLastActive > timeout)) {
      _toggleIdleState(e);
    }

    state.current.pageX = e.pageX;
    state.current.pageY = e.pageY;
    state.current.lastActive = +new Date();

    timerId.current = setTimeout(_toggleIdleState, timeout);
  };

  const _bindEvents = () => {
    const { eventsBound } = state.current;

    if (!eventsBound) {
      EVENTS.forEach(e => {
        document.addEventListener(e, _handleEvent, {
          capture: true,
          passive: false
        });
      });

      state.current.eventsBound = true;
    }
  };

  useEffect(() => {
    clearTimeout(timerId.current);
    timerId.current = null;

    _bindEvents();

    state.current.idle = false;
    state.current.oldDate = +new Date();
    state.current.lastActive = +new Date();

    timerId.current = setTimeout(_toggleIdleState, timeout);

    return () => {
      clearTimeout(timerId.current);
      timerId.current = null;

      EVENTS.forEach(e => {
        document.removeEventListener(e, _handleEvent, {
          capture: true,
          passive: false
        });
      });

      state.current.eventsBound = false;
    };
  }, []);
};
