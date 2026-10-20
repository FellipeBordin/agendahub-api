#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/536c05054e1ecb098e857991b32d5226925ea05341840d9febb54a0356c93554/contract";
import startContract from "../../snapshots/536c05054e1ecb098e857991b32d5226925ea05341840d9febb54a0356c93554/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/b1ae9b79a0ec5e7989892900d5960a38675dbe22079bf17526dc053a059c3954/contract";
import endContract from "../../snapshots/b1ae9b79a0ec5e7989892900d5960a38675dbe22079bf17526dc053a059c3954/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setNotNull({
        schema: "public",
        table: "BlockedPeriod",
        column: "businessId",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
