using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

/// <summary>
/// Handles HP regeneration for players in home territory.
/// SIMPLE: Only regens HP, never blocks fighting behavior.
/// </summary>
public class HealthBehaviorSystem
{
    private readonly World _world;

    // Regen rate: 2% of max HP per second (0.1% per tick at 50ms)
    private const float RegenRatePerTick = 0.001f;

    public HealthBehaviorSystem(World world)
    {
        _world = world;
    }

    /// <summary>
    /// Process health behavior for an entity.
    /// ALWAYS returns false - never skip PlayerBehaviorSystem.
    /// Players should always fight, even while regenerating.
    /// </summary>
    public bool Update(Entity entity, long currentTick)
    {
        if (entity.Type != EntityType.Player || !entity.IsAlive)
            return false;

        var isInHomeTerritory = Territories.IsInTerritory(entity.X, entity.Y, entity.Reino);

        // Regen HP in home territory
        if (isInHomeTerritory && entity.CurrentHp < entity.MaxHp)
        {
            RegenHp(entity);
        }

        // NEVER block PlayerBehaviorSystem - players should always fight
        return false;
    }

    private void RegenHp(Entity entity)
    {
        var regenAmount = (int)Math.Ceiling(entity.MaxHp * RegenRatePerTick);
        entity.CurrentHp = Math.Min(entity.MaxHp, entity.CurrentHp + regenAmount);
    }

    /// <summary>
    /// Clear any state when entity dies (no-op now but kept for interface).
    /// </summary>
    public void OnEntityDeath(Guid entityId)
    {
        // No state to clear anymore
    }
}
