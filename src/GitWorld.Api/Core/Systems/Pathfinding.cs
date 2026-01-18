using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

/// <summary>
/// A* Pathfinding system for navigating around obstacles.
/// Uses a grid-based approach with configurable cell size.
/// </summary>
public class Pathfinding
{
    private const int CellSize = 25; // Each grid cell is 25x25 units
    private const float EntityRadius = 15f; // Collision radius for entities

    private readonly int _gridWidth;
    private readonly int _gridHeight;
    private readonly bool[,] _walkableGrid; // true = walkable, false = blocked

    // Object pool for A* nodes to reduce GC pressure
    private readonly Stack<PathNode> _nodePool = new();

    // Reusable collections for A* to avoid allocations
    private readonly Dictionary<int, PathNode> _allNodes = new();
    private readonly PriorityQueue<PathNode, float> _openSet = new();
    private readonly HashSet<int> _closedSet = new();

    public Pathfinding()
    {
        _gridWidth = GameConstants.MapaWidth / CellSize;
        _gridHeight = GameConstants.MapaHeight / CellSize;
        _walkableGrid = new bool[_gridWidth, _gridHeight];

        InitializeGrid();
    }

    /// <summary>
    /// Initialize the walkability grid based on collision zones
    /// </summary>
    private void InitializeGrid()
    {
        // Start with all cells walkable
        for (int x = 0; x < _gridWidth; x++)
        {
            for (int y = 0; y < _gridHeight; y++)
            {
                _walkableGrid[x, y] = true;
            }
        }

        // Mark collision zones as unwalkable (with entity radius buffer)
        foreach (var zone in GameConstants.DeskCollisionZones)
        {
            // Expand zone by entity radius
            var minX = (int)((zone.X - EntityRadius) / CellSize);
            var maxX = (int)((zone.X + zone.Width + EntityRadius) / CellSize);
            var minY = (int)((zone.Y - EntityRadius) / CellSize);
            var maxY = (int)((zone.Y + zone.Height + EntityRadius) / CellSize);

            // Clamp to grid bounds
            minX = Math.Max(0, minX);
            maxX = Math.Min(_gridWidth - 1, maxX);
            minY = Math.Max(0, minY);
            maxY = Math.Min(_gridHeight - 1, maxY);

            for (int x = minX; x <= maxX; x++)
            {
                for (int y = minY; y <= maxY; y++)
                {
                    _walkableGrid[x, y] = false;
                }
            }
        }

        Console.WriteLine($"[Pathfinding] Grid initialized: {_gridWidth}x{_gridHeight} cells ({CellSize} units each)");
    }

    /// <summary>
    /// Find a path from start to end position using A*.
    /// Returns list of waypoints or empty list if no path found.
    /// </summary>
    public List<(float X, float Y)> FindPath(float startX, float startY, float endX, float endY)
    {
        var result = new List<(float X, float Y)>();

        // Convert world coords to grid coords
        int startGridX = (int)(startX / CellSize);
        int startGridY = (int)(startY / CellSize);
        int endGridX = (int)(endX / CellSize);
        int endGridY = (int)(endY / CellSize);

        // Clamp to grid bounds
        startGridX = Math.Clamp(startGridX, 0, _gridWidth - 1);
        startGridY = Math.Clamp(startGridY, 0, _gridHeight - 1);
        endGridX = Math.Clamp(endGridX, 0, _gridWidth - 1);
        endGridY = Math.Clamp(endGridY, 0, _gridHeight - 1);

        // If start or end is unwalkable, find nearest walkable cell
        if (!_walkableGrid[startGridX, startGridY])
        {
            var nearest = FindNearestWalkable(startGridX, startGridY);
            if (nearest == null) return result;
            (startGridX, startGridY) = nearest.Value;
        }

        if (!_walkableGrid[endGridX, endGridY])
        {
            var nearest = FindNearestWalkable(endGridX, endGridY);
            if (nearest == null) return result;
            (endGridX, endGridY) = nearest.Value;
        }

        // Same cell? Just return the end position
        if (startGridX == endGridX && startGridY == endGridY)
        {
            result.Add((endX, endY));
            return result;
        }

        // Run A*
        var path = AStar(startGridX, startGridY, endGridX, endGridY);

        if (path.Count == 0)
            return result;

        // Convert grid path to world coordinates
        foreach (var node in path)
        {
            float worldX = (node.X + 0.5f) * CellSize;
            float worldY = (node.Y + 0.5f) * CellSize;
            result.Add((worldX, worldY));
        }

        // Replace last waypoint with exact destination
        if (result.Count > 0)
        {
            result[^1] = (endX, endY);
        }

        // Smooth the path by removing unnecessary waypoints
        result = SmoothPath(result, startX, startY);

        return result;
    }

