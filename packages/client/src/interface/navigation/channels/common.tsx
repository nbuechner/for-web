import { styled } from "styled-system/jsx";

/**
 * Common styles for sidebar
 */
export const SidebarBase = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: "var(--borderRadius-lg)",
    borderBottomLeftRadius: "var(--borderRadius-lg)",
    width: "var(--layout-width-channel-sidebar)",

    fill: "var(--md-sys-color-on-surface)",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-low)",

    "& a": {
      textDecoration: "none",
    },

    // On mobile, overlay the content area and fill remaining width after server list
    "@media (max-width: 768px)": {
      position: "absolute",
      // Offset by server list width (56px)
      left: "56px",
      top: 0,
      bottom: 0,
      width: "calc(100vw - 56px)",
      zIndex: 50,
      boxShadow: "4px 0 16px rgba(0,0,0,0.25)",
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
  },
});
