import { createSignal, For, Show } from "solid-js";

import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useNavigate } from "@revolt/routing";
import { Column, Dialog, DialogProps, Form2, Radio2 } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

const VIEW_CHANNEL = 1048576; // 2^20

/**
 * Modal to create a new server channel
 */
export function CreateChannelModal(
  props: DialogProps & Modals & { type: "create_channel" },
) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { showError } = useModals();

  const group = createFormGroup({
    name: createFormControl("", { required: true }),
    type: createFormControl("Text"),
  });

  const [restricted, setRestricted] = createSignal(false);
  const [selectedRole, setSelectedRole] = createSignal("");

  const canSubmit = () =>
    Form2.canSubmit(group) && (!restricted() || !!selectedRole());

  async function onSubmit() {
    try {
      const channel = await props.server.createChannel({
        type: group.controls.type.value as "Text" | "Voice",
        name: group.controls.name.value,
      });

      if (restricted() && selectedRole()) {
        await channel.setPermissions("default", {
          allow: 0,
          deny: VIEW_CHANNEL,
        });
        await channel.setPermissions(selectedRole(), {
          allow: VIEW_CHANNEL,
          deny: 0,
        });
      }

      if (props.cb) {
        props.cb(channel);
      } else {
        navigate(`/server/${props.server.id}/channel/${channel.id}`);
      }

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create channel</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !canSubmit(),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <Form2.TextField
            minlength={1}
            maxlength={32}
            counter
            name="name"
            control={group.controls.name}
            label={t`Channel Name`}
          />

          <Form2.Radio control={group.controls.type}>
            <Radio2.Option value="Text">
              <Trans>Text Channel</Trans>
            </Radio2.Option>
            <Radio2.Option value="Voice">
              <Trans>Voice Channel</Trans>
            </Radio2.Option>
          </Form2.Radio>

          <label
            style={{
              display: "flex",
              gap: "8px",
              "align-items": "center",
              cursor: "pointer",
              "font-size": "0.9em",
            }}
          >
            <input
              type="checkbox"
              checked={restricted()}
              onChange={(e) => {
                setRestricted(e.currentTarget.checked);
                setSelectedRole("");
              }}
            />
            <Trans>Restrict to role</Trans>
          </label>

          <Show when={restricted()}>
            <select
              value={selectedRole()}
              onChange={(e) => setSelectedRole(e.currentTarget.value)}
              style={{
                width: "100%",
                padding: "8px",
                background: "var(--md-sys-color-surface-variant)",
                color: "var(--md-sys-color-on-surface-variant)",
                border: "1px solid var(--md-sys-color-outline)",
                "border-radius": "4px",
                "font-size": "0.9em",
              }}
            >
              <option value="">{t`— select a role —`}</option>
              <For each={props.server.orderedRoles}>
                {(role) => <option value={role.id}>{role.name}</option>}
              </For>
            </select>
          </Show>
        </Column>
      </form>
    </Dialog>
  );
}