    /// <summary>
    /// A* pathfinding algorithm
    /// </summary>
    private List<PathNode> AStar(int startX, int startY, int endX, int endY)
    {
        // Clear reusable collections
        _allNodes.Clear();
        _openSet.Clear();
        _closedSet.Clear();

        var startNode = GetNode(startX, startY);
        startNode.G = 0;
        startNode.H = Heuristic(startX, startY, endX, endY);

        _openSet.Enqueue(startNode, startNode.F);

        // Direction vectors for 8-directional movement
        int[] dx = { 0, 1, 1, 1, 0, -1, -1, -1 };
        int[] dy = { -1, -1, 0, 1, 1, 1, 0, -1 };
        float[] costs = { 1f, 1.414f, 1f, 1.414f, 1f, 1.414f, 1f, 1.414f }; // Diagonal costs sqrt(2)

        int iterations = 0;
        const int maxIterations = 10000; // Prevent infinite loops

        while (_openSet.Count > 0 && iterations < maxIterations)
        {
            iterations++;

            var current = _openSet.Dequeue();

            // Skip if already processed
            int currentKey = current.X * _gridHeight + current.Y;
            if (_closedSet.Contains(currentKey))
                continue;

            _closedSet.Add(currentKey);

            // Found the goal
            if (current.X == endX && current.Y == endY)
            {
                return ReconstructPath(current);
            }

            // Check all 8 neighbors
            for (int i = 0; i < 8; i++)
            {
                int nx = current.X + dx[i];
                int ny = current.Y + dy[i];

                // Skip out of bounds
                if (nx < 0 || nx >= _gridWidth || ny < 0 || ny >= _gridHeight)
                    continue;

                // Skip unwalkable
                if (!_walkableGrid[nx, ny])
                    continue;

                // Skip already processed
                int neighborKey = nx * _gridHeight + ny;
                if (_closedSet.Contains(neighborKey))
                    continue;

                // For diagonal movement, check if we can actually move diagonally
                // (both adjacent cells must be walkable to prevent corner cutting)
                if (i % 2 == 1) // Diagonal
                {
                    int adjX1 = current.X + dx[i];
                    int adjY1 = current.Y;
                    int adjX2 = current.X;
                    int adjY2 = current.Y + dy[i];

                    if (adjX1 >= 0 && adjX1 < _gridWidth && !_walkableGrid[adjX1, adjY1])
                        continue;
                    if (adjY2 >= 0 && adjY2 < _gridHeight && !_walkableGrid[adjX2, adjY2])
                        continue;
                }

                float tentativeG = current.G + costs[i];

                var neighbor = GetNode(nx, ny);

                if (tentativeG < neighbor.G)
                {
                    neighbor.Parent = current;
                    neighbor.G = tentativeG;
                    neighbor.H = Heuristic(nx, ny, endX, endY);

                    _openSet.Enqueue(neighbor, neighbor.F);
                }
            }
        }

        // No path found
        return new List<PathNode>();
    }

    /// <summary>
    /// Octile distance heuristic (good for 8-directional movement)
    /// </summary>
    private float Heuristic(int x1, int y1, int x2, int y2)
    {
        int dx = Math.Abs(x1 - x2);
        int dy = Math.Abs(y1 - y2);
        return Math.Max(dx, dy) + 0.414f * Math.Min(dx, dy);
    }

    /// <summary>
    /// Get or create a node for the given grid position
    /// </summary>
    private PathNode GetNode(int x, int y)
    {
        int key = x * _gridHeight + y;

        if (_allNodes.TryGetValue(key, out var existing))
            return existing;

        PathNode node;
        if (_nodePool.Count > 0)
        {
            node = _nodePool.Pop();
            node.Reset(x, y);
        }
        else
        {
            node = new PathNode(x, y);
        }

        _allNodes[key] = node;
        return node;
    }

