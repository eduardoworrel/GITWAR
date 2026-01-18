using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public class MovementSystem
{
    private readonly World _world;
    private readonly Pathfinding _pathfinding;

    private const float EntityRadius = 15f;
    private const float EntitySeparationDistance = 30f;
    private const float SeparationForce = 2.5f;
    private const float WaypointReachedDistance = 20f;
    private const float PathRecalculateDistance = 100f; // Recalculate if target moved this much

    // Store paths for entities
    private readonly Dictionary<Guid, EntityPath> _entityPaths = new();

    public MovementSystem(World world, Pathfinding pathfinding)
    {
        _world = world;
        _pathfinding = pathfinding;
    }

    public void Update(Entity entity)
    {
        if (entity.State == EntityState.Dead)
            return;

        // Apply separation force to avoid entity overlap
        ApplySeparation(entity);

        if (!entity.TargetX.HasValue || !entity.TargetY.HasValue)
            return;

        MoveAlongPath(entity);
    }

    /// <summary>
    /// Apply separation force to push entities apart when they're too close
    /// </summary>
    private void ApplySeparation(Entity entity)
    {
        var nearbyEntities = _world.GetEntitiesInRange(entity, EntitySeparationDistance);

        float separationX = 0;
        float separationY = 0;
        int count = 0;

        foreach (var other in nearbyEntities)
        {
            var dx = entity.X - other.X;
            var dy = entity.Y - other.Y;
            var distance = MathF.Sqrt(dx * dx + dy * dy);

            if (distance > 0.1f && distance < EntitySeparationDistance)
            {
                // Calculate repulsion force (stronger when closer)
                var strength = (EntitySeparationDistance - distance) / EntitySeparationDistance;
                strength = strength * strength; // Quadratic falloff for smoother movement

                var normalizedDx = dx / distance;
                var normalizedDy = dy / distance;

                separationX += normalizedDx * strength;
                separationY += normalizedDy * strength;
                count++;
            }
        }

        if (count > 0)
        {
            // Average and apply separation force
            var moveX = (separationX / count) * SeparationForce;
            var moveY = (separationY / count) * SeparationForce;

            var newX = entity.X + moveX;
            var newY = entity.Y + moveY;

            // Only apply if the new position is walkable
            if (_pathfinding.IsWalkable(newX, newY))
            {
                var (clampedX, clampedY) = _world.ClampToWorld(newX, newY);
                entity.X = clampedX;
                entity.Y = clampedY;
            }
        }
    }

    /// <summary>
    /// Move entity along its computed A* path
    /// </summary>
    private void MoveAlongPath(Entity entity)
    {
        var targetX = entity.TargetX!.Value;
        var targetY = entity.TargetY!.Value;

        // Get or create path
        if (!_entityPaths.TryGetValue(entity.Id, out var entityPath) ||
            entityPath.NeedsRecalculation(targetX, targetY))
        {
            // Calculate new path
            var waypoints = _pathfinding.FindPath(entity.X, entity.Y, targetX, targetY);

            if (waypoints.Count == 0)
            {
                // No path found - try to move directly (might be very close)
                var directDist = entity.DistanceTo(targetX, targetY);
                if (directDist < WaypointReachedDistance * 2)
                {
                    // Close enough, just go directly
                    waypoints = new List<(float X, float Y)> { (targetX, targetY) };
                }
                else
                {
                    // Can't find path, give up
                    ClearPath(entity);
                    entity.ClearTarget();
                    return;
                }
            }

            entityPath = new EntityPath(waypoints, targetX, targetY);
            _entityPaths[entity.Id] = entityPath;
        }

        // Get current waypoint
        var currentWaypoint = entityPath.CurrentWaypoint;
        if (currentWaypoint == null)
        {
            // Path completed
            ClearPath(entity);
            entity.ClearTarget();
            return;
        }

        var waypointX = currentWaypoint.Value.X;
        var waypointY = currentWaypoint.Value.Y;
        var distanceToWaypoint = entity.DistanceTo(waypointX, waypointY);

        // Check if there's an entity at the final target - stop at attack range
        var distanceToFinal = entity.DistanceTo(targetX, targetY);
        var entitiesAtTarget = _world.GetEntitiesInRange(targetX, targetY, GameConstants.RangeAtaque * 1.5f);
        var targetingEntity = entitiesAtTarget.Any(e => e.Id != entity.Id);
        var stopDistance = targetingEntity ? GameConstants.RangeAtaque - 5f : WaypointReachedDistance;

        // Check if we've reached the final destination
        if (distanceToFinal <= stopDistance)
        {
            ClearPath(entity);
            entity.ClearTarget();
            return;
        }

        // Check if we've reached current waypoint
        if (distanceToWaypoint <= WaypointReachedDistance)
        {
            entityPath.AdvanceWaypoint();
            return; // Will move towards next waypoint on next tick
        }

        // Calculate movement speed
        var speed = (GameConstants.VelocidadeBase + entity.VelocidadeMovimento / 5f) * (GameConstants.TickRateMs / 1000f);

        // Move towards current waypoint
        var dx = waypointX - entity.X;
        var dy = waypointY - entity.Y;
        var moveRatio = Math.Min(1f, speed / distanceToWaypoint);

        var newX = entity.X + dx * moveRatio;
        var newY = entity.Y + dy * moveRatio;

        // Verify new position is walkable (should be, but double-check)
        if (_pathfinding.IsWalkable(newX, newY))
        {
            entity.X = newX;
            entity.Y = newY;
        }
        else
        {
            // Path became blocked (rare) - recalculate next tick
            ClearPath(entity);
        }

        // Clamp to world bounds
        var (clampedX, clampedY) = _world.ClampToWorld(entity.X, entity.Y);
        entity.X = clampedX;
        entity.Y = clampedY;
    }

    public void SetDestination(Entity entity, float x, float y)
    {
        if (entity.State == EntityState.Dead)
            return;

        // Clear existing path
        ClearPath(entity);

        // Clamp to world bounds
        var (clampedX, clampedY) = _world.ClampToWorld(x, y);
        entity.SetTarget(clampedX, clampedY);
    }

    public void Wander(Entity entity, float radius = 200f)
    {
        if (entity.State != EntityState.Idle)
            return;

        var random = Random.Shared;

        // Try up to 5 times to find a walkable destination
        for (int attempt = 0; attempt < 5; attempt++)
        {
            var angle = random.NextSingle() * MathF.PI * 2;
            var distance = random.NextSingle() * radius;

            var newX = entity.X + MathF.Cos(angle) * distance;
            var newY = entity.Y + MathF.Sin(angle) * distance;

            if (_pathfinding.IsWalkable(newX, newY))
            {
                SetDestination(entity, newX, newY);
                return;
            }
        }
    }

    /// <summary>
    /// Clear cached path for an entity
    /// </summary>
    public void ClearPath(Entity entity)
    {
        _entityPaths.Remove(entity.Id);
    }

    /// <summary>
    /// Clean up paths for entities that no longer exist
    /// </summary>
    public void CleanupOrphanedPaths(HashSet<Guid> activeEntityIds)
    {
        var toRemove = _entityPaths.Keys.Where(id => !activeEntityIds.Contains(id)).ToList();
        foreach (var id in toRemove)
        {
            _entityPaths.Remove(id);
        }
    }
}

/// <summary>
/// Represents a path for an entity with multiple waypoints
/// </summary>
internal class EntityPath
{
    private readonly List<(float X, float Y)> _waypoints;
    private readonly float _originalTargetX;
    private readonly float _originalTargetY;
    private int _currentIndex;

    private const float RecalculateThreshold = 100f;

    public EntityPath(List<(float X, float Y)> waypoints, float targetX, float targetY)
    {
        _waypoints = waypoints;
        _originalTargetX = targetX;
        _originalTargetY = targetY;
        _currentIndex = 0;
    }

    public (float X, float Y)? CurrentWaypoint =>
        _currentIndex < _waypoints.Count ? _waypoints[_currentIndex] : null;

    public void AdvanceWaypoint()
    {
        _currentIndex++;
    }

    public bool NeedsRecalculation(float newTargetX, float newTargetY)
    {
        var dx = newTargetX - _originalTargetX;
        var dy = newTargetY - _originalTargetY;
        var distance = MathF.Sqrt(dx * dx + dy * dy);
        return distance > RecalculateThreshold;
    }
}
