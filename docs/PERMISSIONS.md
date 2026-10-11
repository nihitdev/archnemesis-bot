# Permission troubleshooting

Start with `/diagnose check` and `/setup permissions`. Grant privileges to the bot's integration role, not to its optional zero-permission cosmetic setup role. Never grant Administrator as a shortcut.

| Feature | Invoking member | Bot |
| --- | --- | --- |
| Local settings, XP edits | Manage Server | No matching staff permission required |
| Stored warnings/case history | Moderate Members | No matching staff permission required |
| Ban/unban | Ban Members | Ban Members |
| Kick | Kick Members | Kick Members |
| Timeout | Moderate Members | Moderate Members |
| Message cleanup | Manage Messages in channel | Manage Messages in channel |
| Role assignment/editing | Manage Roles | Manage Roles; editable role below bot |
| Slowmode/channel edits | Manage Channels in target channel | Manage Channels in target channel |
| Channel overwrites | Manage Roles in target channel | Manage Roles in target channel |
| Native AutoMod | Manage Server | Manage Server |
| Ticket creation | Any member after server-manager configuration | Manage Channels and Manage Roles |
| Reaction-role setup | Manage Roles | Manage Roles, plus Add Reactions/Read Message History in source channel |
| Local audio | Must share the bot's voice channel | Connect and Speak in that channel |
| Welcome/logging/starboard output | Configured by Manage Server member | View Channel and Send Messages in destination |
| Discord audit-log inspection | View Audit Log | View Audit Log |

Some features need Embed Links or Attach Files depending on the output and channel. The baseline invite requests View Channel, Send Messages, Embed Links and Read Message History (`84992`). Feature permissions are optional administrator decisions; the bot does not silently escalate them.

## Role hierarchy

Move the bot integration role above the members and roles it must manage. A moderator must also be above their target and the assigned role. The bot rejects targeting the server owner, the invoking moderator, itself, equal/higher members and uneditable managed roles. Discord does not allow timing out administrators. Administrator permission does not bypass the bot's own hierarchy restrictions.

If ARCHNEMESIS BOT already exists, setup reuses it without changing it. Roles with existing permission grants or channel allows are preserved but are not automatically assigned. Resolve duplicate same-name roles explicitly; setup will report ambiguity. `/setup color` affects future creation only.

## Channel overrides

A guild permission may be denied by a channel overwrite. Inspect the selected channel, category synchronization, member overwrites and role overwrites. Channel-management commands validate the selected target channel, not just the channel where the command was invoked. Other roles may explicitly allow sending even when @everyone is denied; locking @everyone does not guarantee a universal lockdown.

A deleted or inaccessible configured channel is reported by `/diagnose check`. Set a replacement using `/administration levelchannel`, `/administration modlog`, `/welcome channel`, `/logging channel`, or `/starboard channel` as applicable.

## Command visibility

Discord applies `default_member_permissions` to top-level commands, not individual subcommands. Mixed groups stay visible while sensitive actions enforce runtime permissions. Server owners may further restrict application command access under Server Settings → Integrations. `/developer` is hidden from non-administrators by default and still requires a configured `DEV_USER_IDS` operator.

If commands are missing, verify the install included `applications.commands`, the bot uses the intended application token, and global propagation has completed. A development guild copy may shadow a global command. Global registration does not require a guild ID.

Official references: [Discord command limits and permissions](https://docs.discord.com/developers/interactions/application-commands), [Discord role and channel permissions](https://docs.discord.com/developers/topics/permissions).
