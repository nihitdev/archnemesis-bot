import type { Group } from '../types.js';
import { opt, usr, num } from '../types.js';
import { needGuild, say, formatInt, pick } from '../../services/format.js';
const goods = {
  cat: { price: 300, emoji: '🐱' },
  crown: { price: 900, emoji: '👑' },
  nebula: { price: 750, emoji: '🌌' },
  rocket: { price: 500, emoji: '🚀' },
  sword: { price: 400, emoji: '⚔️' },
  frog: { price: 200, emoji: '🐸' },
  diamond: { price: 1200, emoji: '💎' },
  penguin: { price: 350, emoji: '🐧' },
};
const item = {
  name: 'item',
  description: 'Store item name',
  type: 'string' as const,
  required: true,
  choices: Object.keys(goods),
};
const list = [
  { name: 'balance', description: 'Show a wallet and bank balance', options: [usr(false)] },
  { name: 'daily', description: 'Claim a daily coin reward' },
  { name: 'work', description: 'Earn coins by working' },
  { name: 'beg', description: 'Ask for a little spare change' },
  {
    name: 'deposit',
    description: 'Move wallet coins into bank',
    options: [num('amount', 'How many coins', 1, 100000000)],
  },
  {
    name: 'withdraw',
    description: 'Move bank coins into wallet',
    options: [num('amount', 'How many coins', 1, 100000000)],
  },
  {
    name: 'pay',
    description: 'Transfer coins to another member',
    options: [usr(), num('amount', 'How many coins', 1, 100000000)],
  },
  { name: 'leaderboard', description: 'Richest members in this server' },
  { name: 'shop', description: 'List items in the shop' },
  { name: 'buy', description: 'Buy a cosmetic store item', options: [item] },
  { name: 'inventory', description: 'Show your owned cosmetics', options: [usr(false)] },
  { name: 'equip', description: 'Equip a cosmetic item', options: [item] },
  { name: 'unequip', description: 'Remove your active cosmetic item' },
  { name: 'profile', description: 'Show your economy profile', options: [usr(false)] },
  { name: 'networth', description: 'Display total virtual coins', options: [usr(false)] },
  {
    name: 'coinflip',
    description: 'Bet virtual coins on a coin flip',
    options: [
      num('amount', 'Wager virtual coins', 1, 10000),
      {
        name: 'side',
        description: 'Heads or tails',
        type: 'string' as const,
        required: true,
        choices: ['heads', 'tails'],
      },
    ],
  },
  { name: 'gift', description: 'Give a cosmetic item to a user', options: [usr(), item] },
  { name: 'help', description: 'Explain the imaginary coin economy' },
];
export default {
  name: 'economy',
  description: 'Local virtual coins, daily rewards and cosmetics',
  subs: list,
  run: async (i, sub, c) => {
    const g = needGuild(i),
      who = i.options.getUser('user') ?? i.user,
      user = c.db.user(g, who.id),
      my = c.db.user(g, i.user.id),
      now = Date.now();
    const total = (d: typeof user) => d.wallet + d.bank;
    switch (sub) {
      case 'balance':
        return void (await say(
          i,
          `🪙 <@${who.id}> — Wallet: **${formatInt(user.wallet)}** • Bank: **${formatInt(user.bank)}**`,
        ));
      case 'networth':
        return void (await say(
          i,
          `💰 <@${who.id}> is worth **${formatInt(total(user))}** virtual coins.`,
        ));
      case 'profile':
        return void (await say(
          i,
          `👑 <@${who.id}> • ${formatInt(total(user))} coins • Cosmetics: ${user.inventory.length} • Equipped: ${user.equipped ? `${goods[user.equipped as keyof typeof goods]?.emoji ?? ''} ${user.equipped}` : 'none'}`,
        ));
      case 'daily':
      case 'work':
      case 'beg': {
        const field = sub === 'daily' ? 'lastDaily' : sub === 'work' ? 'lastWork' : 'lastBeg';
        const wait = sub === 'daily' ? 20 * 3600000 : sub === 'work' ? 45 * 60000 : 15 * 60000;
        if (now - my[field] < wait)
          return void (await say(
            i,
            `⏳ Come back in **${Math.ceil((wait - (now - my[field])) / 60000)} minutes**.`,
            true,
          ));
        const amount =
          sub === 'daily'
            ? 250
            : sub === 'work'
              ? 100 + Math.floor(Math.random() * 131)
              : 10 + Math.floor(Math.random() * 31);
        c.db.changeUser(g, i.user.id, (d) => {
          d.wallet += amount;
          d[field] = now;
        });
        return void (await say(
          i,
          `${sub === 'daily' ? '🎁' : sub === 'work' ? '🛠️' : '🥺'} You earned **${amount}** virtual coins!`,
        ));
      }
      case 'deposit':
      case 'withdraw': {
        const amount = opt.int(i, 'amount'),
          from = sub === 'deposit' ? 'wallet' : 'bank',
          to = sub === 'deposit' ? 'bank' : 'wallet';
        if (my[from] < amount)
          return void (await say(i, `❌ Not enough coins in your ${from}.`, true));
        c.db.changeUser(g, i.user.id, (d) => {
          d[from] -= amount;
          d[to] += amount;
        });
        return void (await say(i, `✅ Moved **${formatInt(amount)}** coins to your ${to}.`, true));
      }
      case 'pay': {
        const amount = opt.int(i, 'amount'),
          to = opt.u(i, 'user');
        if (to.bot || to.id === i.user.id)
          return void (await say(i, '❌ Choose a different human member.', true));
        return void (await say(
          i,
          c.db.transfer(g, i.user.id, to.id, amount)
            ? `✅ Sent **${formatInt(amount)}** virtual coins to <@${to.id}>.`
            : '❌ Not enough coins.',
          true,
        ));
      }
      case 'leaderboard': {
        const x = c.db.leaders(g, 'wealth');
        return void (await say(
          i,
          `💰 **Richest members**\n${x.map((v, index) => `${index + 1}. <@${v.id}> — ${formatInt(v.value)}`).join('\n') || 'No balances yet.'}`,
        ));
      }
      case 'shop':
        return void (await say(
          i,
          `🛍️ **Cosmetic shop**\n${Object.entries(goods)
            .map(([name, info]) => `${info.emoji} **${name}** — ${info.price} coins`)
            .join('\n')}`,
        ));
      case 'buy': {
        const name = opt.s(i, 'item') as keyof typeof goods,
          price = goods[name].price;
        if (my.inventory.includes(name)) return void (await say(i, '❌ Already owned.', true));
        if (my.wallet < price) return void (await say(i, '❌ Not enough wallet coins.', true));
        c.db.changeUser(g, i.user.id, (d) => {
          d.wallet -= price;
          d.inventory.push(name);
        });
        return void (await say(i, `🛍️ Bought ${goods[name].emoji} **${name}**!`, true));
      }
      case 'inventory':
        return void (await say(
          i,
          `🎒 <@${who.id}>: ${user.inventory.map((v) => `${goods[v as keyof typeof goods]?.emoji ?? '▫️'} ${v}`).join(', ') || 'Empty'}`,
        ));
      case 'equip': {
        const name = opt.s(i, 'item');
        if (!my.inventory.includes(name))
          return void (await say(i, '❌ You do not own this item.', true));
        c.db.changeUser(g, i.user.id, (d) => (d.equipped = name));
        return void (await say(i, `✅ Equipped ${name}.`, true));
      }
      case 'unequip':
        c.db.changeUser(g, i.user.id, (d) => (d.equipped = null));
        return void (await say(i, '✅ Unequipped cosmetic.', true));
      case 'coinflip': {
        const amount = opt.int(i, 'amount'),
          side = opt.s(i, 'side');
        if (my.wallet < amount) return void (await say(i, '❌ Not enough virtual coins.', true));
        const flip = pick(['heads', 'tails']);
        const won = flip === side;
        c.db.changeUser(g, i.user.id, (d) => (d.wallet += won ? amount : -amount));
        return void (await say(
          i,
          `🪙 ${flip.toUpperCase()} — **${won ? 'Won' : 'Lost'} ${formatInt(amount)} virtual coins!**`,
        ));
      }
      case 'gift': {
        const target = opt.u(i, 'user'),
          name = opt.s(i, 'item');
        if (target.id === i.user.id || target.bot)
          return void (await say(i, '❌ Choose another human.', true));
        if (!my.inventory.includes(name))
          return void (await say(i, '❌ You do not own that item.', true));
        if (c.db.user(g, target.id).inventory.includes(name))
          return void (await say(i, '❌ Recipient already owns the item.', true));
        c.db.transaction(() => {
          c.db.changeUser(g, i.user.id, (d) => {
            d.inventory = d.inventory.filter((x) => x !== name);
            if (d.equipped === name) d.equipped = null;
          });
          c.db.changeUser(g, target.id, (d) => d.inventory.push(name));
        });
        return void (await say(i, `🎁 Gifted **${name}** to <@${target.id}>!`, true));
      }
      case 'help':
        return void (await say(
          i,
          '🪙 All coins are imaginary in-server points, with no real-world value, purchases, or withdrawals. Start with 100 coins, claim /economy daily, work, shop and trade cosmetics. Data is stored locally under data/bot.sqlite.',
        ));
    }
  },
} satisfies Group;
