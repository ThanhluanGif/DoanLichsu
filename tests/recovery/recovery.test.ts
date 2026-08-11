import { copyFileSync,mkdtempSync,readFileSync,writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { describe,expect,it } from "vitest";

const root=resolve(import.meta.dirname,"../..");
function run(command:string,args:string[],env:Record<string,string>={}){
  const result=spawnSync(command,args,{cwd:root,env:{...process.env,...env},encoding:"utf8"});
  if(result.status!==0)throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);return result.stdout.trim();
}

describe("backup and restore rehearsal",()=>{
  it("creates a verified snapshot and restores matching v1 counts",()=>{
    const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-recovery-"));const databasePath=join(directory,"source.sqlite");const backupDirectory=join(directory,"backups");
    run(process.execPath,["scripts/migrate.mjs"],{DATABASE_PATH:databasePath});
    run(resolve(root,"node_modules/.bin/tsx"),["scripts/seed.ts"],{DATABASE_PATH:databasePath});
    const backup=JSON.parse(run(process.execPath,["scripts/backup.mjs"],{DATABASE_PATH:databasePath,BACKUP_DIR:backupDirectory}));
    expect(backup.counts).toMatchObject({contentNodes:50,translations:100,sources:50,claims:0,claimEvidence:0,users:3,curriculumRequirements:55,curriculumMappings:23});expect(backup.sha256).toMatch(/^[a-f0-9]{64}$/);
    const restoredPath=join(directory,"restored.sqlite");
    const restore=JSON.parse(run(process.execPath,["scripts/restore.mjs",backup.snapshot],{RESTORE_DATABASE_PATH:restoredPath}));
    expect(restore).toMatchObject({database:restoredPath,sha256Verified:true,schemaVersion:5,counts:backup.counts});
    const restored=new Database(restoredPath,{readonly:true});
    try{expect(restored.prepare("SELECT count(*) AS count FROM content_nodes WHERE status='PUBLISHED'").get()).toEqual({count:50});}finally{restored.close();}
  },15_000);

  it("refuses a snapshot whose bytes no longer match the manifest",()=>{
    const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-recovery-tamper-"));const databasePath=join(directory,"source.sqlite");
    run(process.execPath,["scripts/migrate.mjs"],{DATABASE_PATH:databasePath});run(resolve(root,"node_modules/.bin/tsx"),["scripts/seed.ts"],{DATABASE_PATH:databasePath});
    const backup=JSON.parse(run(process.execPath,["scripts/backup.mjs"],{DATABASE_PATH:databasePath,BACKUP_DIR:directory}));
    const tampered=join(directory,"tampered.sqlite");copyFileSync(backup.snapshot,tampered);copyFileSync(backup.manifest,`${tampered}.manifest.json`);
    const bytes=readFileSync(tampered);writeFileSync(tampered,Buffer.concat([bytes,Buffer.from("tampered")]));
    const result=spawnSync(process.execPath,["scripts/restore.mjs",tampered],{cwd:root,env:{...process.env,RESTORE_DATABASE_PATH:join(directory,"must-not-exist.sqlite")},encoding:"utf8"});
    expect(result.status).not.toBe(0);expect(result.stderr).toContain("SHA-256");
  },15_000);
});
