using GitWorld.Api.Data;
using GitWorld.Shared.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitWorld.Api.Services;

public interface IItemService
{
    Task<List<Item>> GetAllItemsAsync();
    Task<Item?> GetItemByIdAsync(Guid itemId);
    Task<List<PlayerItem>> GetPlayerInventoryAsync(Guid playerId);
    Task<List<PlayerItem>> GetEquippedItemsAsync(Guid playerId);
    Task<(PlayerItem? playerItem, string? error, int newGoldBalance)> AcquireItemAsync(Guid playerId, Guid itemId);
    Task<bool> EquipItemAsync(Guid playerId, Guid playerItemId);
    Task<bool> UnequipItemAsync(Guid playerId, Guid playerItemId);
    Task<int> CleanupExpiredItemsAsync();
    Task<ItemBonuses> GetPlayerBonusesAsync(Guid playerId);
}

public class ItemBonuses
{
    public int Dano { get; set; }
    public int Armadura { get; set; }
    public int Hp { get; set; }
    public int Critico { get; set; }
    public int Evasao { get; set; }
    public int VelocidadeAtaque { get; set; }
    public int VelocidadeMovimento { get; set; }
}

public class ItemService : IItemService
{
    private readonly AppDbContext _db;
    private readonly ILogger<ItemService> _logger;

    public ItemService(AppDbContext db, ILogger<ItemService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<Item>> GetAllItemsAsync()
    {
        return await _db.Items.ToListAsync();
    }

    public async Task<Item?> GetItemByIdAsync(Guid itemId)
    {
        return await _db.Items.FindAsync(itemId);
    }

    public async Task<List<PlayerItem>> GetPlayerInventoryAsync(Guid playerId)
    {
        return await _db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == playerId)
            .Where(pi => pi.ExpiresAt == null || pi.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(pi => pi.IsEquipped)
            .ThenBy(pi => pi.Item.Category)
            .ToListAsync();
    }

    public async Task<List<PlayerItem>> GetEquippedItemsAsync(Guid playerId)
    {
        return await _db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == playerId && pi.IsEquipped)
            .Where(pi => pi.ExpiresAt == null || pi.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<(PlayerItem? playerItem, string? error, int newGoldBalance)> AcquireItemAsync(Guid playerId, Guid itemId)
    {
        var item = await _db.Items.FindAsync(itemId);
        if (item == null)
        {
            _logger.LogWarning("Item {ItemId} not found", itemId);
            return (null, "ITEM_NOT_FOUND", 0);
        }

        var player = await _db.Players.FindAsync(playerId);
        if (player == null)
        {
            _logger.LogWarning("Player {PlayerId} not found", playerId);
            return (null, "PLAYER_NOT_FOUND", 0);
        }

        // Check if player has enough gold
        if (player.Gold < item.Price)
        {
            _logger.LogWarning("Player {PlayerId} has insufficient gold ({Gold}) for item {ItemName} (price: {Price})",
                playerId, player.Gold, item.Name, item.Price);
            return (null, "INSUFFICIENT_GOLD", player.Gold);
        }

        // Deduct gold from player
        player.Gold -= item.Price;

        var playerItem = new PlayerItem
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            ItemId = itemId,
            AcquiredAt = DateTime.UtcNow,
            ExpiresAt = item.DurationMinutes.HasValue
                ? DateTime.UtcNow.AddMinutes(item.DurationMinutes.Value)
                : null,
            IsEquipped = false
        };

        _db.PlayerItems.Add(playerItem);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Player {PlayerId} purchased item {ItemName} for {Price} gold (new balance: {Gold})",
            playerId, item.Name, item.Price, player.Gold);

        return (playerItem, null, player.Gold);
    }

    public async Task<bool> EquipItemAsync(Guid playerId, Guid playerItemId)
    {
        var playerItem = await _db.PlayerItems
            .Include(pi => pi.Item)
            .FirstOrDefaultAsync(pi => pi.Id == playerItemId && pi.PlayerId == playerId);

        if (playerItem == null)
        {
            _logger.LogWarning("PlayerItem {PlayerItemId} not found for player {PlayerId}", playerItemId, playerId);
            return false;
        }

        // Verificar se expirou
        if (playerItem.ExpiresAt.HasValue && playerItem.ExpiresAt <= DateTime.UtcNow)
        {
            _logger.LogWarning("PlayerItem {PlayerItemId} has expired", playerItemId);
            return false;
        }

        // Desequipar item anterior da mesma categoria
        var existingEquipped = await _db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == playerId
                      && pi.IsEquipped
                      && pi.Item.Category == playerItem.Item.Category
                      && pi.Id != playerItemId)
            .FirstOrDefaultAsync();

        if (existingEquipped != null)
        {
            existingEquipped.IsEquipped = false;
            _logger.LogDebug("Auto-unequipped {ItemName} from category {Category}",
                existingEquipped.Item.Name, existingEquipped.Item.Category);
        }

        playerItem.IsEquipped = true;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Player {PlayerId} equipped {ItemName}", playerId, playerItem.Item.Name);
        return true;
    }

    public async Task<bool> UnequipItemAsync(Guid playerId, Guid playerItemId)
    {
        var playerItem = await _db.PlayerItems
            .Include(pi => pi.Item)
            .FirstOrDefaultAsync(pi => pi.Id == playerItemId && pi.PlayerId == playerId);

        if (playerItem == null)
        {
            _logger.LogWarning("PlayerItem {PlayerItemId} not found for player {PlayerId}", playerItemId, playerId);
            return false;
        }

        playerItem.IsEquipped = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Player {PlayerId} unequipped {ItemName}", playerId, playerItem.Item.Name);
        return true;
    }

    public async Task<int> CleanupExpiredItemsAsync()
    {
        var now = DateTime.UtcNow;
        var expiredItems = await _db.PlayerItems
            .Where(pi => pi.ExpiresAt.HasValue && pi.ExpiresAt <= now)
            .ToListAsync();

        if (expiredItems.Count > 0)
        {
            _db.PlayerItems.RemoveRange(expiredItems);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Removed {Count} expired items", expiredItems.Count);
        }

        return expiredItems.Count;
    }

    public async Task<ItemBonuses> GetPlayerBonusesAsync(Guid playerId)
    {
        var equippedItems = await GetEquippedItemsAsync(playerId);

        var bonuses = new ItemBonuses();
        foreach (var pi in equippedItems)
        {
            bonuses.Dano += pi.Item.DanoBonus;
            bonuses.Armadura += pi.Item.ArmaduraBonus;
            bonuses.Hp += pi.Item.HpBonus;
            bonuses.Critico += pi.Item.CriticoBonus;
            bonuses.Evasao += pi.Item.EvasaoBonus;
            bonuses.VelocidadeAtaque += pi.Item.VelocidadeAtaqueBonus;
            bonuses.VelocidadeMovimento += pi.Item.VelocidadeMovimentoBonus;
        }

        return bonuses;
    }
}
