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

    // On mobile, fill the drawer container (positioned by the parent Sidebar div)
    "@media (max-width: 768px)": {
      flex: "1 1 auto",
      minWidth: 0,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
  },
});
