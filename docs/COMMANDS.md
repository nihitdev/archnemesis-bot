# Command reference

342 registered slash actions in 36 groups. 325 counted actions after excluding declared aliases and informational-only actions. All registered actions have dispatch/acknowledgement smoke tests; this is not equivalent to live Discord verification.

Each command is server-scoped. Modules may be disabled with `/setup module`. Permission names below apply at runtime; Discord default visibility applies to the top-level group.

## /administration

Server info and server-specific bot settings

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| server | Information about this server | None | None | Yes |
| member | Information about a server member | None | None | Yes |
| channel | Information about a channel | None | None | Yes |
| role | Information about a role | None | None | Yes |
| roles | Top server roles | None | None | Yes |
| channels | List number of channels by type | None | None | Yes |
| settings | Show bot settings | None | None | Yes |
| leveling | Enable or disable XP rewards | Manage Server | None | Yes |
| levelchannel | Set channel for level-up announcements | Manage Server | None | Yes |
| clearlevelchannel | Disable level-up announcements | Manage Server | None | Yes |
| modlog | Set moderation audit channel | Manage Server | None | Yes |
| clearmodlog | Disable moderation audit channel | Manage Server | None | Yes |
| emojis | List server emoji names | None | None | Yes |
| boosts | Show server boost stats | None | None | Yes |

## /audio

Optional playback of operator-provided Ogg Opus audio

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| library | List locally available Ogg Opus tracks | None | None | Yes |
| play | Queue a local track and join your voice channel | None | None | Yes |
| pause | Pause current local playback | None | None | Yes |
| resume | Resume paused playback | None | None | Yes |
| skip | Skip to the next queued track | None | None | Yes |
| stop | Clear the queue and stop playback | None | None | Yes |
| leave | Stop playback and disconnect from voice | None | None | Yes |
| queue | Show the guild’s pending track queue | None | None | Yes |
| now | Show the current track and voice status | None | None | Yes |

## /audit

Server-scoped bot action history

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| recent | Show recent bot audit records | Manage Server | None | Yes |
| actor | Find recent actions by a staff member | Manage Server | None | Yes |
| record | Inspect an audit entry | Manage Server | None | Yes |
| export | Export up to 1000 recent bot audit records as JSON | Manage Server | None | Yes |
| discord | Read recent Discord server audit entries | View Audit Log | View Audit Log | Yes |

## /automod

Manage Discord-native AutoMod without message-content access

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| keywords | Create a blocking keyword rule | Manage Server | Manage Server | Yes |
| mentions | Create a rule blocking excessive unique mentions | Manage Server | Manage Server | Yes |
| spam | Create a Discord spam-content blocking rule | Manage Server | Manage Server | Yes |
| list | List server AutoMod rules | Manage Server | Manage Server | Yes |
| enable | Enable an existing AutoMod rule | Manage Server | Manage Server | Yes |
| disable | Disable an existing AutoMod rule | Manage Server | Manage Server | Yes |
| delete | Delete a server AutoMod rule by ID | Manage Server | Manage Server | Yes |
| inspect | Show AutoMod rule details | Manage Server | Manage Server | Yes |

## /bookmarks

Private links and labels saved per server

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| save | Save an HTTPS link with a label | None | None | Yes |
| list | List your saved links | None | None | Yes |
| open | Show one of your saved links | None | None | Yes |
| delete | Remove a bookmark | None | None | Yes |
| label | Change a bookmark’s label | None | None | Yes |
| search | Search your saved labels and URLs | None | None | Yes |

## /cases

Persistent moderation case history

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| view | View a recorded moderation case | Moderate Members | None | Yes |
| recent | List recent moderation cases | Moderate Members | None | Yes |
| member | Find cases for a member | Moderate Members | None | Yes |
| annotate | Append a staff note without altering original case evidence | Moderate Members | None | Yes |
| resolve | Mark a moderation case reviewed | Moderate Members | None | Yes |

## /channels

