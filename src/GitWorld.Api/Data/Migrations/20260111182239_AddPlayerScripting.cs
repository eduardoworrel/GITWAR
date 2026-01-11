using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerScripting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomScript",
                table: "players",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ScriptEnabled",
                table: "players",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScriptUpdatedAt",
                table: "players",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomScript",
                table: "players");

            migrationBuilder.DropColumn(
                name: "ScriptEnabled",
                table: "players");

            migrationBuilder.DropColumn(
                name: "ScriptUpdatedAt",
                table: "players");
        }
    }
}
