using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public class ProgressionSystem
{
    private readonly World _world;
    private readonly List<RewardEvent> _pendingRewards = new();
    private readonly List<LevelUpEvent> _pendingLevelUps = new();

    public ProgressionSystem(World world)
    {
        _world = world;
    }

    /// <summary>
    /// Get XP required to reach a specific level
    /// Formula: BaseExp * (ScalingFactor ^ level)
    /// </summary>
    public static int GetExpForLevel(int level)
    {
        if (level <= 1) return 0;
        return (int)(GameConstants.BaseExpToLevel * MathF.Pow(GameConstants.ExpScalingFactor, level - 1));
    }

    /// <summary>
    /// Get total XP required from level 1 to reach target level
    /// </summary>
    public static int GetTotalExpForLevel(int level)
    {
        int total = 0;
        for (int i = 2; i <= level; i++)
        {
            total += GetExpForLevel(i);
        }
        return total;
    }

    /// <summary>
    /// Get XP and Gold rewards for killing an entity type
    /// </summary>
    public static (int exp, int gold) GetRewardsForEntityType(EntityType type)
    {
        return type switch
        {
            EntityType.Bug => (GameConstants.BugExpReward, GameConstants.BugGoldReward),
            EntityType.AIHallucination => (GameConstants.AIHallucinationExpReward, GameConstants.AIHallucinationGoldReward),
            EntityType.Manager => (GameConstants.ManagerExpReward, GameConstants.ManagerGoldReward),
            EntityType.Boss => (GameConstants.BossExpReward, GameConstants.BossGoldReward),
            EntityType.UnexplainedBug => (GameConstants.UnexplainedBugExpReward, GameConstants.UnexplainedBugGoldReward),
            EntityType.Player => (GameConstants.PlayerKillExpReward, GameConstants.PlayerKillGoldReward),
            // Language-specific errors give same rewards as Bug (basic monster)
            _ when IsLanguageError(type) => (GameConstants.BugExpReward, GameConstants.BugGoldReward),
            _ => (0, 0)
        };
    }

    /// <summary>
    /// Check if entity type is a language-specific error monster
    /// </summary>
    public static bool IsLanguageError(EntityType type)
    {
        return type >= EntityType.JsUndefined && type <= EntityType.ElixirKeyError;
    }

    /// <summary>
    /// Check if entity type is a monster (gives rewards when killed)
    /// </summary>
    public static bool IsMonster(EntityType type)
    {
        return type != EntityType.Player && type != EntityType.NPC && type != EntityType.Neutral;
    }

    /// <summary>
    /// Distribute rewards when a monster dies
    /// </summary>
    public void DistributeMonsterRewards(Entity deadMonster, long currentTick)
    {
        if (!IsMonster(deadMonster.Type)) return;

        var (baseExp, baseGold) = GetRewardsForEntityType(deadMonster.Type);
        var damagePercentages = deadMonster.GetDamagePercentages();

        foreach (var (attackerId, percentage) in damagePercentages)
        {
            var attacker = _world.GetEntity(attackerId);
            if (attacker == null || attacker.Type != EntityType.Player) continue;

            var expReward = (int)(baseExp * percentage);
            var goldReward = (int)(baseGold * percentage);

            // Minimum rewards if contributed
            if (expReward == 0 && percentage > 0) expReward = 1;
            if (goldReward == 0 && percentage > 0) goldReward = 1;

            GiveRewards(attacker, expReward, goldReward, deadMonster.GithubLogin, currentTick);
        }
    }

    /// <summary>
    /// Give rewards to a player for killing another player
    /// </summary>
    public void GivePlayerKillReward(Entity killer, Entity victim, long currentTick)
    {
        if (killer.Type != EntityType.Player || victim.Type != EntityType.Player) return;

        // Scale rewards based on victim's level
        var levelMultiplier = 1f + (victim.Level - 1) * 0.1f; // +10% per level
        var expReward = (int)(GameConstants.PlayerKillExpReward * levelMultiplier);
        var goldReward = (int)(GameConstants.PlayerKillGoldReward * levelMultiplier);

        GiveRewards(killer, expReward, goldReward, $"Player:{victim.GithubLogin}", currentTick);
    }

    /// <summary>
    /// Give XP and Gold to a player, handling level ups
    /// </summary>
    public void GiveRewards(Entity player, int exp, int gold, string source, long currentTick)
    {
        if (player.Type != EntityType.Player) return;
        if (exp <= 0 && gold <= 0) return;

        var oldLevel = player.Level;
        player.Exp += exp;
        player.Gold += gold;

        // Check for level up
        var leveledUp = false;
        while (player.Level < GameConstants.MaxLevel)
        {
            var expNeeded = GetExpForLevel(player.Level + 1);
            var expForCurrentLevel = GetTotalExpForLevel(player.Level);
            var expProgress = player.Exp - expForCurrentLevel;

            if (expProgress >= expNeeded)
            {
                player.Level++;
                leveledUp = true;
                ApplyLevelBonuses(player);

                _pendingLevelUps.Add(new LevelUpEvent
                {
                    PlayerId = player.Id,
                    PlayerName = player.GithubLogin,
                    OldLevel = player.Level - 1,
                    NewLevel = player.Level,
                    X = player.X,
                    Y = player.Y,
                    Tick = currentTick
                });
            }
            else
            {
                break;
            }
        }

        // Create reward event for visual feedback
        _pendingRewards.Add(new RewardEvent
        {
            PlayerId = player.Id,
            X = player.X,
            Y = player.Y,
            ExpGained = exp,
            GoldGained = gold,
            LeveledUp = leveledUp,
            NewLevel = player.Level,
            Source = source,
            Tick = currentTick
        });
    }

    /// <summary>
    /// Apply stat bonuses when leveling up
    /// </summary>
    private void ApplyLevelBonuses(Entity player)
    {
        // Increase max HP and heal to full
        player.MaxHp += (int)GameConstants.HpPerLevel;
        player.CurrentHp = player.MaxHp;

        // Increase damage
        player.Dano += (int)GameConstants.DanoPerLevel;

        // Increase armor (every 2 levels)
        if (player.Level % 2 == 0)
        {
            player.Armadura += (int)GameConstants.ArmaduraPerLevel;
        }
    }

    /// <summary>
    /// Get and clear pending reward events
    /// </summary>
    public List<RewardEvent> GetAndClearRewardEvents()
    {
        var events = _pendingRewards.ToList();
        _pendingRewards.Clear();
        return events;
    }

    /// <summary>
    /// Get and clear pending level up events
    /// </summary>
    public List<LevelUpEvent> GetAndClearLevelUpEvents()
    {
        var events = _pendingLevelUps.ToList();
        _pendingLevelUps.Clear();
        return events;
    }

    /// <summary>
    /// Get current level progress (0.0 to 1.0)
    /// </summary>
    public static float GetLevelProgress(Entity player)
    {
        if (player.Level >= GameConstants.MaxLevel) return 1f;

        var expForCurrentLevel = GetTotalExpForLevel(player.Level);
        var expForNextLevel = GetExpForLevel(player.Level + 1);
        var expProgress = player.Exp - expForCurrentLevel;

        return (float)expProgress / expForNextLevel;
    }
}
