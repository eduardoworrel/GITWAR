using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public class MovementSystem
{
    private readonly World _world;
    private const float EntityRadius = 15f; // Collision radius of player

    public MovementSystem(World world)
    {
        _world = world;
    }

    public void Update(Entity entity)
    {
        if (entity.State == EntityState.Dead)
            return;

        if (!entity.TargetX.HasValue || !entity.TargetY.HasValue)
            return;

        MoveTowardsTarget(entity);
    }

    /// <summary>
    /// Check if a position collides with any desk object
    /// </summary>
    private bool IsInsideCollisionZone(float x, float y)
    {
        foreach (var zone in GameConstants.DeskCollisionZones)
        {
            // Expand zone by entity radius for proper collision
            if (x >= zone.X - EntityRadius &&
                x <= zone.X + zone.Width + EntityRadius &&
                y >= zone.Y - EntityRadius &&
                y <= zone.Y + zone.Height + EntityRadius)
            {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Try to slide along collision zone edges when blocked.
    /// If entity is INSIDE a collision zone, always allow movement (so they can escape).
    /// Only block movement INTO collision zones from outside.
    /// </summary>
    private (float x, float y) ResolveCollision(float fromX, float fromY, float toX, float toY)
    {
        // If starting position is inside collision zone, allow any movement (escape)
        if (IsInsideCollisionZone(fromX, fromY))
            return (toX, toY);

        // If destination is clear, go there
        if (!IsInsideCollisionZone(toX, toY))
            return (toX, toY);

        // Try moving only on X axis
        if (!IsInsideCollisionZone(toX, fromY))
            return (toX, fromY);

        // Try moving only on Y axis
        if (!IsInsideCollisionZone(fromX, toY))
            return (fromX, toY);

        // Completely blocked, stay in place
        return (fromX, fromY);
    }

    private void MoveTowardsTarget(Entity entity)
    {
        var targetX = entity.TargetX!.Value;
        var targetY = entity.TargetY!.Value;
        var distance = entity.DistanceTo(targetX, targetY);

        // Check if there's another entity at target position - stop at attack range
        var entitiesAtTarget = _world.GetEntitiesInRange(targetX, targetY, GameConstants.RangeAtaque * 2);
        var blockedByEntity = entitiesAtTarget.Any(e => e.Id != entity.Id);
        // Stop slightly inside attack range to avoid floating point edge cases
        var stopDistance = blockedByEntity ? GameConstants.RangeAtaque - 2f : 0f;

        // VelocidadeMovimento: base 50 + (stats/5), multiplied by tick rate
        // This gives ~2.5-5 units per tick (50-100 units/second)
        var speed = (GameConstants.VelocidadeBase + entity.VelocidadeMovimento / 5f) * (GameConstants.TickRateMs / 1000f);

        if (distance <= speed + stopDistance)
        {
            if (blockedByEntity && distance > stopDistance)
            {
                // Move to edge of attack range, not exactly on target
                var dx = targetX - entity.X;
                var dy = targetY - entity.Y;
                var ratio = (distance - stopDistance) / distance;
                var newX = entity.X + dx * ratio;
                var newY = entity.Y + dy * ratio;

                // Check collision
                var (resolvedX, resolvedY) = ResolveCollision(entity.X, entity.Y, newX, newY);
                entity.X = resolvedX;
                entity.Y = resolvedY;
            }
            // Stop - either arrived or at attack range of another entity
            entity.ClearTarget();
        }
        else
        {
            // Move na direção do destino
            var dx = targetX - entity.X;
            var dy = targetY - entity.Y;
            var ratio = speed / distance;

            var newX = entity.X + dx * ratio;
            var newY = entity.Y + dy * ratio;

            // Check collision and resolve
            var (resolvedX, resolvedY) = ResolveCollision(entity.X, entity.Y, newX, newY);

            // If blocked, stop movement
            if (resolvedX == entity.X && resolvedY == entity.Y)
            {
                entity.ClearTarget();
                return;
            }

            entity.X = resolvedX;
            entity.Y = resolvedY;

            // Garante limites do mapa
            var (clampedX, clampedY) = _world.ClampToWorld(entity.X, entity.Y);
            entity.X = clampedX;
            entity.Y = clampedY;
        }
    }

    public void SetDestination(Entity entity, float x, float y)
    {
        if (entity.State == EntityState.Dead)
            return;

        // Clamp destino aos limites do mundo
        var (clampedX, clampedY) = _world.ClampToWorld(x, y);
        entity.SetTarget(clampedX, clampedY);
    }

    public void Wander(Entity entity, float radius = 200f)
    {
        if (entity.State != EntityState.Idle)
            return;

        var random = Random.Shared;
        var angle = random.NextSingle() * MathF.PI * 2;
        var distance = random.NextSingle() * radius;

        var newX = entity.X + MathF.Cos(angle) * distance;
        var newY = entity.Y + MathF.Sin(angle) * distance;

        SetDestination(entity, newX, newY);
    }
}
