using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItemPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "price",
                table: "items",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "price",
                table: "items");
        }
    }
}
