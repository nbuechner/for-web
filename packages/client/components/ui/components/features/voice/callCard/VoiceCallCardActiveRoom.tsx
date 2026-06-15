import { useLingui } from "@lingui-solid/solid/macro";
import { createResizeObserver } from "@solid-primitives/resize-observer";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { TrackLoop } from "solid-livekit-components";
import { styled } from "styled-system/jsx";

import { useIsMobile } from "@revolt/common/lib/useIsMobile";
import { InRoom, useVoice } from "@revolt/rtc";
import { IconButton } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { scrollableStyles } from "@revolt/ui/directives";

import { ParticipantTile, tile } from "./ParticipantTile";
import { VoiceCallCardActions } from "./VoiceCallCardActions";
import { VoiceCallCardStatus } from "./VoiceCallCardStatus";

/**
 * Call card (active)
 */
export function VoiceCallCardActiveRoom() {
  return (
    <View>
      <Participants />
      <VoiceCallControls>
        <VoiceCallControlHolder right>
          <VoiceCallFullscreen />
        </VoiceCallControlHolder>
        <VoiceCallCardActions size="sm" />
        <VoiceCallControlHolder left overflow>
          <VoiceCallCardStatus />
        </VoiceCallControlHolder>
      </VoiceCallControls>
    </View>
  );
}

function VoiceCallFullscreen() {
  const voice = useVoice();
  return (
    <IconButton
      size="sm"
      variant={"standard"}
      onPress={() => voice.toggleFullscreen()}
    >
      <Show when={voice.fullscreen()} fallback={<Symbol>fullscreen</Symbol>}>
        <Symbol>fullscreen_exit</Symbol>
      </Show>
    </IconButton>
  );
}

const TILE_MIN_WIDTH = "250px",
  TILE_MIN_WIDTH_MOBILE = "100px",
  TILE_MIN_FOCUS_HEIGHT = "100px",
  STRIP_DEFAULT = `max(20%, ${TILE_MIN_FOCUS_HEIGHT})`;

/**
 * Show a grid of participants
 */
function Participants() {
  const voice = useVoice();
  const { t } = useLingui();
  const isMobile = useIsMobile();

  // Modify this value to get test tracks
  const testTrackCount = 0;

  let callRef: HTMLDivElement | undefined;
  const [stripHeight, setStripHeight] = createSignal(STRIP_DEFAULT);

  const tileWidth = () => {
    const minW = isMobile() ? TILE_MIN_WIDTH_MOBILE : TILE_MIN_WIDTH;
    const vidWidth = Math.round(
      100 / (voice.vidTracks().length + testTrackCount),
    );
    return `max(${minW}, ${vidWidth}% - var(--gap-md))`;
  };

  // Clear out any focus when the track that was focused is no longer available.
  createEffect(() => {
    if (!voice.focusTrack()) voice.toggleFocus();
  });

  // Reset strip height when leaving focus mode.
  createEffect(() => {
    if (!voice.focusId()) setStripHeight(STRIP_DEFAULT);
  });

  onMount(() => {
    createResizeObserver(callRef, ({ width, height }, el) => {
      if (el === callRef) {
        el.style.setProperty("--vc-w", `${width}px`);
        el.style.setProperty("--vc-h", `${height}px`);
      }
    });
  });

  function onResizeHandlePointerDown(e: PointerEvent) {
    e.preventDefault();
    const controller = new AbortController();
    const { signal } = controller;
    document.addEventListener(
      "pointermove",
      (ev) => {
        if (!callRef) return;
        const rect = callRef.getBoundingClientRect();
        const fromBottom = rect.bottom - ev.clientY;
        const pct = Math.round((fromBottom / rect.height) * 100);
        setStripHeight(
          `max(${TILE_MIN_FOCUS_HEIGHT}, ${Math.max(10, Math.min(80, pct))}%)`,
        );
      },
      { signal },
    );
    document.addEventListener("pointerup", () => controller.abort(), {
      signal,
      once: true,
    });
    document.addEventListener("pointercancel", () => controller.abort(), {
      signal,
      once: true,
    });
  }

  return (
    <Call ref={callRef} class={voice.focusId() ? "" : scrollableStyles()}>
      <InRoom>
        <FocusedParticipant />
        <Show when={voice.focusId()}>
          <ShowBarButtonHolder>
            <div style={{ "margin-bottom": "10px" }}>
              <IconButton
                size="xs"
                variant={"tonal"}
                onPress={() => voice.toggleShowBar()}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: voice.showBar() ? t`Hide Others` : t`Show Others`,
                  },
                }}
              >
                <Show
                  when={voice.showBar()}
                  fallback={<Symbol>keyboard_arrow_up</Symbol>}
                >
                  <Symbol>keyboard_arrow_down</Symbol>
                </Show>
              </IconButton>
            </div>
          </ShowBarButtonHolder>
          <Show when={voice.showBar()}>
            <ResizeHandle onPointerDown={onResizeHandlePointerDown} />
          </Show>
        </Show>
        <Grid
          focus={!!voice.focusId()}
          show={voice.showBar()}
          class={voice.focusId() ? scrollableStyles({ direction: "x" }) : ""}
          style={{
            "--vc-tile-width": tileWidth(),
            ...(voice.focusId() && voice.showBar() ? { height: stripHeight() } : {}),
          }}
        >
          <TrackLoop
            tracks={() => voice.vidTracks().filter((t) => !voice.isFocus(t))}
          >
            {() => <ParticipantTile />}
          </TrackLoop>
          <For each={Array(testTrackCount)}>
            {() => (
              <div
                class={tile({ fullscreen: voice.fullscreen() }) + " vc_tile"}
              />
            )}
          </For>
        </Grid>
      </InRoom>
    </Call>
  );
}

