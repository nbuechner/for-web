import { Component, JSX, Match, Show, Switch, createMemo } from "solid-js";

import { Channel, Server as ServerI } from "stoat.js";
import { css, cva } from "styled-system/css";

import {
  CategoryContextMenu,
  ChannelContextMenu,
  ServerSidebarContextMenu,
} from "@revolt/app";
import { useClient, useUser } from "@revolt/client";
import { useIsMobile } from "@revolt/common/lib/useIsMobile";
import { useModals } from "@revolt/modal";
import { useLocation, useParams, useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";

import { HomeSidebar, ServerList, ServerSidebar } from "./navigation";

/**
 * Left-most channel navigation sidebar
 */
export const Sidebar = (props: {
  /**
   * Menu generator TODO FIXME: remove
   */
  menuGenerator: (t: ServerI | Channel) => JSX.Directives["floating"];
}) => {
  const user = useUser();
  const state = useState();
  const client = useClient();
  const { openModal } = useModals();
  const isMobile = useIsMobile();

  const params = useParams<{ server: string }>();
  const location = useLocation();

  const sidebarOpen = () =>
    state.layout.getSectionState(LAYOUT_SECTIONS.PRIMARY_SIDEBAR, true) &&
    !location.pathname.startsWith("/discover");

  function closeSidebar() {
    state.layout.setSectionState(LAYOUT_SECTIONS.PRIMARY_SIDEBAR, false, true);
  }

  // On mobile the outer div becomes a fixed full-height drawer; hidden when closed.
  // On desktop it's a normal flex container in the document flow.
  const wrapperClass = () =>
    isMobile()
      ? sidebarOpen()
        ? drawerOpen
        : drawerHidden
      : drawerDesktop;

  return (
    <>
      {/* Scrim behind the drawer on mobile — tap to close */}
      <Show when={isMobile() && sidebarOpen()}>
        <div class={scrim} onClick={closeSidebar} />
      </Show>
      <div class={wrapperClass()}>
        {/* Close chevron button — mobile only, sticks out at the right edge */}
        <Show when={isMobile() && sidebarOpen()}>
          <button class={closeButton} onClick={closeSidebar} aria-label="Close sidebar">
            ‹
          </button>
        </Show>
        <ServerList
          orderedServers={state.ordering.orderedServers(client())}
          setServerOrder={state.ordering.setServerOrder}
          unreadConversations={state.ordering
            .orderedConversations(client())
            .filter(
              // TODO: muting channels
              (channel) => channel.unread,
            )}
          user={user()!}
          selectedServer={() => params.server}
          onCreateOrJoinServer={() =>
            openModal({
              type: "create_or_join_server",
              client: client(),
            })
          }
          menuGenerator={props.menuGenerator}
        />
        <Show when={sidebarOpen()}>
          <Switch fallback={<Home />}>
            <Match when={params.server}>
              <Server />
            </Match>
          </Switch>
        </Show>
      </div>
    </>
  );
};

/**
 * Render sidebar for home
 */
const Home: Component = () => {
  const params = useSmartParams();
  const client = useClient();
  const state = useState();
  const conversations = createMemo(() =>
    state.ordering.orderedConversations(client()),
  );

  return (
    <HomeSidebar
      conversations={conversations}
      channelId={params().channelId}
      openSavedNotes={(navigate) => {
        // Check whether the saved messages channel exists already
        const channelId = [...client()!.channels.values()].find(
          (channel) => channel.type === "SavedMessages",
        )?.id;

        if (navigate) {
          if (channelId) {
            // Navigate if exists
            navigate(`/channel/${channelId}`);
          } else {
            // If not, try to create one but only if navigating
            client()!
              .user!.openDM()
              .then((channel) => navigate(`/channel/${channel.id}`));
          }
        }

        // Otherwise return channel ID if available
        return channelId;
      }}
    />
  );
};

/**
 * Render sidebar for a server
 */
const Server: Component = () => {
  const { openModal } = useModals();
  const params = useSmartParams();
  const client = useClient();

  /**
   * Resolve the server
   * @returns Server
   */
  const server = () => client()!.servers.get(params().serverId!)!;

  /**
   * Open the server information modal
   */
  function openServerInfo() {
    openModal({
      type: "server_info",
      server: server(),
    });
  }

  /**
   * Open the server settings modal
   */
  function openServerSettings() {
    openModal({
      type: "settings",
      config: "server",
      context: server(),
    });
  }

  return (
    <Show when={server()}>
      <ServerSidebar
        server={server()}
        channelId={params().channelId}
        openServerInfo={openServerInfo}
        openServerSettings={openServerSettings}
        menuGenerator={(target) => ({
          contextMenu: () =>
            target instanceof Channel ? (
              <ChannelContextMenu channel={target} />
            ) : target instanceof ServerI ? (
              <ServerSidebarContextMenu server={target} />
            ) : (
              <CategoryContextMenu server={server()} category={target} />
            ),
        })}
      />
    </Show>
  );
};

/** Desktop: normal flow flex container */
const drawerDesktop = css({
  display: "flex",
  flexShrink: 0,
});

/** Mobile: fixed drawer from left edge, covers full height */
const drawerOpen = css({
  display: "flex",
  flexShrink: 0,
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  width: "85vw",
  maxWidth: "360px",
  zIndex: 50,
  boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
  background: "var(--md-sys-color-surface)",
  overflow: "hidden",
});

/** Close button at the right edge of the open drawer */
const closeButton = css({
  position: "absolute",
  right: "-16px",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 51,
  width: "32px",
  height: "48px",
  borderRadius: "0 24px 24px 0",
  background: "var(--md-sys-color-surface)",
  border: "none",
  cursor: "pointer",
  color: "var(--md-sys-color-on-surface)",
  fontSize: "20px",
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
  paddingLeft: "4px",
});

/** Mobile: hidden entirely so messages get full width */
const drawerHidden = css({
  display: "none",
});

/** Translucent overlay behind the drawer — tap to dismiss */
const scrim = css({
  position: "fixed",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 49,
  background: "rgba(0,0,0,0.4)",
});
