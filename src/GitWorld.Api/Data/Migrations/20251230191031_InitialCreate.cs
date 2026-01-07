using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "players",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    github_id = table.Column<long>(type: "bigint", nullable: false),
                    github_login = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    hp = table.Column<int>(type: "integer", nullable: false),
                    hp_max = table.Column<int>(type: "integer", nullable: false),
                    dano = table.Column<int>(type: "integer", nullable: false),
                    velocidade = table.Column<int>(type: "integer", nullable: false),
                    critico = table.Column<int>(type: "integer", nullable: false),
                    evasao = table.Column<int>(type: "integer", nullable: false),
                    armadura = table.Column<int>(type: "integer", nullable: false),
                    reino = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    x = table.Column<float>(type: "real", nullable: false, defaultValue: 5000f),
                    y = table.Column<float>(type: "real", nullable: false, defaultValue: 5000f),
                    vitorias = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    derrotas = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_github_sync = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_players", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "battles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    player1_id = table.Column<Guid>(type: "uuid", nullable: false),
                    player2_id = table.Column<Guid>(type: "uuid", nullable: false),
                    winner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    duration_ms = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_battles", x => x.id);
                    table.ForeignKey(
                        name: "FK_battles_players_player1_id",
                        column: x => x.player1_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_battles_players_player2_id",
                        column: x => x.player2_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_battles_players_winner_id",
                        column: x => x.winner_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_battles_player1_id",
                table: "battles",
                column: "player1_id");

            migrationBuilder.CreateIndex(
                name: "IX_battles_player2_id",
                table: "battles",
                column: "player2_id");

            migrationBuilder.CreateIndex(
                name: "IX_battles_winner_id",
                table: "battles",
                column: "winner_id");

            migrationBuilder.CreateIndex(
                name: "IX_players_github_id",
                table: "players",
                column: "github_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "battles");

            migrationBuilder.DropTable(
                name: "players");
        }
    }
}
