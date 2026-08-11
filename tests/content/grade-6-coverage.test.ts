import Database from "better-sqlite3";
import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {grade6BatchAsOf,grade6Lessons,grade6Sources} from "@/data/curriculum/grade-6/content";
import {migrateDatabase} from "@/lib/db/migrate";
import {getCurriculumGrade,getDetail} from "@/lib/content/public-repository";

const directories:string[]=[];
const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-6-"));
directories.push(directory);
const databasePath=join(directory,"grade-6.db");

type SeedResult={
  mode:string;asOf:string;review:string;copyright:string;lessons:number;translations:number;
  lessonTranslations:number;sources:number;claims:number;evidence:number;mappings:number;
};

function seed(path:string,extraEnv:Record<string,string>={}){
  return spawnSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{
    cwd:resolve("."),encoding:"utf8",env:{...process.env,DATABASE_PATH:path,...extraEnv},
  });
}

function successfulSeed(path:string,extraEnv:Record<string,string>={}){
  const result=seed(path,extraEnv);
  if(result.status!==0)throw new Error(result.stderr);
  return JSON.parse(result.stdout) as SeedResult|Record<string,number>;
}

let firstBatch:SeedResult;
let secondBatch:SeedResult;

beforeAll(()=>{
  migrateDatabase(databasePath);
  expect(successfulSeed(databasePath)).toEqual({contentNodes:50,translations:100,sources:50,users:3,curriculumRequirements:55,curriculumMappings:23});
  firstBatch=successfulSeed(databasePath,{
    NODE_ENV:"production",GRADE_6_SEED_ONLY:"1",SEED_ADMIN_PASSWORD:"",SEED_EDITOR_PASSWORD:"",SEED_REVIEWER_PASSWORD:"",
  }) as SeedResult;
  secondBatch=successfulSeed(databasePath,{GRADE_6_SEED_ONLY:"1"}) as SeedResult;
},30_000);

afterAll(()=>{for(const path of directories)rmSync(path,{recursive:true,force:true});});

