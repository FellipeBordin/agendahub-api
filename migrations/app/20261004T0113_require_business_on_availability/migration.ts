#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/07c9316807307dc37fee88abd9abc8b61ee7c44c04526ba4fffd8d0232d6fb67/contract";
import startContract from "../../snapshots/07c9316807307dc37fee88abd9abc8b61ee7c44c04526ba4fffd8d0232d6fb67/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/7c19967c1fd7f89517f491815d4ccbf610b613df344a69a4bb687d07a63a554a/contract";
import endContract from "../../snapshots/7c19967c1fd7f89517f491815d4ccbf610b613df344a69a4bb687d07a63a554a/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setNotNull({
        schema: "public",
        table: "Availability",
        column: "businessId",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
