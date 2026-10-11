import { PermissionFlagsBits } from 'discord.js';
import type { Group } from '../types.js';
import { diagnoseGuild } from '../../services/guilds.js';
import { say } from '../../services/format.js';
export default {
  name: 'diagnose',
  description: 'Find missing permissions and configuration problems',
  defaultPermissions: PermissionFlagsBits.ManageGuild,
  subs: [
    {
      name: 'check',
      description: 'Inspect server permissions, channels and role hierarchy',
      userPermissions: PermissionFlagsBits.ManageGuild,
    },
  ],
  run: async (i, _sub, c) => {
    if (!i.deferred) await i.deferReply({ flags: 64 });
    await say(i, await diagnoseGuild(i.guild!, c.db));
  },
} satisfies Group;
