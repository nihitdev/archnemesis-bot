import { REST, Routes } from 'discord.js';
import { generate, type Group } from '../commands/types.js';
export function commandPayload(groups: Map<string, Group>) {
  if (groups.size > 100) throw new Error('Discord permits at most 100 global slash commands');
  return [...groups.values()].map((g) => generate(g).toJSON());
}
export async function syncCommands(
  rest: REST,
  applicationId: string,
  groups: Map<string, Group>,
  devGuild?: string,
) {
  const body = commandPayload(groups);
  // Always register globally. An optional development copy must not disable public installations.
  await rest.put(Routes.applicationCommands(applicationId), { body });
  if (devGuild) await rest.put(Routes.applicationGuildCommands(applicationId, devGuild), { body });
}
export const baselinePermissions = 84992n; // View Channel, Send Messages, Embed Links, Read Message History
export const installationUrl = (id: string) =>
  `https://discord.com/oauth2/authorize?client_id=${id}&permissions=${baselinePermissions}&scope=bot%20applications.commands`;
