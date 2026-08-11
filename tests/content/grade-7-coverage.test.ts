import Database from "better-sqlite3";
import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {grade6Lessons} from "@/data/curriculum/grade-6/content";
import {grade7BatchAsOf,grade7Lessons,grade7Sources} from "@/data/curriculum/grade-7/content";
import {migrateDatabase} from "@/lib/db/migrate";
import {getCurriculumGrade,getDetail} from "@/lib/content/public-repository";

const directories:string[]=[];
const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-7-"));
directories.push(directory);
const databasePath=join(directory,"grade-7.db");

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
  expect(successfulSeed(databasePath,{GRADE_6_SEED_ONLY:"1"})).toMatchObject({mode:"grade-6-only",lessons:8,mappings:8});
  firstBatch=successfulSeed(databasePath,{
    NODE_ENV:"production",GRADE_7_SEED_ONLY:"1",SEED_ADMIN_PASSWORD:"",SEED_EDITOR_PASSWORD:"",SEED_REVIEWER_PASSWORD:"",
  }) as SeedResult;
  secondBatch=successfulSeed(databasePath,{GRADE_7_SEED_ONLY:"1"}) as SeedResult;
},45_000);

afterAll(()=>{for(const path of directories)rmSync(path,{recursive:true,force:true});});

describe("C-029 Grade 7 curriculum batch",()=>{
  it("coexists with Grade 6, is deterministic and is idempotent",()=>{
    expect(firstBatch).toEqual({
      mode:"grade-7-only",asOf:grade7BatchAsOf,review:"internal-c029-not-historian-council",
      copyright:"citations-only-no-third-party-binaries",lessons:6,translations:12,
      lessonTranslations:12,sources:18,claims:12,evidence:12,mappings:6,
    });
    expect(secondBatch).toEqual(firstBatch);
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes").get()).toEqual({count:64});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_translations").get()).toEqual({count:128});
      expect(database.prepare("SELECT type,COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type").all()).toEqual([
        {type:"ARTIFACT",count:10},{type:"EVENT",count:20},{type:"PERIOD",count:6},
        {type:"PERSON",count:10},{type:"TOPIC",count:18},
      ]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g6-%'").get()).toEqual({count:grade6Lessons.length});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g7-%'").get()).toEqual({count:6});
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM content_translations WHERE node_id LIKE 'lesson-g7-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:6},{locale:"vi",count:6}]);
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM lesson_translations WHERE content_id LIKE 'lesson-g7-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:6},{locale:"vi",count:6}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_curriculum WHERE content_id LIKE 'lesson-g7-%'").get()).toEqual({count:6});
    }finally{database.close();}
  });

  it("publishes every mandatory Grade 7 requirement with bilingual lessons and grounded claims",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      const expectedRequirements=grade7Lessons.map(({requirementId})=>requirementId);
      for(const locale of ["vi","en"] as const){
        const grade=getCurriculumGrade(database,locale,"7",new URLSearchParams({track:"MANDATORY",pageSize:"50"})).data;
        expect(grade.summary).toEqual({requirementCount:6,publishedRequirementCount:6,verifiedRequirementCount:6,fullCoverage:true});
        expect(grade.requirements.map(({id})=>id)).toEqual(expectedRequirements);
        expect(grade.requirements.every((item)=>item.coverageStatus==="VERIFIED"&&item.publishedCount>0&&item.verifiedCount>0)).toBe(true);
        for(const lesson of grade7Lessons){
          const requirement=grade.requirements.find(({id})=>id===lesson.requirementId)!;
          expect(requirement.lessons.map(({id})=>id)).toContain(lesson.id);
          const localized=lesson[locale];
          const detail=getDetail(database,locale,"TOPIC",localized.slug).data;
          expect(detail).toMatchObject({
            id:lesson.id,title:localized.title,asOf:grade7BatchAsOf,reviewedBy:expect.stringContaining("C-029"),
            lesson:{learningObjectives:localized.learningObjectives,originalSummary:localized.originalSummary,analysis:localized.analysis,debates:localized.debates},
          });
          expect(detail.sources.map(({id})=>id)).toEqual(lesson.sourceIds);
          expect(detail.sources.every((source)=>source.verificationStatus==="VERIFIED"&&source.verifiedBy==="Kiểm duyệt viên"&&source.verificationNote?.includes("không phải xác nhận của Hội đồng sử học"))).toBe(true);
          expect(detail.claims).toHaveLength(2);
          expect(detail.claims.every((claim)=>claim.statement.trim().length>0&&claim.evidence.length===1&&claim.evidence[0].locator.trim().length>0&&claim.evidence[0].quote===null&&claim.evidence[0].source.verificationStatus==="VERIFIED")).toBe(true);
          expect(detail.media).toEqual([]);
        }
      }
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM sources WHERE id LIKE 'source-g7-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:18}]);
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM content_claims WHERE id LIKE 'claim-g7-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:12}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM claim_evidence WHERE claim_id LIKE 'claim-g7-%' AND quote IS NULL").get()).toEqual({count:12});
    }finally{database.close();}
  });

  it("keeps institutional sources citation-only and protects original prose",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM content_media
        WHERE content_id IN (SELECT id FROM content_nodes WHERE id LIKE 'lesson-g7-%')
      `).get()).toEqual({count:0});
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM media
        WHERE id LIKE 'media-g7-%' OR url IN (SELECT url FROM sources WHERE id LIKE 'source-g7-%')
      `).get()).toEqual({count:0});
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM sources
        WHERE id LIKE 'source-g7-%' AND url LIKE 'https://%'
          AND citation_note LIKE '%không tải hoặc sao chép tệp nhị phân%'
          AND archived_url IS NULL AND checksum IS NULL
      `).get()).toEqual({count:18});
    }finally{database.close();}

    const prose=grade7Lessons.flatMap((lesson)=>[lesson.vi.body,lesson.vi.analysis,lesson.en.body,lesson.en.analysis]).join("\n").toLocaleLowerCase("vi");
    const copiedSourceFixtures=[
      "from the ninth to the early eleventh centuries, invasions of the magyars",
      "marked by strong and benevolent rule, successful diplomatic relationships",
      "the movement luther initiated spread and grew in popularity",
      "the property represents the entire range of khmer art",
      "những thành công trong xây dựng đất nước, trong công cuộc dẹp thù trong",
      "triều hồ tồn tại 7 năm, trải qua hai đời vua",
    ];
    for(const fixture of copiedSourceFixtures)expect(prose).not.toContain(fixture);
    for(const lesson of grade7Lessons){
      expect(lesson.vi.body.length).toBeGreaterThan(600);expect(lesson.en.body.length).toBeGreaterThan(600);
      expect(lesson.vi.body).not.toBe(lesson.en.body);
      expect(lesson.vi.analysis.length).toBeGreaterThan(250);expect(lesson.en.analysis.length).toBeGreaterThan(250);
    }
    expect(new Set(grade7Sources.map(({url})=>url)).size).toBe(18);
  });

  it("refuses a manual edit unless an explicit Grade 7 update flag is supplied",()=>{
    const protectedDirectory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-7-protection-"));
    directories.push(protectedDirectory);
    const protectedPath=join(protectedDirectory,"protected.db");
    migrateDatabase(protectedPath);successfulSeed(protectedPath);successfulSeed(protectedPath,{GRADE_6_SEED_ONLY:"1"});successfulSeed(protectedPath,{GRADE_7_SEED_ONLY:"1"});
    const database=new Database(protectedPath);
    database.prepare("UPDATE sources SET title=?,updated_at=? WHERE id=?").run("Biên tập thủ công cần giữ nguyên","2026-08-11T12:00:00.000Z","source-g7-vnmh-lam-kinh");
    database.close();
    const rejected=seed(protectedPath,{GRADE_7_SEED_ONLY:"1"});
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("Refusing to replace edited Grade 7 row sources.source-g7-vnmh-lam-kinh");
    const check=new Database(protectedPath,{readonly:true});
    try{expect(check.prepare("SELECT title FROM sources WHERE id=?").get("source-g7-vnmh-lam-kinh")).toEqual({title:"Biên tập thủ công cần giữ nguyên"});}
    finally{check.close();}
    expect(successfulSeed(protectedPath,{GRADE_7_SEED_ONLY:"1",ALLOW_GRADE_7_BATCH_UPDATE:"1"})).toEqual(firstBatch);
  },25_000);
});
