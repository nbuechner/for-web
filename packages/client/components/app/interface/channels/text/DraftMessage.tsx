import { For, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import type { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient, useUser } from "@revolt/client";
import { Markdown } from "@revolt/markdown";
import { userInformation } from "@revolt/markdown/users";
import { useState } from "@revolt/state";
import type { UnsentMessage } from "@revolt/state/stores/Draft";
import {
  Avatar,
  MessageContainer,
  MessageReply,
  SizedContent,
  Text,
  Username,
} from "@revolt/ui";

import { DraftMessageContextMenu } from "../../../menus/DraftMessageContextMenu";

interface Props {
  draft: UnsentMessage;
  channel: Channel;
  tail?: boolean;
}

/**
 * Unsent message preview
 */
export function DraftMessage(props: Props) {
  const user = useUser();
  const state = useState();
  const client = useClient();
  const userInfo = () => userInformation(user(), props.channel.server?.member);

  return (
    <MessageContainer
      tail={
        props.tail && (!props.draft.replies || props.draft.replies.length === 0)
      }
      avatar={<Avatar src={userInfo().avatar} size={36} />}
      timestamp={
        props.draft.status === "sending" ? (
          <Trans>Sending...</Trans>
        ) : props.draft.status === "failed" ? (
          <Trans>Failed to send</Trans>
        ) : (
          <Trans>Unsent message</Trans>
        )
      }
      sendStatus={props.draft.status === "sending" ? "sending" : "failed"}
      username={<Username username={userInfo().username} />}
      header={
        <For each={props.draft.replies}>
          {(reply) => (
            <MessageReply
              message={client().messages.get(reply.id)}
              mention={reply.mention}
            />
          )}
        </For>
      }
      contextMenu={() => (
        <DraftMessageContextMenu draft={props.draft} channel={props.channel} />
      )}
      compact={state.settings.getValue("appearance:compact_mode")}
    >
      <BreakText>
        <Markdown content={props.draft.content!} />
      </BreakText>
      <Show when={props.draft.status === "failed"}>
        <FailedActions>
          <FailedAction
            onClick={() =>
              state.draft.retrySend(
                client(),
                props.channel,
                props.draft.idempotencyKey,
              )
            }
          >
            Retry
          </FailedAction>
          <span>·</span>
          <FailedAction
            dismiss
            onClick={() =>
              state.draft.cancelSend(
                props.channel,
                props.draft.idempotencyKey,
              )
            }
          >
            Dismiss
          </FailedAction>
        </FailedActions>
      </Show>
      <For each={props.draft.files}>
        {(id) => {
          const file = state.draft.getFile(id);
          const spoiler = () => state.draft.isFileSpoiler(id);

          return (
            <>
              <Text class="label">
                Uploading file `{file.file.name}`...{" "}
                {(file.uploadProgress[0]() * 100).toFixed()}%
              </Text>
              <Switch>
                <Match when={file.dimensions}>
                  <SizedContent
                    width={file.dimensions![0]}
                    height={file.dimensions![1]}
                  >
                    <PreviewWrapper>
                      <PreviewImage src={file.dataUri} spoiler={spoiler()} />
                      <Show when={spoiler()}>
                        <SpoilerLabel>Spoiler</SpoilerLabel>
                      </Show>
                    </PreviewWrapper>
                  </SizedContent>
                </Match>
              </Switch>
            </>
          );
        }}
      </For>
    </MessageContainer>
  );
}

const FailedActions = styled("div", {
  base: {
    display: "flex",
    gap: "6px",
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
    marginTop: "2px",
  },
});

const FailedAction = styled("span", {
  base: {
    cursor: "pointer",
    color: "var(--md-sys-color-primary)",
    _hover: { textDecoration: "underline" },
  },
  variants: {
    dismiss: {
      true: { color: "var(--md-sys-color-error)" },
    },
  },
});

/**
 * Break all text and prevent overflow from math blocks
 */
const BreakText = styled("div", {
  base: {
    wordBreak: "break-word",

    "& .math": {
      overflowX: "auto",
      overflowY: "hidden",
      maxHeight: "100vh",
    },
  },
});

/**
 * Positioning context for the image + spoiler label, independent of whatever
 * SizedContent itself does internally
 */
const PreviewWrapper = styled("div", {
  base: {
    position: "relative",
    display: "grid",

    "& > img": {
      gridArea: "1 / 1",
    },
  },
});

/**
 * Attachment preview image, blurred while marked as spoiler
 */
const PreviewImage = styled("img", {
  base: {
    display: "block",
    width: "100%",
    height: "100%",
    transition: "var(--transitions-fast) filter",
  },
  variants: {
    spoiler: {
      true: {
        filter: "blur(28px)",
      },
    },
  },
});

/**
 * Centered label shown over a spoiler-marked upload preview
 */
const SpoilerLabel = styled("div", {
  base: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 2,
    transform: "translate(-50%, -50%)",

    padding: "4px var(--gap-sm)",
    borderRadius: "var(--borderRadius-lg)",
    border: "none",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface)",

    textTransform: "uppercase",
  },
});