Channel configuration with target-channel permission checks

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| create | Create a regular text channel | Manage Channels | Manage Channels | Yes |
| topic | Set a text channel topic | Manage Channels | Manage Channels | Yes |
| cleartopic | Clear a text channel topic | Manage Channels | Manage Channels | Yes |
| rename | Rename a text channel | Manage Channels | Manage Channels | Yes |
| nsfw | Set a channel age restriction flag | Manage Channels | Manage Channels | Yes |
| slowmode | Set slowmode on a selected channel | Manage Channels | Manage Channels | Yes |
| position | Move a text channel within its category | Manage Channels | Manage Channels | Yes |
| permissions | Inspect your and the bot’s permissions in a selected channel | None | None | Yes |
| archive | Lock a channel and save the original everyone overwrite | Manage Channels | Manage Roles | Yes |
| restore | Restore an archived channel’s original everyone overwrite | Manage Channels | Manage Roles | Yes |

## /config

Inspect and maintain server-scoped bot configuration

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| export | Download bot settings for this guild without user data | Manage Server | None | Yes |
| modules | Show available modules and their enabled states | Manage Server | None | Yes |
| storage | Show this guild’s stored record counts | Manage Server | None | Yes |
| resetsettings | Reset XP/log channel settings while retaining user data and role records | Manage Server | None | Yes |
| deleteguild | Server-owner-only permanent deletion of this guild’s local bot data | Administrator | None | Yes |

## /developer

Owner-only diagnostics and registration

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| health | Bot readiness and uptime | None | None | Yes |
| stats | Runtime and local storage stats | None | None | Yes |
| servers | Names of servers the bot can see | None | None | Yes |
| memory | Runtime Node.js memory usage | None | None | Yes |
| commands | Number of registered local commands | None | None | Yes |
| sync | Re-register slash commands (developer only) | None | None | Yes |
| version | Print runtime environment versions | None | None | Yes |

## /diagnose

Find missing permissions and configuration problems

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| check | Inspect server permissions, channels and role hierarchy | Manage Server | None | Yes |

## /economy

Local virtual coins, daily rewards and cosmetics

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| balance | Show a wallet and bank balance | None | None | Yes |
| daily | Claim a daily coin reward | None | None | Yes |
| work | Earn coins by working | None | None | Yes |
| beg | Ask for a little spare change | None | None | Yes |
| deposit | Move wallet coins into bank | None | None | Yes |
| withdraw | Move bank coins into wallet | None | None | Yes |
| pay | Transfer coins to another member | None | None | Yes |
| leaderboard | Richest members in this server | None | None | Yes |
| shop | List items in the shop | None | None | Yes |
| buy | Buy a cosmetic store item | None | None | Yes |
| inventory | Show your owned cosmetics | None | None | Yes |
| equip | Equip a cosmetic item | None | None | Yes |
| unequip | Remove your active cosmetic item | None | None | Yes |
| profile | Show your economy profile | None | None | Yes |
| networth | Display total virtual coins | None | None | Yes |
| coinflip | Bet virtual coins on a coin flip | None | None | Yes |
| gift | Give a cosmetic item to a user | None | None | Yes |
| help | Explain the imaginary coin economy | None | None | Informational |

## /events

Persistent community event planning and RSVP lists

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| create | Schedule a community event in UTC | None | None | Yes |
| rsvp | RSVP going, maybe, or declined | None | None | Yes |
| attendees | List event RSVPs | None | None | Yes |
| info | Show event schedule and status | None | None | Yes |
| list | Show future events | None | None | Yes |
| cancel | Cancel an event you host | None | None | Yes |
| reschedule | Move an event to a future time | None | None | Yes |
| capacity | Set the attendee limit; zero means unlimited | None | None | Yes |
| mine | Show your upcoming RSVPs | None | None | Yes |

## /fun

Quick games, randomness and playful commands

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| eightball | Ask the magic eight ball | None | None | Yes |
| coinflip | Flip a virtual coin | None | None | Alias of utility/coin |
| dice | Roll any number of dice (up to 20) | None | None | Alias of utility/roll |
| choose | Choose from comma-separated options | None | None | Alias of utility/choose |
| rps | Play rock-paper-scissors | None | None | Yes |
| rate | Rate any topic out of 10 | None | None | Yes |
| ship | Compatibility game for two names | None | None | Yes |
| joke | Random programming joke | None | None | Yes |
| fact | Random interesting fact | None | None | Yes |
| compliment | Give someone a compliment | None | None | Yes |
| number | Guess a number from 1 to 10 | None | None | Yes |
| lucky | Get your lucky number for today | None | None | Yes |
| fortune | Get a friendly fortune | None | None | Yes |
| vibe | Find your current vibe | None | None | Yes |
| motivate | A bit of motivation | None | None | Yes |
| randomemoji | A random emoji | None | None | Yes |
| randomcolor | A random hex color | None | None | Yes |
| countdown | Count down from a number | None | None | Yes |
| highlow | Predict a dice roll over or under 50 | None | None | Alias of games/highlow |
| magicword | Choose a random magical word | None | None | Yes |
| rollcall | Suggest a fun nickname for a user | None | None | Yes |

