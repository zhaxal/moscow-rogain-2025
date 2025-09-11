import { defineConfig } from "kysely-ctl";

import { dialect } from "../src/database";

export default defineConfig({
  // replace me with a real dialect instance OR a dialect name + `dialectConfig` prop.
  dialect: dialect,
  //   migrations: {
  //     migrationFolder: "migrations",
  //   },
  //   plugins: [],
  //   seeds: {
  //     seedFolder: "seeds",
  //   }
});
