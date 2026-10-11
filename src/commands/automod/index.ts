import {
  PermissionFlagsBits as P,
  AutoModerationRuleEventType as Event,
  AutoModerationRuleTriggerType as Trigger,
  AutoModerationActionType as Action,
} from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt, num } from '../types.js';
import { say, esc } from '../../services/format.js';
const id = txt('id', 'Discord AutoMod rule ID');
const permissions = { userPermissions: P.ManageGuild, botPermissions: P.ManageGuild };
export default actionGroup(
  'automod',
  'Manage Discord-native AutoMod without message-content access',
  [
    {
      name: 'keywords',
      description: 'Create a blocking keyword rule',
      ...permissions,
      options: [txt('name'), txt('words', 'Comma-separated keywords')],
      execute: async (i) => {
        const words = i.options
          .getString('words', true)
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean);
        if (!words.length || words.length > 100 || words.some((w) => w.length > 60)) {
          await say(i, 'Use 1–100 keywords, at most 60 characters each.', true);
          return;
        }
        const rule = await i.guild!.autoModerationRules.create({
          name: i.options.getString('name', true).slice(0, 100),
          eventType: Event.MessageSend,
          triggerType: Trigger.Keyword,
          triggerMetadata: { keywordFilter: words },
          actions: [{ type: Action.BlockMessage }],
          enabled: true,
          reason: `Configured by ${i.user.id}`,
        });
        await say(i, `Created rule ${rule.id}.`, true);
      },
    },
    {
      name: 'mentions',
      description: 'Create a rule blocking excessive unique mentions',
      ...permissions,
      options: [txt('name'), num('limit', 'Maximum unique mentions', 1, 50)],
      execute: async (i) => {
        const r = await i.guild!.autoModerationRules.create({
          name: i.options.getString('name', true).slice(0, 100),
          eventType: Event.MessageSend,
          triggerType: Trigger.MentionSpam,
          triggerMetadata: { mentionTotalLimit: i.options.getInteger('limit', true) },
          actions: [{ type: Action.BlockMessage }],
          enabled: true,
        });
        await say(i, `Created rule ${r.id}.`, true);
      },
    },
    {
      name: 'spam',
      description: 'Create a Discord spam-content blocking rule',
      ...permissions,
      options: [txt('name')],
      execute: async (i) => {
        const r = await i.guild!.autoModerationRules.create({
          name: i.options.getString('name', true).slice(0, 100),
          eventType: Event.MessageSend,
          triggerType: Trigger.Spam,
          actions: [{ type: Action.BlockMessage }],
          enabled: true,
        });
        await say(i, `Created rule ${r.id}.`, true);
      },
    },
    {
      name: 'list',
      description: 'List server AutoMod rules',
      ...permissions,
      execute: async (i) => {
        const rules = await i.guild!.autoModerationRules.fetch();
        await say(
          i,
          rules
            .map((r) => `${r.id}: ${esc(r.name)} (${r.enabled ? 'enabled' : 'disabled'})`)
            .join('\n') || 'No AutoMod rules.',
          true,
        );
      },
    },
    {
      name: 'enable',
      description: 'Enable an existing AutoMod rule',
      ...permissions,
      options: [id],
      execute: async (i) => {
        await i.guild!.autoModerationRules.edit(i.options.getString('id', true), { enabled: true });
        await say(i, 'Rule enabled.', true);
      },
    },
    {
      name: 'disable',
      description: 'Disable an existing AutoMod rule',
      ...permissions,
      options: [id],
      execute: async (i) => {
        await i.guild!.autoModerationRules.edit(i.options.getString('id', true), {
          enabled: false,
        });
        await say(i, 'Rule disabled.', true);
      },
    },
    {
      name: 'delete',
      description: 'Delete a server AutoMod rule by ID',
      ...permissions,
      options: [id],
      execute: async (i) => {
        await i.guild!.autoModerationRules.delete(i.options.getString('id', true));
        await say(i, 'Rule deleted.', true);
      },
    },
    {
      name: 'inspect',
      description: 'Show AutoMod rule details',
      ...permissions,
      options: [id],
      execute: async (i) => {
        const r = await i.guild!.autoModerationRules.fetch(i.options.getString('id', true));
        await say(
          i,
          `${esc(r.name)}\nTrigger: ${r.triggerType}\nEnabled: ${r.enabled}\nExempt roles: ${r.exemptRoles.size}\nExempt channels: ${r.exemptChannels.size}\nKeywords: ${(r.triggerMetadata.keywordFilter ?? []).map(esc).join(', ')}`,
          true,
        );
      },
    },
  ],
  P.ManageGuild,
);
