import Database from "better-sqlite3";
import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {grade6Lessons} from "@/data/curriculum/grade-6/content";
import {grade7Lessons} from "@/data/curriculum/grade-7/content";
import {grade8Lessons} from "@/data/curriculum/grade-8/content";
import {grade9BatchAsOf,grade9Lessons,grade9Sources} from "@/data/curriculum/grade-9/content";
import {migrateDatabase} from "@/lib/db/migrate";
import {getCurriculumGrade,getDetail} from "@/lib/content/public-repository";

const directories:string[]=[];
const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-9-"));
directories.push(directory);
const databasePath=join(directory,"grade-9.db");

type SeedResult={mode:string;asOf:string;review:string;copyright:string;lessons:number;translations:number;lessonTranslations:number;sources:number;claims:number;evidence:number;mappings:number};

function seed(path:string,extraEnv:Record<string,string>={}){
  return spawnSync(resolve("node_modules/.bin/tsx"),["scripts/seed.ts"],{cwd:resolve("."),encoding:"utf8",env:{...process.env,DATABASE_PATH:path,...extraEnv}});
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
  expect(successfulSeed(databasePath,{GRADE_6_SEED_ONLY:"1"})).toMatchObject({mode:"grade-6-only",lessons:8,mappings:8});
  expect(successfulSeed(databasePath,{GRADE_7_SEED_ONLY:"1"})).toMatchObject({mode:"grade-7-only",lessons:6,mappings:6});
  expect(successfulSeed(databasePath,{GRADE_8_SEED_ONLY:"1"})).toMatchObject({mode:"grade-8-only",lessons:7,mappings:7});
  firstBatch=successfulSeed(databasePath,{NODE_ENV:"production",GRADE_9_SEED_ONLY:"1",SEED_ADMIN_PASSWORD:"",SEED_EDITOR_PASSWORD:"",SEED_REVIEWER_PASSWORD:""}) as SeedResult;
  secondBatch=successfulSeed(databasePath,{GRADE_9_SEED_ONLY:"1"}) as SeedResult;
},90_000);

afterAll(()=>{for(const path of directories)rmSync(path,{recursive:true,force:true});});