function FocusedParticipant() {
  const voice = useVoice();

  return (
    <Show when={voice.focusTrack()}>
      <TrackLoop tracks={() => [voice.focusTrack()!]}>
        {() => (
          <FocusBox>
            <ParticipantTile focus />
          </FocusBox>
        )}
      </TrackLoop>
    </Show>
  );
}

const View = styled("div", {
  base: {
    minHeight: 0,
    height: "100%",
    width: "100%",

    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",

    "@media (max-width: 768px)": {
      gap: "var(--gap-sm)",
      padding: "var(--gap-sm)",
    },
  },
});

const VoiceCallControls = styled("div", {
  base: {
    display: "flex",
    flexShrink: "0",
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
});

const VoiceCallControlHolder = styled("div", {
  base: {
    display: "flex",
    flex: "1",
    alignSelf: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",

    "@media (max-width: 768px)": {
      flex: "0",
      gap: "var(--gap-sm)",
      padding: "var(--gap-sm)",
    },
  },
  variants: {
    right: {
      true: {
        justifyContent: "flex-end",
      },
    },
    empty: {
      true: {
        gap: "0px",
        padding: "0px",
      },
    },
    left: {
      true: {
        justifyContent: "flex-start",
      },
    },
    overflow: {
      true: {
        overflow: "hidden",
      },
    },
  },
});

const ShowBarButtonHolder = styled("div", {
  base: {
    height: "0px",
    alignSelf: "center",
    overflow: "visible",
    display: "flex",
    flexDirection: "column-reverse",
  },
});

const Call = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    flexGrow: 1,
    minHeight: 0,
  },
});

const Grid = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "safe center",
    alignContent: "safe center",
    minHeight: "100%",
    gap: "var(--gap-md)",
  },

  variants: {
    focus: {
      true: {
        flexDirection: "column",
        height: `max(20%, ${TILE_MIN_FOCUS_HEIGHT})`,
        minHeight: 0,

        "& .vc_tile": {
          width: "auto",
          height: "100%",
        },
      },
    },
    show: {
      false: {
        height: 0,
      },
    },
  },
});

const ResizeHandle = styled("div", {
  base: {
    flexShrink: 0,
    height: "6px",
    cursor: "ns-resize",
    borderRadius: "3px",
    background: "transparent",
    transition: "background 0.2s",
    _hover: {
      background: "rgba(255, 255, 255, 0.15)",
    },
    _active: {
      background: "rgba(255, 255, 255, 0.3)",
    },
  },
});

const FocusBox = styled("div", {
  base: {
    height: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    margin: "0 auto",
  },
});
