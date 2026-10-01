# Armed Up 'N' Ready

**AI SWAT officers fill the empty slots of your co-op squad in *Ready or Not*.**

![Game](https://img.shields.io/badge/game-Ready%20or%20Not-1f2937)
![Engine](https://img.shields.io/badge/UE-5.3-1f2937)
![Loader](https://img.shields.io/badge/requires-UE4SS-f59e0b)
![Install](https://img.shields.io/badge/install-host%20only-2563eb)
![License](https://img.shields.io/badge/license-MIT-16a34a)

In solo you get four AI officers, but co-op gets none. A duo clears a whole building with two guns and no backup.

This mod brings the solo AI squad into co-op and sizes it to fit the lobby. Players and bots always add up to a full squad of five.

**[Website](https://rgb-outl4w.github.io/ArmedUpNReady/)** · **[Download](https://github.com/RGB-Outl4w/ArmedUpNReady/releases/latest)**

---

## Contents
- [Features](#features)
- [Squad size](#squad-size)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Uninstalling](#uninstalling)
- [How it works](#how-it-works)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Project layout](#project-layout)
- [License](#license)

## Features
- **Fills empty slots only.** One bot per missing player, up to four.
- **Only the host installs it.** Friends join with the unmodded game and see the bots like any other replicated character.
- **Normal commands.** The host commands the bots through the standard command menu: stack up, breach & clear, fall in, element switching, and so on.
- **The game's own officers.** They use the game's spawn code, AI and loadouts. No custom characters or assets.
- **Solo is untouched.** Station, PvP and single-player behave exactly as before.
- **Small.** One Lua script, about 100 lines.

## Squad size

| Players | AI officers | Kept |
|:-------:|:-----------:|------|
| 1 | 4 | Blue and Red elements |
| 2 | 3 | Blue element + 1 Red officer |
| 3 | 2 | Blue element |
| 4 | 1 | 1 Blue officer |
| 5 | 0 | none |

The count is set once, when the mission starts. It doesn't change if someone joins or leaves partway through.

## Requirements
| | Version tested |
|---|---|
| Ready or Not (Steam) | build 24942528, Unreal Engine 5.3.2 (September 2026) |
| [UE4SS](https://github.com/UE4SS-RE/RE-UE4SS/releases) | `experimental-latest`, v3.0.1-1152 |

Only the host needs either of them.

## Installation
1. **Install UE4SS.** Download the `UE4SS_v3.0.1-*.zip` from the [`experimental-latest`](https://github.com/UE4SS-RE/RE-UE4SS/releases/tag/experimental-latest) release. Extract it into:
   ```
   ...\steamapps\common\Ready Or Not\ReadyOrNot\Binaries\Win64\
   ```
   `dwmapi.dll` and the `ue4ss\` folder should end up next to `ReadyOrNotSteam-Win64-Shipping.exe`.
2. **Install the mod.** Download `ArmedUpNReady-vX.Y.Z.zip` from [Releases](../../releases) and extract it into the same `Win64` folder. That creates `ue4ss\Mods\ArmedUpNReady\`.
3. **Launch the game** from Steam as usual, then host a co-op lobby.

To check it's working, look in `Win64\ue4ss\UE4SS.log` after a mission starts. You should see:
```
[ArmedUpNReady] humans=2 bots=3
```

## Configuration
Edit the top of `ue4ss\Mods\ArmedUpNReady\Scripts\main.lua`:

```lua
local SQUAD_SIZE = 5 -- players + bots
```

Lower it for smaller squads. For example, `4` gives a duo two bots. Values above 5 still cap at four bots, because that is all the game spawns.

## Uninstalling
- **This mod only:** delete `ue4ss\Mods\ArmedUpNReady\`.
- **UE4SS as well:** also delete `dwmapi.dll` and the `ue4ss\` folder from `Win64`.

## How it works
Ready or Not already contains most of this; the mod just drives it.

1. **The switch.** The game has a hidden console variable, `a.RonSpawnSwatInIncompatibleMode`. Its help text reads *"always spawn the swat (even if … its a multiplayer game)"*.
   - It is registered without the cheat flag, so it can be changed in the shipping build.
2. **The spawn.** When a co-op match starts, `ACoopGM::StartMatch` calls `RespawnAllPlayers()` and then `SpawnPolice()`. `SpawnPolice()` checks that console variable before spawning the squad.
   - The mod hooks the creation of each player character. It counts the players, works out how many bots are needed, and sets the variable just in time.
   - When the lobby is full, the variable is set to 0 and no bots spawn.
3. **The trim.** `SpawnPolice()` always spawns all four officers. It then moves `SpawnedSWATAI[0]` to `[3]` into position using fixed indices, so spawning fewer would crash the game.
   - Instead, the mod waits about a second and removes the extra officers. It destroys each one's AI controller and then the character, as the game's own `DestroySwatTeam` debug command does.
   - It then shrinks `SpawnedSWATAI` and the mission's officer counters to match.
4. **The wipe check.** The game's `AreAllPlayersDead()` counts living SWAT officers as survivors. Left alone, a squad whose players have all died would never fail the mission.
   - Once a second, the mod repeats the game's check without counting the bots: is any player character's health above 0?
   - If none is, it calls the game's own `StartMissionEndTimer(false)`, which is how vanilla co-op ends a wiped mission.

Everything hangs off the game mode, which only exists on the server. A client with the mod installed does nothing extra.

## Known limitations
- **Blue stays first.** The game assigns Alpha and Beta to the Blue element, so smaller squads keep Blue before Red.
- **Brief flash of extra officers.** All four officers exist for about a second before the extras are removed, usually while the level is still loading in.
- **Only the host can command.** The game has no network call for a client to give SWAT orders.
- **Game updates can break it.** The mod depends on internal names and on the call order in `ACoopGM::StartMatch`. If a patch breaks it, update UE4SS first, then check for a new release.

## Troubleshooting
| Problem | Fix |
|---|---|
| No `[ArmedUpNReady]` lines in `UE4SS.log` | UE4SS isn't loading, or the mod folder is in the wrong place. The path must be `Win64\ue4ss\Mods\ArmedUpNReady\enabled.txt`. |
| No bots in co-op | Make sure you are the host. Clients don't run the spawn logic. |
| Game crashes | Crash reports are in `%LOCALAPPDATA%\ReadyOrNot\Saved\Crashes`. Please open an issue and attach `CrashContext.runtime-xml`. |

**Fallback without UE4SS (untested).** Add this to `%LOCALAPPDATA%\ReadyOrNot\Saved\Config\Windows\Engine.ini`:
```ini
[ConsoleVariables]
a.RonSpawnSwatInIncompatibleMode=1
```
You get the full four-officer squad in every co-op mission, but without the slot filling.

## Project layout
```
ArmedUpNReady/          the mod, as it is installed under ue4ss\Mods\
  Scripts/main.lua
  enabled.txt
docs/                   showcase web page (index.html, style.css, script.js)
LICENSE
README.md
```

## License
[MIT](LICENSE).

*Ready or Not* is a trademark of VOID Interactive. This project is a fan-made mod and is not affiliated with or endorsed by VOID Interactive.