## /games

12 lightweight server games (no gambling or paid currency)

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| slots | Spin a slot machine | None | None | Yes |
| highlow | Guess high or low on 1–100 | None | None | Yes |
| guess | Guess a number between 1 and 100 | None | None | Yes |
| scramble | Get a scrambled word to solve | None | None | Yes |
| trivia | Answer a random trivia question | None | None | Yes |
| coin | Toss a coin | None | None | Alias of utility/coin |
| dice | Roll a D20 | None | None | Alias of utility/roll |
| lottery | Generate six random numbers | None | None | Yes |
| blackjack | Get a two-card blackjack opening hand | None | None | Yes |
| memory | Get a simple memory challenge | None | None | Yes |
| anagram | Sort letters alphabetically | None | None | Yes |
| reaction | Get a reaction challenge | None | None | Informational |

## /giveaways

Server giveaways with persistent entries and random drawing

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| create | Open a giveaway for an announced prize | Manage Server | None | Yes |
| enter | Enter an open giveaway once | None | None | Yes |
| leave | Withdraw your entry | None | None | Yes |
| draw | Draw a random winner after the entry window ends | Manage Server | None | Yes |
| reroll | Draw a different winner from remaining entrants | Manage Server | None | Yes |
| cancel | Cancel a giveaway without drawing | Manage Server | None | Yes |
| extend | Extend an open giveaway entry window | Manage Server | None | Yes |
| info | Show prize, entry count and winners | None | None | Yes |
| list | List recent server giveaways | None | None | Yes |

## /images

View profile and server images without external image APIs

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| meme | Render a two-panel text meme as a PNG | None | None | Yes |
| quote | Render a quote and attribution as a PNG card | None | None | Yes |
| avatar | Link to a full-size user avatar | None | None | Yes |
| globalavatar | Show a global profile avatar | None | None | Alias of images/avatar |
| serveravatar | Server-specific profile avatar if set | None | None | Yes |
| banner | Link to a user banner | None | None | Yes |
| servericon | Link to your server icon | None | None | Yes |
| serverbanner | Link to your server banner | None | None | Yes |
| emoji | Show custom emoji metadata | None | None | Yes |
| splash | Show the server invitation splash image | None | None | Yes |

## /leveling

Automatic XP, rank and server leaderboards

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| rank | Your XP and level | None | None | Yes |
| leaderboard | Server XP leaderboard | None | None | Yes |
| progress | XP needed for next level | None | None | Yes |
| levelcalc | XP threshold for a given level | None | None | Yes |
| setxp | Set a member XP amount (staff) | Manage Server | None | Yes |
| addxp | Give a member XP (staff) | Manage Server | None | Yes |
| resetxp | Reset one member XP (staff) | Manage Server | None | Yes |
| messages | Count XP-eligible messages | None | None | Yes |
| help | How XP and levels work | None | None | Informational |

## /logging

Channel and role lifecycle logging

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| channel | Choose a channel for channel/role create/delete events | Manage Server | None | Yes |
| disable | Disable automatic lifecycle logs | Manage Server | None | Yes |
| enable | Resume automatic lifecycle logs | Manage Server | None | Yes |
| recent | Show recently captured lifecycle events | Manage Server | None | Yes |
| test | Send a diagnostic event through the configured logger | Manage Server | None | Yes |

## /moderation

