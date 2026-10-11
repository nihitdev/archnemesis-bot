import { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits as P } from 'discord.js';
import type { Group } from '../types.js';
import { disconnectAudio } from '../../services/audio.js';
import { say } from '../../services/format.js';
import { initializeGuild, diagnoseGuild } from '../../services/guilds.js';
export default {
  name: 'setup',
  description: 'Configure this server and optional bot role',
  defaultPermissions: P.ManageGuild,
  subs: [
    { name: 'wizard', description: 'Open the interactive configuration wizard' },
    { name: 'permissions', description: 'Inspect permissions and safe setup instructions' },
    { name: 'role', description: 'Create or reuse the optional cosmetic bot role' },
    {
      name: 'color',
      description: 'Set the color for future setup role creation',
      options: [
        {
          name: 'hex',
          description: 'Six-digit hex color',
          type: 'string' as const,
          required: true,
          min: 6,
          max: 7,
        },
      ],
    },
    {
      name: 'module',
      description: 'Enable or disable a module for this server',
      options: [
        {
          name: 'name',
          description: 'Command group name',
          type: 'string' as const,
          required: true,
        },
        { name: 'enabled', description: 'Enable module', type: 'boolean' as const, required: true },
      ],
    },
    { name: 'status', description: 'Show saved server configuration' },
  ].map((s) => ({ ...s, userPermissions: P.ManageGuild })),
  run: async (i, sub, c) => {
    const id = i.guildId!;
    switch (sub) {
      case 'wizard': {
        const menu = new StringSelectMenuBuilder()
          .setCustomId(`setup:${i.user.id}:${Date.now()}`)
          .setPlaceholder('Choose a setup step')
          .addOptions(
            { label: 'Check permissions and channels', value: 'permissions' },
            { label: 'Create or reuse bot role', value: 'role' },
            { label: 'Enable XP tracking', value: 'xp-on' },
            { label: 'Disable XP tracking', value: 'xp-off' },
          );
        await i.editReply({
          content:
            'Server setup: select a step. For module controls use /setup module; for log and announcement channels use /administration.',
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
        });
        return;
      }
      case 'permissions':
        if (!i.deferred) await i.deferReply({ flags: 64 });
        await say(i, await diagnoseGuild(i.guild!, c.db));
        return;
      case 'role': {
        if (!i.deferred) await i.deferReply({ flags: 64 });
        const warnings = await initializeGuild(i.guild!, c.db);
        await say(
          i,
          warnings.join('\n') || 'Setup role is ready. No permissions were granted to it.',
        );
        return;
      }
      case 'color': {
        const hex = i.options.getString('hex', true).replace(/^#/, '');
        if (!/^[a-f0-9]{6}$/i.test(hex)) {
          await say(i, 'Enter a six-digit hex color.', true);
          return;
        }
        c.db.changeGuild(id, (g) => (g.roleColor = parseInt(hex, 16)));
        await say(
          i,
          'Saved. Existing roles are preserved; this color applies to future creation.',
          true,
        );
        return;
      }
      case 'module': {
        const name = i.options.getString('name', true),
          enabled = i.options.getBoolean('enabled', true);
        if (!c.commands.has(name) || ['setup', 'diagnose', 'developer'].includes(name)) {
          await say(
            i,
            'Choose an existing feature module. Setup, diagnose and developer cannot be disabled.',
            true,
          );
          return;
        }
        c.db.changeGuild(id, (g) => {
          g.disabledModules = g.disabledModules.filter((n) => n !== name);
          if (!enabled) g.disabledModules.push(name);
        });
        if (name === 'audio' && !enabled) disconnectAudio(id);
        await say(i, `${name}: ${enabled ? 'enabled' : 'disabled'}`, true);
        return;
      }
      case 'status':
        await say(i, JSON.stringify(c.db.guild(id), null, 2), true);
        return;
    }
  },
} satisfies Group;