    /// <summary>
    /// Reconstruct path from end node to start
    /// </summary>
    private List<PathNode> ReconstructPath(PathNode endNode)
    {
        var path = new List<PathNode>();
        var current = endNode;

        while (current != null)
        {
            path.Add(current);
            current = current.Parent;
        }

        path.Reverse();

        // Return nodes to pool for reuse (except the ones in path)
        foreach (var node in _allNodes.Values)
        {
            if (!path.Contains(node))
            {
                _nodePool.Push(node);
            }
        }

        return path;
    }

    /// <summary>
    /// Find nearest walkable cell to given position
    /// </summary>
    private (int X, int Y)? FindNearestWalkable(int gridX, int gridY)
    {
        // Spiral search outward
        for (int radius = 1; radius < 20; radius++)
        {
            for (int dx = -radius; dx <= radius; dx++)
            {
                for (int dy = -radius; dy <= radius; dy++)
                {
                    if (Math.Abs(dx) != radius && Math.Abs(dy) != radius)
                        continue; // Only check perimeter

                    int nx = gridX + dx;
                    int ny = gridY + dy;

                    if (nx >= 0 && nx < _gridWidth && ny >= 0 && ny < _gridHeight)
                    {
                        if (_walkableGrid[nx, ny])
                            return (nx, ny);
                    }
                }
            }
        }

        return null;
    }

    /// <summary>
    /// Smooth path by removing unnecessary waypoints using line-of-sight checks
    /// </summary>
    private List<(float X, float Y)> SmoothPath(List<(float X, float Y)> path, float startX, float startY)
    {
        if (path.Count <= 2)
            return path;

        var smoothed = new List<(float X, float Y)>();

        // Start from actual position
        float currentX = startX;
        float currentY = startY;
        int currentIndex = 0;

        while (currentIndex < path.Count - 1)
        {
            // Try to skip waypoints by checking line of sight
            int furthestVisible = currentIndex + 1;

            for (int i = path.Count - 1; i > currentIndex + 1; i--)
            {
                if (HasLineOfSight(currentX, currentY, path[i].X, path[i].Y))
                {
                    furthestVisible = i;
                    break;
                }
            }

            smoothed.Add(path[furthestVisible]);
            currentX = path[furthestVisible].X;
            currentY = path[furthestVisible].Y;
            currentIndex = furthestVisible;
        }

        return smoothed;
    }

    /// <summary>
    /// Check if there's a clear line of sight between two points
    /// </summary>
    private bool HasLineOfSight(float x1, float y1, float x2, float y2)
    {
        float dx = x2 - x1;
        float dy = y2 - y1;
        float distance = MathF.Sqrt(dx * dx + dy * dy);

        if (distance < CellSize)
            return true;

        int steps = (int)(distance / (CellSize * 0.5f)); // Check every half cell
        steps = Math.Max(steps, 2);

        for (int i = 1; i < steps; i++)
        {
            float t = (float)i / steps;
            float checkX = x1 + dx * t;
            float checkY = y1 + dy * t;

            int gridX = (int)(checkX / CellSize);
            int gridY = (int)(checkY / CellSize);

            if (gridX < 0 || gridX >= _gridWidth || gridY < 0 || gridY >= _gridHeight)
                return false;

            if (!_walkableGrid[gridX, gridY])
                return false;
        }

        return true;
    }

    /// <summary>
    /// Check if a world position is walkable
    /// </summary>
    public bool IsWalkable(float x, float y)
    {
        int gridX = (int)(x / CellSize);
        int gridY = (int)(y / CellSize);

        if (gridX < 0 || gridX >= _gridWidth || gridY < 0 || gridY >= _gridHeight)
            return false;

        return _walkableGrid[gridX, gridY];
    }
}

/// <summary>
/// Node used in A* pathfinding
/// </summary>
internal class PathNode
{
    public int X { get; private set; }
    public int Y { get; private set; }
    public float G { get; set; } = float.MaxValue; // Cost from start
    public float H { get; set; } = 0; // Heuristic to end
    public float F => G + H; // Total estimated cost
    public PathNode? Parent { get; set; }

    public PathNode(int x, int y)
    {
        X = x;
        Y = y;
    }

    public void Reset(int x, int y)
    {
        X = x;
        Y = y;
        G = float.MaxValue;
        H = 0;
        Parent = null;
    }
}