Staff moderation and warning commands

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| ban | Ban a user from the server | Ban Members | Ban Members | Yes |
| kick | Kick a member | Kick Members | Kick Members | Yes |
| unban | Unban a Discord user by ID | Ban Members | Ban Members | Yes |
| timeout | Temporarily timeout a member | Moderate Members | Moderate Members | Yes |
| untimeout | Remove member timeout | Moderate Members | Moderate Members | Yes |
| warn | Store a moderator warning | Moderate Members | None | Yes |
| warnings | Show a member warning history | Moderate Members | None | Yes |
| clearwarnings | Clear stored member warnings | Moderate Members | None | Yes |
| purge | Bulk delete recent messages (up to 100) | Manage Messages | Manage Messages | Yes |
| slowmode | Set channel slowmode seconds | Manage Channels | Manage Channels | Yes |
| lock | Lock the current text channel | Manage Roles | Manage Roles | Yes |
| unlock | Unlock the current text channel | Manage Roles | Manage Roles | Yes |
| nickname | Change or clear a member nickname | Manage Nicknames | Manage Nicknames | Yes |
| roleadd | Give a role to a member | Manage Roles | Manage Roles | Yes |
| roleremove | Remove a role from a member | Manage Roles | Manage Roles | Yes |
| softban | Ban then unban to remove recent messages | Ban Members | Ban Members | Yes |

## /music

Music links, tempo and note tools (not a voice music player)

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| search | Make a YouTube Music search link | None | None | Yes |
| spotify | Make a Spotify search link | None | None | Yes |
| beat | Calculate milliseconds between beats | None | None | Yes |
| bars | Calculate duration of a musical passage | None | None | Yes |
| notes | Calculate equal temperament note frequency | None | None | Yes |
| tap | Guide to estimating BPM by tapping | None | None | Informational |
| format | Convert seconds into mm:ss format | None | None | Yes |
| help | Music utility help and limitations | None | None | Informational |

## /notes

Private server-scoped personal notes

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| add | Save a private note | None | None | Yes |
| read | Read one of your private notes | None | None | Yes |
| edit | Replace the content of a note | None | None | Yes |
| delete | Delete one of your notes | None | None | Yes |
| list | List your notes in this server | None | None | Yes |
| search | Search your notes | None | None | Yes |

## /polls

Persistent multiple-choice polls and ballots

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| create | Create a poll with 2–10 pipe-separated choices | None | None | Yes |
| vote | Cast or replace your ballot | None | None | Yes |
| results | Show vote totals for each choice | None | None | Yes |
| retract | Remove your ballot | None | None | Yes |
| close | Close your poll to further votes | None | None | Yes |
| reopen | Reopen a closed poll | None | None | Yes |
| list | List recent polls in this server | None | None | Yes |
| myvote | Show your private ballot | None | None | Yes |

## /reactionroles

Bind emoji reactions to approved cosmetic roles

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| add | Bind a reaction on a message to a previously approved self-role | Manage Roles | Manage Roles | Yes |
| list | List reaction-role bindings | Manage Roles | None | Yes |
| remove | Delete a binding without changing existing member roles | Manage Roles | None | Yes |
| disable | Pause one reaction-role binding | Manage Roles | None | Yes |
| enable | Resume a safe reaction-role binding | Manage Roles | Manage Roles | Yes |

## /reminders

Inspect and reschedule persistent reminders

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| at | Schedule a reminder at a UTC timestamp | None | None | Yes |
| snooze | Move a reminder forward from now | None | None | Yes |
| edit | Change reminder text | None | None | Yes |
| failed | List your reminders that exhausted delivery retries | None | None | Yes |
| retry | Retry a failed reminder in this channel | None | None | Yes |
| move | Move one of your reminders to the current channel | None | None | Yes |

## /roles

Safely create and customize server roles

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| create | Create a cosmetic role with no permissions | Manage Roles | Manage Roles | Yes |
| rename | Rename an editable role | Manage Roles | Manage Roles | Yes |
| color | Set an editable role’s hex color | Manage Roles | Manage Roles | Yes |
| hoist | Show or hide a role separately in the member list | Manage Roles | Manage Roles | Yes |
| mentionable | Allow or prevent everyone mentioning a role | Manage Roles | Manage Roles | Yes |
| permissions | Inspect a role’s permission flags | None | None | Yes |
| members | List cached members with a role | None | None | Yes |
| compare | Compare two roles in the hierarchy | None | None | Yes |

## /selfroles

