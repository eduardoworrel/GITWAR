using GitWorld.Api.Core.Scripting;
using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

/// <summary>
/// Executes player scripts and converts results to entity actions.
/// Replaces PlayerBehaviorSystem when a player has scripting enabled.
/// </summary>
public class PlayerScriptSystem
{
    private readonly World _world;
    private readonly ScriptExecutor _scriptExecutor;
    private EventSystem? _eventSystem;

    public PlayerScriptSystem(World world, ScriptExecutor scriptExecutor)
    {
        _world = world;
        _scriptExecutor = scriptExecutor;
    }

    /// <summary>
    /// Set reference to EventSystem after GameLoop is fully constructed
    /// </summary>
    public void SetEventSystem(EventSystem eventSystem)
    {
        _eventSystem = eventSystem;
    }

    /// <summary>
    /// Execute player's custom script and apply resulting action.
    /// Returns true if script was executed successfully.
    /// </summary>
    public bool Update(Entity player, long currentTick)
    {
        if (player.Type != EntityType.Player || !player.IsAlive)
            return false;

        if (!player.ScriptEnabled || string.IsNullOrEmpty(player.CustomScript))
            return false;

        // Build script context
        var isEventActive = _eventSystem?.IsEventActive == true;
        var eventType = _eventSystem?.CurrentEvent?.Type.ToString() ?? "";
        var monstersRemaining = _eventSystem?.CurrentEvent?.MonstersRemaining ?? 0;

        var context = new ScriptContext(
            player,
            _world,
            isEventActive,
            eventType,
            monstersRemaining,
            currentTick
        );

        // Execute script
        var action = _scriptExecutor.Execute(player.Id, player.CustomScript, context);

        if (action == null)
        {
            // Script failed or is disabled - fall back to default behavior
            return false;
        }

        // Apply action to entity
        ApplyAction(player, action, currentTick);
        return true;
    }

    /// <summary>
    /// Apply script action to the player entity
    /// </summary>
    private void ApplyAction(Entity player, ScriptAction action, long currentTick)
    {
        switch (action.Type)
        {
            case ScriptActionType.MoveTo:
                if (action.TargetX.HasValue && action.TargetY.HasValue)
                {
                    player.TargetEntityId = null;
                    player.State = EntityState.Moving;
                    player.TargetX = action.TargetX.Value;
                    player.TargetY = action.TargetY.Value;
                }
                break;

            case ScriptActionType.MoveToEntity:
                if (!string.IsNullOrEmpty(action.TargetEntityId) && Guid.TryParse(action.TargetEntityId, out var moveTargetId))
                {
                    var target = _world.GetEntity(moveTargetId);
                    if (target != null && target.IsAlive)
                    {
                        player.TargetEntityId = null;
                        player.State = EntityState.Moving;
                        player.TargetX = target.X;
                        player.TargetY = target.Y;
                    }
                }
                break;

            case ScriptActionType.Attack:
                if (!string.IsNullOrEmpty(action.TargetEntityId) && Guid.TryParse(action.TargetEntityId, out var attackTargetId))
                {
                    var target = _world.GetEntity(attackTargetId);
                    if (target != null && target.IsAlive)
                    {
                        var distance = player.DistanceTo(target);
                        if (distance <= GameConstants.RangeAtaque)
                        {
                            // In range - attack
                            player.TargetEntityId = attackTargetId;
                            player.State = EntityState.Attacking;
                            player.TargetX = null;
                            player.TargetY = null;
                        }
                        else
                        {
                            // Out of range - move towards target
                            player.TargetEntityId = null;
                            player.State = EntityState.Moving;
                            player.TargetX = target.X;
                            player.TargetY = target.Y;
                        }
                    }
                }
                break;

            case ScriptActionType.AttackNearest:
                var nearestEnemy = FindNearestEnemy(player);
                if (nearestEnemy != null)
                {
                    var distance = player.DistanceTo(nearestEnemy);
                    if (distance <= GameConstants.RangeAtaque)
                    {
                        player.TargetEntityId = nearestEnemy.Id;
                        player.State = EntityState.Attacking;
                        player.TargetX = null;
                        player.TargetY = null;
                    }
                    else
                    {
                        player.TargetEntityId = null;
                        player.State = EntityState.Moving;
                        player.TargetX = nearestEnemy.X;
                        player.TargetY = nearestEnemy.Y;
                    }
                }
                break;

            case ScriptActionType.Flee:
                // Calculate flee direction (away from enemies)
                var (fleeX, fleeY) = CalculateFleePosition(player);
                player.TargetEntityId = null;
                player.State = EntityState.Moving;
                player.TargetX = fleeX;
                player.TargetY = fleeY;
                break;

            case ScriptActionType.Stop:
            case ScriptActionType.None:
                player.TargetEntityId = null;
                player.State = EntityState.Idle;
                player.ClearTarget();
                break;
        }
    }

    /// <summary>
    /// Find nearest enemy for AttackNearest action
    /// </summary>
    private Entity? FindNearestEnemy(Entity player)
    {
        Entity? nearest = null;
        float nearestDistance = float.MaxValue;

        foreach (var entity in _world.Entities)
        {
            if (entity.Id == player.Id) continue;
            if (!entity.IsAlive) continue;
            if (entity.Reino == player.Reino) continue;

            var distance = player.DistanceTo(entity);
            if (distance < nearestDistance)
            {
                nearestDistance = distance;
                nearest = entity;
            }
        }

        return nearest;
    }

    /// <summary>
    /// Calculate a position to flee to (away from enemies)
    /// </summary>
    private (float x, float y) CalculateFleePosition(Entity player)
    {
        // Calculate average position of nearby enemies
        float avgEnemyX = 0, avgEnemyY = 0;
        int enemyCount = 0;

        foreach (var entity in _world.Entities)
        {
            if (entity.Id == player.Id) continue;
            if (!entity.IsAlive) continue;
            if (entity.Reino == player.Reino) continue;

            var distance = player.DistanceTo(entity);
            if (distance < GameConstants.RaioBroadcast)
            {
                avgEnemyX += entity.X;
                avgEnemyY += entity.Y;
                enemyCount++;
            }
        }

        if (enemyCount == 0)
        {
            // No enemies - stay in place
            return (player.X, player.Y);
        }

        avgEnemyX /= enemyCount;
        avgEnemyY /= enemyCount;

        // Flee in opposite direction
        var dx = player.X - avgEnemyX;
        var dy = player.Y - avgEnemyY;
        var length = MathF.Sqrt(dx * dx + dy * dy);

        if (length < 0.1f)
        {
            // Too close - pick random direction
            var angle = Random.Shared.NextSingle() * MathF.PI * 2;
            dx = MathF.Cos(angle);
            dy = MathF.Sin(angle);
        }
        else
        {
            dx /= length;
            dy /= length;
        }

        // Flee distance
        var fleeDistance = 300f;
        var fleeX = Math.Clamp(player.X + dx * fleeDistance, 0, GameConstants.MapaWidth);
        var fleeY = Math.Clamp(player.Y + dy * fleeDistance, 0, GameConstants.MapaHeight);

        return (fleeX, fleeY);
    }
}
