using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitWorld.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddS2ReadToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "S2ReadToken",
                table: "players",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "S2ReadTokenExpiresAt",
                table: "players",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "S2ReadToken",
                table: "players");

            migrationBuilder.DropColumn(
                name: "S2ReadTokenExpiresAt",
                table: "players");
        }
    }
}
