import { openDatabase } from "../../src/lib/db/connection";
import { updateUser } from "../../src/lib/content/editorial";

const [databasePath, userId] = process.argv.slice(2);
const database = openDatabase(databasePath);
try {
  await updateUser(database, userId, { version: 1, role: "EDITOR" }, {
    id: "user-reviewer", email: "reviewer@quansuviet.local", displayName: "Race reviewer", role: "ADMIN",
  });
  console.log(JSON.stringify({ ok: true }));
} catch (error) {
  console.log(JSON.stringify({ ok: false, code: error instanceof Error && "code" in error ? error.code : "UNKNOWN" }));
} finally {
  database.close();
}
