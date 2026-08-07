#!/usr/bin/env node

import { createHash } from "node:crypto";
import { chmod,lstat,mkdir,readFile,rename,writeFile } from "node:fs/promises";
import { basename,resolve } from "node:path";
import Database from "better-sqlite3";

const sourcePath=resolve(process.env.DATABASE_PATH?.trim()||"./data/quan-su-viet.db");
const backupDirectory=resolve(process.env.BACKUP_DIR?.trim()||"./backups");

function databaseCounts(database){return {
  contentNodes:database.prepare("SELECT count(*) AS count FROM content_nodes").get().count,
  translations:database.prepare("SELECT count(*) AS count FROM content_translations").get().count,
  sources:database.prepare("SELECT count(*) AS count FROM sources").get().count,
  media:database.prepare("SELECT count(*) AS count FROM media").get().count,
  users:database.prepare("SELECT count(*) AS count FROM users").get().count,
};}

function schemaVersion(database){return database.prepare("SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations").get().version;}
function digest(buffer){return createHash("sha256").update(buffer).digest("hex");}
function assertHealthy(database){
  const integrity=database.pragma("integrity_check",{simple:true});
  if(integrity!=="ok")throw new Error(`SQLite integrity check failed: ${integrity}`);
  const version=schemaVersion(database);if(version<1)throw new Error("Database has no applied schema migration.");return version;
}

const sourceMetadata=await lstat(sourcePath);
if(!sourceMetadata.isFile()||sourceMetadata.isSymbolicLink()||sourceMetadata.nlink!==1)throw new Error("DATABASE_PATH must be a single-link regular file.");
await mkdir(backupDirectory,{recursive:true,mode:0o700});
const stamp=new Date().toISOString().replace(/[:.]/g,"-");
const snapshot=resolve(backupDirectory,`quan-su-viet-${stamp}.sqlite`);
const manifest=`${snapshot}.manifest.json`;
const source=new Database(sourcePath,{fileMustExist:true});
try{
  source.pragma("foreign_keys=ON");source.pragma("wal_checkpoint(PASSIVE)");assertHealthy(source);
  await source.backup(snapshot);
}finally{source.close();}
await chmod(snapshot,0o600);
const snapshotDatabase=new Database(snapshot,{readonly:true,fileMustExist:true});
let counts;let version;
try{version=assertHealthy(snapshotDatabase);counts=databaseCounts(snapshotDatabase);}finally{snapshotDatabase.close();}
const bytes=await readFile(snapshot);const sha256=digest(bytes);
const document={format:"quan-su-viet-backup-v1",createdAt:new Date().toISOString(),appVersion:process.env.APP_VERSION||"0.1.0",snapshot:basename(snapshot),sha256,bytes:bytes.length,schemaVersion:version,counts};
const temporaryManifest=`${manifest}.tmp-${process.pid}`;
await writeFile(temporaryManifest,`${JSON.stringify(document,null,2)}\n`,{mode:0o600,flag:"wx"});
await rename(temporaryManifest,manifest);
process.stdout.write(`${JSON.stringify({snapshot,manifest,sha256,counts})}\n`);
