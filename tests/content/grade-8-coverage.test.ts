import Database from "better-sqlite3";
import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {grade6Lessons} from "@/data/curriculum/grade-6/content";
import {grade7Lessons} from "@/data/curriculum/grade-7/content";
import {grade8BatchAsOf,grade8Lessons,grade8Sources} from "@/data/curriculum/grade-8/content";
import {migrateDatabase} from "@/lib/db/migrate";
import {getCurriculumGrade,getDetail} from "@/lib/content/public-repository";

const directories:string[]=[];
const directory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-8-"));
directories.push(directory);
const databasePath=join(directory,"grade-8.db");

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
  expect(successfulSeed(databasePath,{GRADE_7_SEED_ONLY:"1"})).toMatchObject({mode:"grade-7-only",lessons:6,mappings:6});
  firstBatch=successfulSeed(databasePath,{
    NODE_ENV:"production",GRADE_8_SEED_ONLY:"1",SEED_ADMIN_PASSWORD:"",SEED_EDITOR_PASSWORD:"",SEED_REVIEWER_PASSWORD:"",
  }) as SeedResult;
  secondBatch=successfulSeed(databasePath,{GRADE_8_SEED_ONLY:"1"}) as SeedResult;
},60_000);

afterAll(()=>{for(const path of directories)rmSync(path,{recursive:true,force:true});});