describe("C-028 Grade 6 curriculum batch",()=>{
  it("is deterministic, idempotent and leaves the exact demo seed intact",()=>{
    expect(firstBatch).toEqual({
      mode:"grade-6-only",asOf:grade6BatchAsOf,review:"internal-c028-not-historian-council",
      copyright:"citations-only-no-third-party-binaries",lessons:8,translations:16,
      lessonTranslations:16,sources:8,claims:16,evidence:16,mappings:8,
    });
    expect(secondBatch).toEqual(firstBatch);
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes").get()).toEqual({count:58});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_translations").get()).toEqual({count:116});
      expect(database.prepare("SELECT type,COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type").all()).toEqual([
        {type:"ARTIFACT",count:10},{type:"EVENT",count:20},{type:"PERIOD",count:6},
        {type:"PERSON",count:10},{type:"TOPIC",count:12},
      ]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g6-%'").get()).toEqual({count:8});
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM content_translations WHERE node_id LIKE 'lesson-g6-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:8},{locale:"vi",count:8}]);
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM lesson_translations WHERE content_id LIKE 'lesson-g6-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:8},{locale:"vi",count:8}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_curriculum WHERE content_id LIKE 'lesson-g6-%'").get()).toEqual({count:8});
    }finally{database.close();}
  });

  it("publishes all eight mandatory requirements with bilingual lessons and grounded claims",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      const expectedRequirements=grade6Lessons.map(({requirementId})=>requirementId);
      for(const locale of ["vi","en"] as const){
        const grade=getCurriculumGrade(database,locale,"6",new URLSearchParams({track:"MANDATORY",pageSize:"50"})).data;
        expect(grade.summary).toEqual({requirementCount:8,publishedRequirementCount:8,verifiedRequirementCount:8,fullCoverage:true});
        expect(grade.requirements.map(({id})=>id)).toEqual(expectedRequirements);
        expect(grade.requirements.every((item)=>item.coverageStatus==="VERIFIED"&&item.publishedCount>0&&item.verifiedCount>0)).toBe(true);
        for(const lesson of grade6Lessons){
          const requirement=grade.requirements.find(({id})=>id===lesson.requirementId)!;
          expect(requirement.lessons.map(({id})=>id)).toContain(lesson.id);
          const localized=lesson[locale];
          const detail=getDetail(database,locale,"TOPIC",localized.slug).data;
          expect(detail).toMatchObject({
            id:lesson.id,title:localized.title,asOf:grade6BatchAsOf,reviewedBy:expect.stringContaining("C-028"),
            lesson:{learningObjectives:localized.learningObjectives,originalSummary:localized.originalSummary,analysis:localized.analysis,debates:localized.debates},
          });
          expect(detail.sources.map(({id})=>id)).toEqual(lesson.sourceIds);
          expect(detail.sources.every((source)=>source.verificationStatus==="VERIFIED"&&source.verifiedBy==="Kiểm duyệt viên"&&source.verificationNote?.includes("không phải xác nhận của Hội đồng sử học"))).toBe(true);
          expect(detail.claims).toHaveLength(2);
          expect(detail.claims.every((claim)=>claim.statement.trim().length>0&&claim.evidence.length===1&&claim.evidence[0].locator.trim().length>0&&claim.evidence[0].quote===null&&claim.evidence[0].source.verificationStatus==="VERIFIED")).toBe(true);
          expect(detail.media).toEqual([]);
        }
      }
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM sources WHERE id LIKE 'source-g6-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:8}]);
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM content_claims WHERE id LIKE 'claim-g6-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:16}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM claim_evidence WHERE claim_id LIKE 'claim-g6-%' AND quote IS NULL").get()).toEqual({count:16});
    }finally{database.close();}
  });

  it("keeps every external source citation-only and guards against copied-source fixtures",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM content_media
        WHERE content_id IN (SELECT id FROM content_nodes WHERE id LIKE 'lesson-g6-%')
      `).get()).toEqual({count:0});
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM media
        WHERE id LIKE 'media-g6-%' OR url IN (SELECT url FROM sources WHERE id LIKE 'source-g6-%')
      `).get()).toEqual({count:0});
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM sources
        WHERE id LIKE 'source-g6-%' AND url LIKE 'https://%'
          AND citation_note LIKE '%không tải hoặc sao chép tệp nhị phân%'
          AND archived_url IS NULL AND checksum IS NULL
      `).get()).toEqual({count:8});
    }finally{database.close();}

    const prose=grade6Lessons.flatMap((lesson)=>[lesson.vi.body,lesson.vi.analysis,lesson.en.body,lesson.en.analysis]).join("\n").toLocaleLowerCase("vi");
    const copiedSourceFixtures=[
      "mạng lưới các tuyến giao thông và thương mại dần dần được kết nối",
      "văn hóa đông sơn là cơ sở vật chất và là sự thể hiện sinh động",
      "thousands of human fossils enable researchers and students to study the changes",
      "the silk roads carried more than just merchandise and precious commodities",
      "the property represents a vivid picture of spiritual and political life",
    ];
    for(const fixture of copiedSourceFixtures)expect(prose).not.toContain(fixture);
    for(const lesson of grade6Lessons){
      expect(lesson.vi.body.length).toBeGreaterThan(500);expect(lesson.en.body.length).toBeGreaterThan(500);
      expect(lesson.vi.body).not.toBe(lesson.en.body);
    }
    expect(new Set(grade6Sources.map(({url})=>url)).size).toBe(8);
  });

  it("refuses to overwrite a manually edited batch row without explicit authority",()=>{
    const protectedDirectory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-6-protection-"));
    directories.push(protectedDirectory);
    const protectedPath=join(protectedDirectory,"protected.db");
    migrateDatabase(protectedPath);successfulSeed(protectedPath);successfulSeed(protectedPath,{GRADE_6_SEED_ONLY:"1"});
    const database=new Database(protectedPath);
    database.prepare("UPDATE sources SET title=?,updated_at=? WHERE id=?").run("Biên tập thủ công cần giữ nguyên","2026-08-11T12:00:00.000Z","source-g6-vnmh-funan");
    database.close();
    const rejected=seed(protectedPath,{GRADE_6_SEED_ONLY:"1"});
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("Refusing to replace edited Grade 6 row sources.source-g6-vnmh-funan");
    const check=new Database(protectedPath,{readonly:true});
    try{expect(check.prepare("SELECT title FROM sources WHERE id=?").get("source-g6-vnmh-funan")).toEqual({title:"Biên tập thủ công cần giữ nguyên"});}
    finally{check.close();}
  },15_000);
});
