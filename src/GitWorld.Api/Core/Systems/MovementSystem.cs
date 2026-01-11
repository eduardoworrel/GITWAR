using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public class MovementSystem
{
    private readonly World _world;
    private const float EntityRadius = 15f; // Collision radius of player
    private const float WaypointMargin = 30f; // Distance to keep from obstacle corners
    private const float EntitySeparationDistance = 25f; // Min distance between entities
    private const float SeparationForce = 3f; // How strongly entities push each other apart

    // Store intermediate waypoints for entities navigating around obstacles
    private readonly Dictionary<Guid, (float X, float Y)> _waypoints = new();

    public MovementSystem(World world)
    {
        _world = world;
    }

    public void Update(Entity entity)
    {
        if (entity.State == EntityState.Dead)
            return;

        // Apply separation force to avoid entity overlap
        ApplySeparation(entity);

        if (!entity.TargetX.HasValue || !entity.TargetY.HasValue)
            return;

        MoveTowardsTarget(entity);
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

            if (distance > 0 && distance < EntitySeparationDistance)
            {
                // Calculate repulsion force (stronger when closer)
                var strength = (EntitySeparationDistance - distance) / EntitySeparationDistance;
                var normalizedDx = dx / distance;
                var normalizedDy = dy / distance;

                separationX += normalizedDx * strength;
                separationY += normalizedDy * strength;
                count++;
            }
        }

        if (count > 0)
        {
            // Apply separation with force multiplier
            var moveX = (separationX / count) * SeparationForce;
            var moveY = (separationY / count) * SeparationForce;

            var newX = entity.X + moveX;
            var newY = entity.Y + moveY;

            // Only apply if the new position is valid (not in collision zone)
            if (!IsInsideCollisionZone(newX, newY))
            {
                var (clampedX, clampedY) = _world.ClampToWorld(newX, newY);
                entity.X = clampedX;
                entity.Y = clampedY;
            }
        }
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
    /// Get the collision zone that would block movement to a position
    /// </summary>
    private (float X, float Y, float Width, float Height)? GetBlockingZone(float x, float y)
    {
        foreach (var zone in GameConstants.DeskCollisionZones)
        {
            if (x >= zone.X - EntityRadius &&
                x <= zone.X + zone.Width + EntityRadius &&
                y >= zone.Y - EntityRadius &&
                y <= zone.Y + zone.Height + EntityRadius)
            {
                return zone;
            }
        }
        return null;
    }

    /// <summary>
    /// Check if path between two points intersects any collision zone
    /// </summary>
    private bool IsPathBlocked(float fromX, float fromY, float toX, float toY)
    {
        // Sample points along the path
        var distance = MathF.Sqrt((toX - fromX) * (toX - fromX) + (toY - fromY) * (toY - fromY));
        var steps = Math.Max(1, (int)(distance / 20f)); // Check every 20 units

        for (int i = 1; i <= steps; i++)
        {
            var t = (float)i / steps;
            var checkX = fromX + (toX - fromX) * t;
            var checkY = fromY + (toY - fromY) * t;
            if (IsInsideCollisionZone(checkX, checkY))
                return true;
        }
        return false;
    }

    /// <summary>
    /// Find waypoint to navigate around a blocking obstacle
    /// </summary>
    private (float X, float Y)? FindWaypointAroundObstacle(float fromX, float fromY, float toX, float toY)
    {
        // Find which zone is blocking us
        var blockingZone = GetBlockingZone(toX, toY);
        if (!blockingZone.HasValue)
        {
            // Check if path is blocked
            var distance = MathF.Sqrt((toX - fromX) * (toX - fromX) + (toY - fromY) * (toY - fromY));
            var steps = Math.Max(1, (int)(distance / 20f));
            for (int i = 1; i <= steps; i++)
            {
                var t = (float)i / steps;
                var checkX = fromX + (toX - fromX) * t;
                var checkY = fromY + (toY - fromY) * t;
                var zone = GetBlockingZone(checkX, checkY);
                if (zone.HasValue)
                {
                    blockingZone = zone;
                    break;
                }
            }
        }

        if (!blockingZone.HasValue)
            return null;

        var blockedZone = blockingZone.Value;
        var zoneLeft = blockedZone.X - EntityRadius - WaypointMargin;
        var zoneRight = blockedZone.X + blockedZone.Width + EntityRadius + WaypointMargin;
        var zoneTop = blockedZone.Y - EntityRadius - WaypointMargin;
        var zoneBottom = blockedZone.Y + blockedZone.Height + EntityRadius + WaypointMargin;

        // Calculate zone center
        var zoneCenterX = blockedZone.X + blockedZone.Width / 2;
        var zoneCenterY = blockedZone.Y + blockedZone.Height / 2;

        // Generate corner waypoints
        var corners = new (float X, float Y)[]
        {
            (zoneLeft, zoneTop),      // Top-left
            (zoneRight, zoneTop),     // Top-right
            (zoneLeft, zoneBottom),   // Bottom-left
            (zoneRight, zoneBottom),  // Bottom-right
        };

        // Find the best corner: one that is reachable from current position and reduces distance to target
        (float X, float Y)? bestWaypoint = null;
        float bestScore = float.MaxValue;

        foreach (var corner in corners)
        {
            // Skip if corner is inside another collision zone
            if (IsInsideCollisionZone(corner.X, corner.Y))
                continue;

            // Skip if we can't reach this corner directly
            if (IsPathBlocked(fromX, fromY, corner.X, corner.Y))
                continue;

            // Calculate score: distance to corner + distance from corner to target
            var distToCorner = MathF.Sqrt((corner.X - fromX) * (corner.X - fromX) + (corner.Y - fromY) * (corner.Y - fromY));
            var distCornerToTarget = MathF.Sqrt((toX - corner.X) * (toX - corner.X) + (toY - corner.Y) * (toY - corner.Y));
            var score = distToCorner + distCornerToTarget;

            // Prefer corners that are roughly in the direction of the target
            var dirToTarget = MathF.Atan2(toY - fromY, toX - fromX);
            var dirToCorner = MathF.Atan2(corner.Y - fromY, corner.X - fromX);
            var angleDiff = MathF.Abs(dirToTarget - dirToCorner);
            if (angleDiff > MathF.PI) angleDiff = 2 * MathF.PI - angleDiff;

            // Add penalty for going backwards
            score += angleDiff * 100f;

            if (score < bestScore)
            {
                bestScore = score;
                bestWaypoint = corner;
            }
        }

        return bestWaypoint;
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
        var finalTargetX = entity.TargetX!.Value;
        var finalTargetY = entity.TargetY!.Value;

        // Check if we have a waypoint to navigate around an obstacle
        float targetX, targetY;
        bool movingToWaypoint = false;

        if (_waypoints.TryGetValue(entity.Id, out var waypoint))
        {
            // Check if we've reached the waypoint
            var waypointDist = entity.DistanceTo(waypoint.X, waypoint.Y);
            if (waypointDist < 20f)
            {
                // Reached waypoint, clear it and move to final target
                _waypoints.Remove(entity.Id);
                targetX = finalTargetX;
                targetY = finalTargetY;
            }
            else
            {
                // Still moving to waypoint
                targetX = waypoint.X;
                targetY = waypoint.Y;
                movingToWaypoint = true;
            }
        }
        else
        {
            targetX = finalTargetX;
            targetY = finalTargetY;
        }

        var distance = entity.DistanceTo(targetX, targetY);

        // Check if there's another entity at target position - stop at attack range
        var entitiesAtTarget = _world.GetEntitiesInRange(finalTargetX, finalTargetY, GameConstants.RangeAtaque * 2);
        var blockedByEntity = entitiesAtTarget.Any(e => e.Id != entity.Id);
        // Stop slightly inside attack range to avoid floating point edge cases
        var stopDistance = (blockedByEntity && !movingToWaypoint) ? GameConstants.RangeAtaque - 2f : 0f;

        // VelocidadeMovimento: base 50 + (stats/5), multiplied by tick rate
        // This gives ~2.5-5 units per tick (50-100 units/second)
        var speed = (GameConstants.VelocidadeBase + entity.VelocidadeMovimento / 5f) * (GameConstants.TickRateMs / 1000f);

        // Check final target distance for arrival
        var distanceToFinal = entity.DistanceTo(finalTargetX, finalTargetY);

        if (!movingToWaypoint && distanceToFinal <= speed + stopDistance)
        {
            if (blockedByEntity && distanceToFinal > stopDistance)
            {
                // Move to edge of attack range, not exactly on target
                var dx = finalTargetX - entity.X;
                var dy = finalTargetY - entity.Y;
                var ratio = (distanceToFinal - stopDistance) / distanceToFinal;
                var newX = entity.X + dx * ratio;
                var newY = entity.Y + dy * ratio;

                // Check collision
                var (resolvedX, resolvedY) = ResolveCollision(entity.X, entity.Y, newX, newY);
                entity.X = resolvedX;
                entity.Y = resolvedY;
            }
            // Stop - either arrived or at attack range of another entity
            _waypoints.Remove(entity.Id);
            entity.ClearTarget();
        }
        else
        {
            // Move na direção do destino (waypoint ou final)
            var dx = targetX - entity.X;
            var dy = targetY - entity.Y;
            var ratio = speed / distance;

            var newX = entity.X + dx * ratio;
            var newY = entity.Y + dy * ratio;

            // Check collision and resolve
            var (resolvedX, resolvedY) = ResolveCollision(entity.X, entity.Y, newX, newY);

            // If blocked, try to find a waypoint around the obstacle
            if (resolvedX == entity.X && resolvedY == entity.Y)
            {
                // Only try to find waypoint if we don't already have one
                if (!movingToWaypoint)
                {
                    var newWaypoint = FindWaypointAroundObstacle(entity.X, entity.Y, finalTargetX, finalTargetY);
                    if (newWaypoint.HasValue)
                    {
                        _waypoints[entity.Id] = newWaypoint.Value;
                        // Try to move towards the waypoint immediately
                        var wpDist = entity.DistanceTo(newWaypoint.Value.X, newWaypoint.Value.Y);
                        if (wpDist > 0)
                        {
                            var wpRatio = speed / wpDist;
                            var wpNewX = entity.X + (newWaypoint.Value.X - entity.X) * wpRatio;
                            var wpNewY = entity.Y + (newWaypoint.Value.Y - entity.Y) * wpRatio;
                            var (wpResolvedX, wpResolvedY) = ResolveCollision(entity.X, entity.Y, wpNewX, wpNewY);
                            entity.X = wpResolvedX;
                            entity.Y = wpResolvedY;
                        }
                        return;
                    }
                }
                // No waypoint found or waypoint path also blocked - give up
                _waypoints.Remove(entity.Id);
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

        // Clear any existing waypoint when setting a new destination
        _waypoints.Remove(entity.Id);

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
