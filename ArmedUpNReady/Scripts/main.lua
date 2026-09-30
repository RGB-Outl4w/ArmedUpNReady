-- Armed Up 'N' Ready: AI SWAT officers fill the empty co-op squad slots.
-- Host-side only: everything keys off the game mode, which exists only on the server.
local UEHelpers = require("UEHelpers")

local SQUAD_SIZE = 5 -- players + bots. Lower it to test the trimming without friends.
local MAX_BOTS = 4
local CVAR = "a.RonSpawnSwatInIncompatibleMode" -- game's own "spawn SWAT even in multiplayer" switch

local CoopGM
local keep = nil -- bots to keep this mission; nil = solo, leave the squad alone
local trimPending = false

-- Returns world, game mode if obj lives in a co-op game hosted on this machine.
local function coopHost(obj)
    local world = obj:GetWorld()
    if not world:IsValid() then return end -- class default objects
    local gm = world.AuthorityGameMode
    CoopGM = CoopGM or StaticFindObject("/Script/ReadyOrNot.CoopGM")
    if gm:IsValid() and gm:IsA(CoopGM) then return world, gm end -- not clients, station or PvP
end

local function countHumans(gm)
    local n, players = 0, gm.GameState.PlayerArray
    for i = 1, #players do
        if not players[i].bIsABot then n = n + 1 end
    end
    return n
end

-- SpawnPolice always spawns all 4 (it teleports SpawnedSWATAI[0..3] unchecked, so fewer crashes).
-- Remove the extras afterwards the way the game's DestroySwatTeam cheat does: controller, then pawn.
local function trim(gm)
    local spawned = gm.SpawnedSWATAI
    local kept = {}
    for i = 1, #spawned do
        local officer = spawned[i]
        if i <= keep then
            kept[#kept + 1] = officer
        elseif officer:IsValid() then
            if officer.Controller:IsValid() then officer.Controller:K2_DestroyActor() end
            officer:K2_DestroyActor()
        end
    end
    spawned:Empty() -- no destroyed officers left for the game to trip over
    for i, officer in ipairs(kept) do spawned[i] = officer end
    gm.GameState.TotalAIOfficers = #kept -- SpawnPolice set these from all 4
    gm.GameState.TotalOfficers = #kept + 1
    print(string.format("[ArmedUpNReady] trimmed squad to %d bots (trailer AI: %d)\n", #kept, #gm.SpawnedTrailerSWATAI))
end

-- ACoopGM::StartMatch calls RespawnAllPlayers() and then SpawnPolice(), which reads the cvar.
-- A player character being built is the last moment to set it.
NotifyOnNewObject("/Script/ReadyOrNot.PlayerCharacter", function(character)
    local world, gm = coopHost(character)
    if not world then return end

    local ksl = UEHelpers.GetKismetSystemLibrary()
    if ksl:IsStandalone(world) then -- solo: vanilla behaviour
        keep = nil
        ksl:ExecuteConsoleCommand(world, CVAR .. " 0", nil)
        return
    end

    local humans = countHumans(gm)
    keep = math.max(0, math.min(MAX_BOTS, SQUAD_SIZE - humans))
    ksl:ExecuteConsoleCommand(world, CVAR .. (keep > 0 and " 1" or " 0"), nil)
    print(string.format("[ArmedUpNReady] humans=%d bots=%d\n", humans, keep))
end)

NotifyOnNewObject("/Script/ReadyOrNot.SWATCharacter", function(officer)
    if not keep or keep >= MAX_BOTS or trimPending then return end
    local world, gm = coopHost(officer)
    if not world then return end
    trimPending = true
    -- Let SpawnPolice and StartMatch finish first.
    ExecuteWithDelay(1000, function()
        ExecuteInGameThread(function()
            trimPending = false
            if gm:IsValid() then trim(gm) end
        end)
    end)
end)
