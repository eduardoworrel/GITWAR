namespace GitWorld.Api.Core.Systems;

/// <summary>
/// Handles health behavior for players.
/// No passive HP regen.
/// </summary>
public class HealthBehaviorSystem
{
    private readonly World _world;

    public HealthBehaviorSystem(World world)
    {
        _world = world;
    }

    /// <summary>
    /// Process health behavior for an entity.
    /// ALWAYS returns false - never skip PlayerBehaviorSystem.
    /// No passive regen.
    /// </summary>
    public bool Update(Entity entity, long currentTick)
    {
        if (entity.Type != EntityType.Player || !entity.IsAlive)
            return false;

        // No passive regen - NEVER block PlayerBehaviorSystem
        return false;
    }

    /// <summary>
    /// Clear any state when entity dies (no-op now but kept for interface).
    /// </summary>
    public void OnEntityDeath(Guid entityId)
    {
        // No state to clear anymore
    }
}
