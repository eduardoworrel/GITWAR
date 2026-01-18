using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectileProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "projectile_color",
                table: "items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "projectile_size",
                table: "items",
                type: "real",
                nullable: false,
                defaultValue: 1f);

            migrationBuilder.AddColumn<int>(
                name: "range_bonus",
                table: "items",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "projectile_color",
                table: "items");

            migrationBuilder.DropColumn(
                name: "projectile_size",
                table: "items");

            migrationBuilder.DropColumn(
                name: "range_bonus",
                table: "items");
        }
    }
}