describe("C-031 Grade 9 curriculum batch",()=>{
  it("keeps the base seed intact, coexists with Grades 6–8, and is idempotent",()=>{
    expect(firstBatch).toEqual({mode:"grade-9-only",asOf:grade9BatchAsOf,review:"internal-c031-not-historian-council",copyright:"citations-only-no-third-party-binaries",lessons:6,translations:12,lessonTranslations:12,sources:22,claims:12,evidence:12,mappings:6});
    expect(secondBatch).toEqual(firstBatch);
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes").get()).toEqual({count:77});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_translations").get()).toEqual({count:154});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g6-%'").get()).toEqual({count:grade6Lessons.length});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g7-%'").get()).toEqual({count:grade7Lessons.length});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g8-%'").get()).toEqual({count:grade8Lessons.length});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g9-%'").get()).toEqual({count:6});
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM content_translations WHERE node_id LIKE 'lesson-g9-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:6},{locale:"vi",count:6}]);
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM lesson_translations WHERE content_id LIKE 'lesson-g9-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:6},{locale:"vi",count:6}]);
    }finally{database.close();}
  });

  it("publishes all six mandatory requirements in VI and EN with grounded claims",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      const expectedRequirements=grade9Lessons.map(({requirementId})=>requirementId);
      for(const locale of ["vi","en"] as const){
        const grade=getCurriculumGrade(database,locale,"9",new URLSearchParams({track:"MANDATORY",pageSize:"50"})).data;
        expect(grade.summary).toEqual({requirementCount:6,publishedRequirementCount:6,verifiedRequirementCount:6,fullCoverage:true});
        expect(grade.requirements.map(({id})=>id)).toEqual(expectedRequirements);
        for(const lesson of grade9Lessons){
          const localized=lesson[locale];
          const detail=getDetail(database,locale,"TOPIC",localized.slug).data;
          expect(detail).toMatchObject({id:lesson.id,title:localized.title,asOf:grade9BatchAsOf,reviewedBy:expect.stringContaining("C-031"),lesson:{learningObjectives:localized.learningObjectives,originalSummary:localized.originalSummary,analysis:localized.analysis,debates:localized.debates}});
          expect(detail.sources.map(({id})=>id)).toEqual(lesson.sourceIds);
          expect(detail.sources.every((source)=>source.verificationStatus==="VERIFIED"&&source.verifiedBy==="Kiểm duyệt viên"&&source.verificationNote?.includes("không phải xác nhận của Hội đồng sử học"))).toBe(true);
          expect(detail.claims).toHaveLength(2);
          expect(detail.claims.every((claim)=>claim.statement.trim().length>0&&claim.evidence.length===1&&claim.evidence[0].locator.trim().length>0&&claim.evidence[0].quote===null&&claim.evidence[0].source.verificationStatus==="VERIFIED")).toBe(true);
          expect(detail.media).toEqual([]);
        }
      }
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM sources WHERE id LIKE 'source-g9-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:22}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM claim_evidence WHERE claim_id LIKE 'claim-g9-%' AND quote IS NULL").get()).toEqual({count:12});
    }finally{database.close();}
  });

  it("uses original bilingual prose and citation-only institutional materials",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_media WHERE content_id IN (SELECT id FROM content_nodes WHERE id LIKE 'lesson-g9-%')").get()).toEqual({count:0});
      expect(database.prepare("SELECT COUNT(*) AS count FROM sources WHERE id LIKE 'source-g9-%' AND url LIKE 'https://%' AND citation_note LIKE '%không tải hoặc sao chép tệp nhị phân%' AND archived_url IS NULL AND checksum IS NULL").get()).toEqual({count:22});
    }finally{database.close();}
    for(const lesson of grade9Lessons){
      expect(lesson.vi.body.length).toBeGreaterThan(1100);expect(lesson.en.body.length).toBeGreaterThan(1100);
      expect(lesson.vi.body).not.toBe(lesson.en.body);
      expect(lesson.vi.analysis.length).toBeGreaterThan(300);expect(lesson.en.analysis.length).toBeGreaterThan(300);
    }
    expect(new Set(grade9Sources.map(({url})=>url)).size).toBe(22);
  });

  it("covers each declared period rather than token endpoints",()=>{
    const byRequirement=new Map(grade9Lessons.map((lesson)=>[lesson.requirementId,`${lesson.vi.body}\n${lesson.en.body}`.toLocaleLowerCase("vi")]));
    const required:Record<string,string[]>={
      "g9-world-1918-1945":["1918","1919","1929","1933","1939","1945","holocaust"],
      "g9-vietnam-1918-1945":["1919","1930","1930–1931","1936–1939","1939–1945","tháng 8/1945","2/9/1945"],
      "g9-world-1945-1991":["1945","1948","1960","cuba","berlin","1989","1991"],
      "g9-vietnam-1945-1991":["1945","1946","1954","1973","1975","1976","1978–1979","1986","1989","1991"],
      "g9-world-since-1991":["1991","2001","2008","2015","2020","2026","11 august 2026"],
      "g9-vietnam-since-1991":["1991","1995","2007","2026","thành tựu","thách thức"],
    };
    expect([...byRequirement.keys()]).toEqual(Object.keys(required));
    for(const [requirementId,milestones] of Object.entries(required))for(const milestone of milestones)expect(byRequirement.get(requirementId),`${requirementId} must cover ${milestone}`).toContain(milestone);
  });

  it("makes current-update dates, estimates, forecasts, and access dates explicit",()=>{
    const current=grade9Lessons.filter(({currentUpdate})=>currentUpdate);
    expect(current.map(({requirementId})=>requirementId)).toEqual(["g9-world-since-1991","g9-vietnam-since-1991"]);
    const sourceById=new Map(grade9Sources.map((source)=>[source.id,source]));
    for(const lesson of current){
      expect(`${lesson.vi.summary} ${lesson.vi.body}`).toContain("11/08/2026");
      expect(`${lesson.en.summary} ${lesson.en.body}`).toContain("11 August 2026");
      expect(lesson.sourceIds.some((id)=>(sourceById.get(id)?.year??0)>=2025)).toBe(true);
      expect(`${lesson.vi.body} ${lesson.en.body}`.toLowerCase()).toMatch(/ước tính|estimate/);
    }
    const vietnam=current.find(({requirementId})=>requirementId==="g9-vietnam-since-1991")!;
    expect(`${vietnam.vi.body} ${vietnam.en.body}`.toLowerCase()).toMatch(/dự báo|forecast/);
    const database=new Database(databasePath,{readonly:true});
    try{
      const rows=database.prepare("SELECT accessed_at AS accessedAt FROM sources WHERE id IN (SELECT source_id FROM content_sources WHERE content_id IN (?,?))").all(...current.map(({id})=>id)) as Array<{accessedAt:string}>;
      expect(rows.length).toBeGreaterThan(0);expect(rows.every(({accessedAt})=>accessedAt===grade9BatchAsOf)).toBe(true);
    }finally{database.close();}
  });

  it("refuses a manual Grade 9 edit unless the explicit update flag is supplied",()=>{
    const protectedDirectory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-9-protection-"));directories.push(protectedDirectory);
    const protectedPath=join(protectedDirectory,"protected.db");migrateDatabase(protectedPath);successfulSeed(protectedPath);successfulSeed(protectedPath,{GRADE_9_SEED_ONLY:"1"});
    const database=new Database(protectedPath);database.prepare("UPDATE sources SET title=?,updated_at=? WHERE id=?").run("Biên tập thủ công cần giữ nguyên","2026-08-11T12:00:00.000Z","source-g9-wto-vietnam");database.close();
    const rejected=seed(protectedPath,{GRADE_9_SEED_ONLY:"1"});expect(rejected.status).not.toBe(0);expect(rejected.stderr).toContain("Refusing to replace edited Grade 9 row sources.source-g9-wto-vietnam");
    const check=new Database(protectedPath,{readonly:true});try{expect(check.prepare("SELECT title FROM sources WHERE id=?").get("source-g9-wto-vietnam")).toEqual({title:"Biên tập thủ công cần giữ nguyên"});}finally{check.close();}
    expect(successfulSeed(protectedPath,{GRADE_9_SEED_ONLY:"1",ALLOW_GRADE_9_BATCH_UPDATE:"1"})).toEqual(firstBatch);
  },30_000);

  it("rejects combining Grade 9 mode with another seed mode",()=>{
    const rejected=seed(databasePath,{GRADE_9_SEED_ONLY:"1",GRADE_8_SEED_ONLY:"1"});expect(rejected.status).not.toBe(0);expect(rejected.stderr).toContain("GRADE_8_SEED_ONLY, and GRADE_9_SEED_ONLY cannot be combined");
  });
});
