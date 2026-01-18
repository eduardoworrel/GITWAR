using System.Collections.Concurrent;

namespace GitWorld.Api.Core;

public enum CombatEventType
{
    Damage,
    Miss,
    Critical,
    Kill,
    Death,
    Respawn
}

/// <summary>
/// Projectile info for visual rendering - purely cosmetic
/// </summary>
public record ProjectileInfo(
    float StartX, float StartY,
    float EndX, float EndY,
    string Color, float Size,
    int AttackSpeed  // Attacker's VelocidadeAtaque - determines projectile speed
);

public record CombatEvent(
    long Tick,
    CombatEventType Type,
    Guid AttackerId,
    string AttackerName,
    Guid TargetId,
    string TargetName,
    int? Damage = null,
    bool IsCritical = false,
    ProjectileInfo? Projectile = null
)
{
    public long Timestamp { get; init; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}

/// <summary>
/// Thread-safe event store that supports multiple SSE clients.
/// Uses event IDs instead of draining, so all clients receive all events.
/// </summary>
public class CombatEventQueue
{
    private readonly List<CombatEvent> _events = new();
    private readonly object _lock = new();
    private readonly int _maxEvents;
    private long _eventIdCounter = 0;

    public CombatEventQueue(int maxEvents = 200)
    {
        _maxEvents = maxEvents;
    }

    public void Add(CombatEvent evt)
    {
        lock (_lock)
        {
            _events.Add(evt);

            // Trim old events if list is too large
            if (_events.Count > _maxEvents)
            {
                _events.RemoveRange(0, _events.Count - _maxEvents);
            }

            _eventIdCounter++;
        }
    }

    /// <summary>
    /// Get events since a given tick (for SSE clients to get new events only)
    /// </summary>
    public IReadOnlyList<CombatEvent> GetEventsSince(long sinceTick)
    {
        lock (_lock)
        {
            return _events.Where(e => e.Tick > sinceTick).ToList();
        }
    }

    /// <summary>
    /// Legacy: Get all events and clear the queue (for backwards compatibility)
    /// </summary>
    public IReadOnlyList<CombatEvent> DrainEvents()
    {
        lock (_lock)
        {
            var result = _events.ToList();
            _events.Clear();
            return result;
        }
    }

    /// <summary>
    /// Get all current events without clearing
    /// </summary>
    public IReadOnlyList<CombatEvent> GetAll()
    {
        lock (_lock)
        {
            return _events.ToList();
        }
    }

    /// <summary>
    /// Clear events older than a certain tick
    /// </summary>
    public void ClearOlderThan(long tick)
    {
        lock (_lock)
        {
            _events.RemoveAll(e => e.Tick < tick);
        }
    }
}
