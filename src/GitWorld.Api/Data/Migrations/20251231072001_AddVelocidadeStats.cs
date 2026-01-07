using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVelocidadeStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "velocidade",
                table: "players",
                newName: "velocidade_movimento");

            migrationBuilder.AddColumn<int>(
                name: "velocidade_ataque",
                table: "players",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "velocidade_ataque",
                table: "players");

            migrationBuilder.RenameColumn(
                name: "velocidade_movimento",
                table: "players",
                newName: "velocidade");
        }
    }
}