describe("C-030 Grade 8 curriculum batch",()=>{
  it("keeps the base seed intact, coexists with Grades 6 and 7, and is idempotent",()=>{
    expect(firstBatch).toEqual({
      mode:"grade-8-only",asOf:grade8BatchAsOf,review:"internal-c030-not-historian-council",
      copyright:"citations-only-no-third-party-binaries",lessons:7,translations:14,
      lessonTranslations:14,sources:27,claims:14,evidence:14,mappings:7,
    });
    expect(secondBatch).toEqual(firstBatch);
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes").get()).toEqual({count:71});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_translations").get()).toEqual({count:142});
      expect(database.prepare("SELECT type,COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type").all()).toEqual([
        {type:"ARTIFACT",count:10},{type:"EVENT",count:20},{type:"PERIOD",count:6},
        {type:"PERSON",count:10},{type:"TOPIC",count:25},
      ]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g6-%'").get()).toEqual({count:grade6Lessons.length});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g7-%'").get()).toEqual({count:grade7Lessons.length});
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_nodes WHERE id LIKE 'lesson-g8-%'").get()).toEqual({count:7});
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM content_translations WHERE node_id LIKE 'lesson-g8-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:7},{locale:"vi",count:7}]);
      expect(database.prepare("SELECT locale,COUNT(*) AS count FROM lesson_translations WHERE content_id LIKE 'lesson-g8-%' GROUP BY locale ORDER BY locale").all()).toEqual([{locale:"en",count:7},{locale:"vi",count:7}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM content_curriculum WHERE content_id LIKE 'lesson-g8-%'").get()).toEqual({count:7});
    }finally{database.close();}
  });

  it("publishes all seven mandatory Grade 8 requirements with bilingual grounded lessons",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      const expectedRequirements=grade8Lessons.map(({requirementId})=>requirementId);
      for(const locale of ["vi","en"] as const){
        const grade=getCurriculumGrade(database,locale,"8",new URLSearchParams({track:"MANDATORY",pageSize:"50"})).data;
        expect(grade.summary).toEqual({requirementCount:7,publishedRequirementCount:7,verifiedRequirementCount:7,fullCoverage:true});
        expect(grade.requirements.map(({id})=>id)).toEqual(expectedRequirements);
        expect(grade.requirements.every((item)=>item.coverageStatus==="VERIFIED"&&item.publishedCount>0&&item.verifiedCount>0)).toBe(true);
        for(const lesson of grade8Lessons){
          const requirement=grade.requirements.find(({id})=>id===lesson.requirementId)!;
          expect(requirement.lessons.map(({id})=>id)).toContain(lesson.id);
          const localized=lesson[locale];
          const detail=getDetail(database,locale,"TOPIC",localized.slug).data;
          expect(detail).toMatchObject({
            id:lesson.id,title:localized.title,asOf:grade8BatchAsOf,reviewedBy:expect.stringContaining("C-030"),
            lesson:{learningObjectives:localized.learningObjectives,originalSummary:localized.originalSummary,analysis:localized.analysis,debates:localized.debates},
          });
          expect(detail.sources.map(({id})=>id)).toEqual(lesson.sourceIds);
          expect(detail.sources.every((source)=>source.verificationStatus==="VERIFIED"&&source.verifiedBy==="Kiểm duyệt viên"&&source.verificationNote?.includes("không phải xác nhận của Hội đồng sử học"))).toBe(true);
          expect(detail.claims).toHaveLength(2);
          expect(detail.claims.every((claim)=>claim.statement.trim().length>0&&claim.evidence.length===1&&claim.evidence[0].locator.trim().length>0&&claim.evidence[0].quote===null&&claim.evidence[0].source.verificationStatus==="VERIFIED")).toBe(true);
          expect(detail.media).toEqual([]);
        }
      }
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM sources WHERE id LIKE 'source-g8-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:27}]);
      expect(database.prepare("SELECT verification_status,COUNT(*) AS count FROM content_claims WHERE id LIKE 'claim-g8-%' GROUP BY verification_status").all()).toEqual([{verification_status:"VERIFIED",count:14}]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM claim_evidence WHERE claim_id LIKE 'claim-g8-%' AND quote IS NULL").get()).toEqual({count:14});
    }finally{database.close();}
  });

  it("keeps institutional material citation-only and the bilingual prose original",()=>{
    const database=new Database(databasePath,{readonly:true});
    try{
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM content_media
        WHERE content_id IN (SELECT id FROM content_nodes WHERE id LIKE 'lesson-g8-%')
      `).get()).toEqual({count:0});
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM media
        WHERE id LIKE 'media-g8-%' OR url IN (SELECT url FROM sources WHERE id LIKE 'source-g8-%')
      `).get()).toEqual({count:0});
      expect(database.prepare(`
        SELECT COUNT(*) AS count FROM sources
        WHERE id LIKE 'source-g8-%' AND url LIKE 'https://%'
          AND citation_note LIKE '%không tải hoặc sao chép tệp nhị phân%'
          AND archived_url IS NULL AND checksum IS NULL
      `).get()).toEqual({count:27});
    }finally{database.close();}

    const prose=grade8Lessons.flatMap((lesson)=>[lesson.vi.body,lesson.vi.analysis,lesson.en.body,lesson.en.analysis]).join("\n").toLocaleLowerCase("vi");
    const copiedSourceFixtures=[
      "the declaration of independence states the principles on which our government",
      "the cities and ports of melaka and george town are the products of 500 years",
      "steam has been the driving force behind british industry for 300 years",
      "đây là thời kỳ dài phát triển, trải qua các triều đại",
      "có thể coi đây là thắng lợi lớn và duy nhất ở mặt trận đà nẵng",
      "huệ tiếng nói như chuông, mắt lập loè như ánh điện",
    ];
    for(const fixture of copiedSourceFixtures)expect(prose).not.toContain(fixture);
    for(const lesson of grade8Lessons){
      expect(lesson.vi.body.length).toBeGreaterThan(1000);expect(lesson.en.body.length).toBeGreaterThan(1000);
      expect(lesson.vi.body).not.toBe(lesson.en.body);
      expect(lesson.vi.analysis.length).toBeGreaterThan(300);expect(lesson.en.analysis.length).toBeGreaterThan(300);
    }
    expect(new Set(grade8Sources.map(({url})=>url)).size).toBe(27);
  });

  it("covers the full declared periods and required outcomes rather than token endpoints",()=>{
    const byRequirement=new Map(grade8Lessons.map((lesson)=>[lesson.requirementId,`${lesson.vi.body}\n${lesson.en.body}`.toLocaleLowerCase("vi")]));
    const requiredMilestones:Record<string,string[]>={
      "g8-early-modern-revolutions":["1566","1648","1688","1776","1789","1848","1871","quyền","rights"],
      "g8-industrial-revolution":["1750","1833","1914","hơi nước","steam","đô thị","towns"],
      "g8-southeast-asia-sixteenth-nineteenth":["1511","1807","1851","1898","1900","bồ đào nha","portugal","pháp","france"],
      "g8-vietnam-sixteenth-eighteenth":["1527","1533","1592","1771","1785","1789","1802","đàng trong","dang trong"],
      "g8-vietnam-nguyen-dynasty":["1802","1830","1858","khai hoang","reclamation","văn hóa","culture"],
      "g8-vietnam-anti-colonial-1858-1884":["1858","1859","1862","1873","1883","1884","đà nẵng","da nang"],
      "g8-vietnam-1885-1918":["1885","1896","1905","1907","1911","1913","1918","cần vương","can vuong","yên thế","yen the"],
    };
    expect([...byRequirement.keys()]).toEqual(Object.keys(requiredMilestones));
    for(const [requirementId,milestones] of Object.entries(requiredMilestones)){
      const body=byRequirement.get(requirementId)!;
      for(const milestone of milestones)expect(body,`${requirementId} must cover ${milestone}`).toContain(milestone);
    }
  });

  it("refuses a manual Grade 8 edit unless the explicit update flag is supplied",()=>{
    const protectedDirectory=mkdtempSync(join(tmpdir(),"quan-su-viet-grade-8-protection-"));
    directories.push(protectedDirectory);
    const protectedPath=join(protectedDirectory,"protected.db");
    migrateDatabase(protectedPath);successfulSeed(protectedPath);successfulSeed(protectedPath,{GRADE_8_SEED_ONLY:"1"});
    const database=new Database(protectedPath);
    database.prepare("UPDATE sources SET title=?,updated_at=? WHERE id=?").run("Biên tập thủ công cần giữ nguyên","2026-08-11T12:00:00.000Z","source-g8-vnmh-dong-kinh");
    database.close();
    const rejected=seed(protectedPath,{GRADE_8_SEED_ONLY:"1"});
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("Refusing to replace edited Grade 8 row sources.source-g8-vnmh-dong-kinh");
    const check=new Database(protectedPath,{readonly:true});
    try{expect(check.prepare("SELECT title FROM sources WHERE id=?").get("source-g8-vnmh-dong-kinh")).toEqual({title:"Biên tập thủ công cần giữ nguyên"});}
    finally{check.close();}
    expect(successfulSeed(protectedPath,{GRADE_8_SEED_ONLY:"1",ALLOW_GRADE_8_BATCH_UPDATE:"1"})).toEqual(firstBatch);
  },30_000);

  it("rejects combining Grade 8 batch mode with another seed mode",()=>{
    const rejected=seed(databasePath,{GRADE_8_SEED_ONLY:"1",GRADE_7_SEED_ONLY:"1"});
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("GRADE_7_SEED_ONLY, and GRADE_8_SEED_ONLY cannot be combined");
  });
});