Opt-in cosmetic roles with no permission escalation

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| allow | Allow members to opt into a zero-permission role | Manage Roles | Manage Roles | Yes |
| disallow | Stop new self-assignment of a role | Manage Roles | None | Yes |
| list | List opt-in server roles | None | None | Yes |
| join | Assign an approved cosmetic role to yourself | None | Manage Roles | Yes |
| leave | Remove an opt-in role from yourself | None | Manage Roles | Yes |

## /setup

Configure this server and optional bot role

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| wizard | Open the interactive configuration wizard | Manage Server | None | Yes |
| permissions | Inspect permissions and safe setup instructions | Manage Server | None | Yes |
| role | Create or reuse the optional cosmetic bot role | Manage Server | None | Yes |
| color | Set the color for future setup role creation | Manage Server | None | Yes |
| module | Enable or disable a module for this server | Manage Server | None | Yes |
| status | Show saved server configuration | Manage Server | None | Yes |

## /starboard

Highlight starred public-channel message links

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| channel | Set the public starboard destination | Manage Server | None | Yes |
| threshold | Set the number of stars needed for a highlight | Manage Server | None | Yes |
| disable | Disable new starboard updates | Manage Server | None | Yes |
| top | Show the most-starred tracked messages | None | None | Yes |
| status | Show starboard configuration and tracked message count | Manage Server | None | Yes |

## /suggestions

Collect and review community suggestions

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| compose | Submit a suggestion through a text form | None | None | Alias of suggestions/submit |
| panel | Post voting buttons for an open suggestion | Manage Server | None | Yes |
| submit | Submit a server improvement idea | None | None | Yes |
| vote | Support or oppose an open suggestion | None | None | Yes |
| view | Read a suggestion and its vote totals | None | None | Yes |
| list | List recent server suggestions | None | None | Yes |
| decide | Accept or decline a suggestion with a public reason | Manage Server | None | Yes |
| withdraw | Withdraw your own open suggestion | None | None | Yes |

## /tags

Reusable server text snippets

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| create | Create a unique server tag | Manage Server | None | Yes |
| show | Post a saved tag | None | None | Yes |
| edit | Replace a tag’s content | Manage Server | None | Yes |
| delete | Delete a server tag | Manage Server | None | Yes |
| list | List server tags | None | None | Yes |
| search | Find tags by name or content | None | None | Yes |
| info | Show tag author, creation time and usage | None | None | Yes |
| rename | Rename a tag without losing its usage count | Manage Server | None | Yes |

## /tasks

Private persistent personal task lists per server

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| add | Add a task to your list | None | None | Yes |
| list | Show your open tasks | None | None | Yes |
| done | Mark a task complete | None | None | Yes |
| reopen | Reopen a completed task | None | None | Yes |
| edit | Edit task text | None | None | Yes |
| priority | Set a task’s priority | None | None | Yes |
| due | Set a task deadline in UTC | None | None | Yes |
| delete | Delete a task | None | None | Yes |
| completed | Show completed tasks | None | None | Yes |

## /text

43 useful text and formatting tools

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| upper | UPPERCASE conversion | None | None | Yes |
| lower | lowercase conversion | None | None | Yes |
| title | Title Case conversion | None | None | Yes |
| sentence | Sentence case conversion | None | None | Yes |
| reverse | Reverse a string | None | None | Yes |
| flip | Reverse every word | None | None | Yes |
| alternating | aLtErNaTiNg CaSe | None | None | Yes |
| mock | mOcKiNg CaSe | None | None | Alias of text/alternating |
| clap | Add 👏 between words | None | None | Yes |
| space | Space out characters | None | None | Yes |
| dash | Join words with dashes | None | None | Yes |
| underscore | Join words with underscores | None | None | Yes |
| slug | Make URL-friendly slug | None | None | Yes |
| spoiler | Wrap text as spoiler | None | None | Yes |
| quote | Format a blockquote | None | None | Yes |
| code | Wrap text as inline code | None | None | Yes |
| bold | Wrap text as Discord bold | None | None | Yes |
| italic | Wrap text as Discord italic | None | None | Yes |
| strike | Discord strikethrough | None | None | Yes |
| underline | Discord underline | None | None | Yes |
| rot13 | ROT13 encode or decode | None | None | Yes |
| binary | Turn text into UTF-8 binary | None | None | Yes |
| unbinary | Decode binary bytes into text | None | None | Yes |
| base64 | Encode base64 | None | None | Yes |

