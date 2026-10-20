#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/b5b09c328cc6c944e06dc34700a9e82c3d46241a4d4fc6963ada8124664acc20/contract";
import startContract from "../../snapshots/b5b09c328cc6c944e06dc34700a9e82c3d46241a4d4fc6963ada8124664acc20/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/e337b4f857c84b431447640939b6da638628105f050c4fe0822721591c6766ef/contract";
import endContract from "../../snapshots/e337b4f857c84b431447640939b6da638628105f050c4fe0822721591c6766ef/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;
  override get operations() {
    return [
      this.setNotNull({
        schema: "public",
        table: "Appointment",
        column: "businessId",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
