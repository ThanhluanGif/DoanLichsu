#!/usr/bin/env node

import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { chmod,copyFile,lstat,mkdir,readFile,unlink } from "node:fs/promises";
import { basename,dirname,extname,resolve } from "node:path";
import Database from "better-sqlite3";

const rawSnapshot=process.argv[2];if(!rawSnapshot)throw new Error("Usage: npm run db:restore -- <snapshot>");
const snapshot=resolve(rawSnapshot);const manifestPath=resolve(process.env.RESTORE_MANIFEST_PATH?.trim()||`${snapshot}.manifest.json`);
const defaultName=`${basename(snapshot,extname(snapshot))}-restored.sqlite`;
const destination=resolve(process.env.RESTORE_DATABASE_PATH?.trim()||resolve(dirname(snapshot),"restored",defaultName));

function digest(buffer){return createHash("sha256").update(buffer).digest("hex");}
function databaseCounts(database){return {
  contentNodes:database.prepare("SELECT count(*) AS count FROM content_nodes").get().count,
  translations:database.prepare("SELECT count(*) AS count FROM content_translations").get().count,
  sources:database.prepare("SELECT count(*) AS count FROM sources").get().count,
  claims:database.prepare("SELECT count(*) AS count FROM content_claims").get().count,
  claimEvidence:database.prepare("SELECT count(*) AS count FROM claim_evidence").get().count,
  media:database.prepare("SELECT count(*) AS count FROM media").get().count,
  users:database.prepare("SELECT count(*) AS count FROM users").get().count,
};}
function schemaVersion(database){return database.prepare("SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations").get().version;}

for(const path of [snapshot,manifestPath]){const metadata=await lstat(path);if(!metadata.isFile()||metadata.isSymbolicLink()||metadata.nlink!==1)throw new Error(`${path} must be a single-link regular file.`);}
if(destination===snapshot)throw new Error("Restore destination must differ from the snapshot.");
const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
if(manifest.format!=="quan-su-viet-backup-v1")throw new Error("Unsupported backup manifest format.");
const bytes=await readFile(snapshot);const actualSha256=digest(bytes);
if(actualSha256!==manifest.sha256)throw new Error("Backup SHA-256 does not match its manifest.");
await mkdir(dirname(destination),{recursive:true,mode:0o700});
await copyFile(snapshot,destination,fsConstants.COPYFILE_EXCL);await chmod(destination,0o600);
try{
  const database=new Database(destination,{readonly:true,fileMustExist:true});let counts;let version;
  try{
    const integrity=database.pragma("integrity_check",{simple:true});if(integrity!=="ok")throw new Error(`SQLite integrity check failed: ${integrity}`);
    version=schemaVersion(database);counts=databaseCounts(database);
  }finally{database.close();}
  if(version!==manifest.schemaVersion)throw new Error(`Schema version mismatch: ${version} != ${manifest.schemaVersion}`);
  if(JSON.stringify(counts)!==JSON.stringify(manifest.counts))throw new Error("Restored table counts do not match the manifest.");
  process.stdout.write(`${JSON.stringify({database:destination,sha256Verified:true,schemaVersion:version,counts})}\n`);
}catch(error){await unlink(destination).catch(()=>{});throw error;}