## /textplus

More text transforms, encoding and counters

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| unbase64 | Decode base64 | None | None | Yes |
| morse | Morse code encoder | None | None | Yes |
| unmorse | Morse code decoder | None | None | Yes |
| words | Count words | None | None | Yes |
| characters | Count Unicode characters | None | None | Yes |
| lines | Count lines | None | None | Yes |
| sort | Sort lines alphabetically | None | None | Yes |
| unique | Remove duplicate lines | None | None | Yes |
| shuffle | Shuffle words | None | None | Yes |
| acronym | Make an acronym | None | None | Yes |
| initials | Get initials | None | None | Yes |
| palindrome | Check whether text is a palindrome | None | None | Yes |
| repeat | Repeat the text up to 10 times | None | None | Yes |
| trim | Trim extra whitespace | None | None | Yes |
| swapcase | Swap lowercase and uppercase | None | None | Yes |
| hex | UTF-8 text to hexadecimal | None | None | Yes |
| unhex | Decode UTF-8 hexadecimal | None | None | Yes |
| urlencode | Percent-encode text | None | None | Yes |
| urldecode | Decode percent-encoded text | None | None | Yes |

## /tickets

Private support channels and ticket tracking

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| configure | Choose the staff role allowed to access new tickets | Manage Server | None | Yes |
| open | Open a private support ticket channel | None | Manage Channels, Manage Roles | Yes |
| mine | Show your support tickets | None | None | Yes |
| queue | Show open tickets for server managers | Manage Server | None | Yes |
| close | Close your ticket and remove the requester’s send permission | None | Manage Roles | Yes |
| reopen | Reopen a closed ticket as a server manager | Manage Server | Manage Roles | Yes |
| claim | Assign yourself to handle a ticket | Manage Server | None | Yes |

## /utility

General info, tools, reminders and help

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| help | List all available command groups | None | None | Informational |
| ping | Bot gateway latency | None | None | Yes |
| uptime | Bot running time | None | None | Yes |
| about | About the ArchNemesis bot | None | None | Informational |
| invite | Get a bot invite link | None | None | Yes |
| user | Basic Discord account information | None | None | Yes |
| server | Basic server information | None | None | Alias of administration/server |
| id | Get a user or your own Discord ID | None | None | Yes |
| snowflake | Decode a Discord snowflake timestamp | None | None | Yes |
| timestamp | Convert UNIX seconds to Discord timestamp | None | None | Yes |
| now | The current UTC time | None | None | Yes |
| choose | Pick from comma-separated options | None | None | Yes |
| random | Generate a random integer | None | None | Yes |
| uuid | Generate a UUID version 4 | None | None | Yes |
| hash | SHA-256 hash of text | None | None | Yes |
| calc | Safe arithmetic calculator | None | None | Yes |
| color | Preview RGB values from a hex color | None | None | Yes |
| poll | Make a simple yes/no reaction poll | None | Add Reactions, Read Message History | Yes |
| remind | Schedule a reminder in this channel | None | None | Yes |
| reminders | Show your active reminders | None | None | Yes |
| cancelreminder | Cancel one of your reminders | None | None | Yes |
| profilelink | Make a Discord user profile link | None | None | Yes |
| bytes | Convert a number of bytes into IEC units | None | None | Yes |
| coin | Flip a quick virtual coin | None | None | Yes |
| roll | Roll a random number from 1 to N | None | None | Yes |

## /welcome

Configure optional member-join greeting messages

| Action | Description | Caller permissions | Bot permissions | Counted |
| --- | --- | --- | --- | --- |
| channel | Choose the channel for welcome messages | Manage Server | None | Yes |
| template | Set a greeting with {user} and {server} placeholders | Manage Server | None | Yes |
| enable | Enable welcomes when the optional member intent is configured | Manage Server | None | Yes |
| disable | Disable member-join greetings | Manage Server | None | Yes |
| preview | Preview your saved welcome template privately | Manage Server | None | Yes |
| status | Inspect welcome configuration and intent availability | Manage Server | None | Yes |

