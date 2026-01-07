using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItemSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    tier = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    dano_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    armadura_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    hp_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    critico_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    evasao_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    velocidade_ataque_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    velocidade_movimento_bonus = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    duration_condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    visual_description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "player_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    player_id = table.Column<Guid>(type: "uuid", nullable: false),
                    item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    acquired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_equipped = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_player_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_player_items_items_item_id",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_player_items_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_player_items_item_id",
                table: "player_items",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "IX_player_items_player_id",
                table: "player_items",
                column: "player_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "player_items");

            migrationBuilder.DropTable(
                name: "items");
        }
    }
}
