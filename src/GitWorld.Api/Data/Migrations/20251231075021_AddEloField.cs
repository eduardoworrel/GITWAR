using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEloField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "elo",
                table: "players",
                type: "integer",
                nullable: false,
                defaultValue: 1000);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "elo",
                table: "players");
        }
    }
}
