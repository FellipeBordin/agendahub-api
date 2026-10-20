#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/3bccf462e9c6a8818f1087e84b42f478e2e55a6e4125eff58e4734cb6f9db251/contract";
import startContract from "../../snapshots/3bccf462e9c6a8818f1087e84b42f478e2e55a6e4125eff58e4734cb6f9db251/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/bd7928ca93265dee3c80e991d42246bf21cea966708887230de996f0a13ce23c/contract";
import endContract from "../../snapshots/bd7928ca93265dee3c80e991d42246bf21cea966708887230de996f0a13ce23c/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setNotNull({
        schema: "public",
        table: "Service",
        column: "businessId",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
