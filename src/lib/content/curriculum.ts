import type {SqliteDatabase} from "@/lib/db/connection";
import {ApiError} from "@/lib/validation/api-error";
import {
  coverageStatuses,curriculumTracks,grades,
  type AdminCurriculumCoverageView,type CoverageStatus,type CurriculumGradeSummary,
  type CurriculumRequirementRef,type CurriculumTrack,type Grade,type Locale,
} from "./types";
import {PublicApiError} from "./validation";

export type CurriculumRequirementRow={
  id:string;grade:Grade;track:CurriculumTrack;topic_vi:string;topic_en:string;
  slug_vi:string;slug_en:string;official_program_ref:string;
  period_start:number|null;period_end:number|null;
  required_outcomes_vi:string;required_outcomes_en:string;
  sort_order:number;programme_as_of:string;
};

export type CurriculumCounts={mappedCount:number;publishedCount:number;verifiedCount:number};

function exactGrade(value:string|null):Grade|undefined{
  if(value===null)return undefined;
  return /^(?:6|7|8|9|10|11|12)$/.test(value)?Number(value) as Grade:undefined;
}

export function publicGrade(value:string|null,required=false):Grade|undefined{
  const grade=exactGrade(value);
  if(value!==null&&grade===undefined)throw new PublicApiError(400,"INVALID_QUERY","Lớp học không hợp lệ.",{fieldErrors:{grade:["Chỉ nhận lớp 6 đến lớp 12."]}});
  if(required&&grade===undefined)throw new PublicApiError(404,"GRADE_NOT_FOUND","Lớp học không tồn tại.");
  return grade;
}

export function adminGrade(value:string|null):Grade|undefined{
  const grade=exactGrade(value);
  if(value!==null&&grade===undefined)throw new ApiError(400,"INVALID_QUERY","Lớp học không hợp lệ.",{fieldErrors:{grade:["Chỉ nhận lớp 6 đến lớp 12."]}});
  return grade;
}

export function publicTrack(value:string|null):CurriculumTrack|undefined{
  if(value===null)return undefined;
  if(!curriculumTracks.includes(value as CurriculumTrack))throw new PublicApiError(400,"INVALID_QUERY","Nhóm chương trình không hợp lệ.",{fieldErrors:{track:["Chỉ nhận MANDATORY hoặc ELECTIVE."]}});
  return value as CurriculumTrack;
}

export function adminTrack(value:string|null):CurriculumTrack|undefined{
  if(value===null)return undefined;
  if(!curriculumTracks.includes(value as CurriculumTrack))throw new ApiError(400,"INVALID_QUERY","Nhóm chương trình không hợp lệ.",{fieldErrors:{track:["Chỉ nhận MANDATORY hoặc ELECTIVE."]}});
  return value as CurriculumTrack;
}

export function requirementRows(database:SqliteDatabase,options:{grade?:Grade;track?:CurriculumTrack}={}):CurriculumRequirementRow[]{
  const conditions:string[]=[];const parameters:Array<number|string>=[];
  if(options.grade!==undefined){conditions.push("grade=?");parameters.push(options.grade);}
  if(options.track){conditions.push("track=?");parameters.push(options.track);}
  const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";
  return database.prepare(`SELECT * FROM curriculum_requirements ${where} ORDER BY grade,CASE track WHEN 'MANDATORY' THEN 0 ELSE 1 END,sort_order,id`).all(...parameters) as CurriculumRequirementRow[];
}

export function curriculumCounts(database:SqliteDatabase,requirementId:string,locale?:Locale):CurriculumCounts{
  const translation=locale
    ?"EXISTS (SELECT 1 FROM content_translations translation WHERE translation.node_id=node.id AND translation.locale=? AND translation.translation_status='PUBLISHED')"
    :"EXISTS (SELECT 1 FROM content_translations translation WHERE translation.node_id=node.id AND translation.translation_status='PUBLISHED')";
  const parameters:unknown[]=locale?[locale,locale,requirementId]:[requirementId];
  return database.prepare(`
    SELECT
      COUNT(DISTINCT mapping.content_id) AS mappedCount,
      COUNT(DISTINCT CASE WHEN node.status='PUBLISHED' AND ${translation} THEN mapping.content_id END) AS publishedCount,
      COUNT(DISTINCT CASE WHEN node.status='PUBLISHED' AND ${translation} AND EXISTS (
        SELECT 1 FROM content_claims claim
        WHERE claim.content_id=mapping.content_id AND claim.verification_status='VERIFIED'
          AND EXISTS (SELECT 1 FROM claim_evidence evidence WHERE evidence.claim_id=claim.id)
          AND NOT EXISTS (
            SELECT 1 FROM claim_evidence evidence
            JOIN sources source ON source.id=evidence.source_id
            WHERE evidence.claim_id=claim.id AND source.verification_status<>'VERIFIED'
          )
      ) THEN mapping.content_id END) AS verifiedCount
    FROM content_curriculum mapping
    JOIN content_nodes node ON node.id=mapping.content_id
    WHERE mapping.requirement_id=?
  `).get(...parameters) as CurriculumCounts;
}

export function coverageStatus(counts:CurriculumCounts):CoverageStatus{
  if(counts.mappedCount===0)return "MISSING";
  if(counts.publishedCount===0)return "DRAFT";
  return counts.verifiedCount>0?"VERIFIED":"PUBLISHED";
}

export function requirementRef(row:CurriculumRequirementRow,counts:CurriculumCounts,locale:Locale):CurriculumRequirementRef{
  return{id:row.id,grade:row.grade,track:row.track,
    topic:locale==="vi"?row.topic_vi:row.topic_en,slug:locale==="vi"?row.slug_vi:row.slug_en,
    officialProgramRef:row.official_program_ref,publishedCount:counts.publishedCount,
    verifiedCount:counts.verifiedCount,coverageStatus:coverageStatus(counts)};
}

export function curriculumRefsForContent(database:SqliteDatabase,contentId:string,locale:Locale):CurriculumRequirementRef[]{
  const rows=database.prepare(`
    SELECT requirement.* FROM curriculum_requirements requirement
    JOIN content_curriculum mapping ON mapping.requirement_id=requirement.id
    WHERE mapping.content_id=?
    ORDER BY requirement.grade,CASE requirement.track WHEN 'MANDATORY' THEN 0 ELSE 1 END,requirement.sort_order,requirement.id
  `).all(contentId) as CurriculumRequirementRow[];
  return rows.map((row)=>requirementRef(row,curriculumCounts(database,row.id,locale),locale));
}

export function curriculumContentIds(database:SqliteDatabase,locale:Locale,grade?:Grade,topic?:string):Set<string>{
  if(grade===undefined&&!topic)return new Set();
  const conditions:string[]=[];const parameters:unknown[]=[];
  if(grade!==undefined){conditions.push("requirement.grade=?");parameters.push(grade);}
  if(topic){conditions.push(locale==="vi"?"requirement.slug_vi=?":"requirement.slug_en=?");parameters.push(topic);}
  return new Set((database.prepare(`
    SELECT DISTINCT mapping.content_id AS id FROM content_curriculum mapping
    JOIN curriculum_requirements requirement ON requirement.id=mapping.requirement_id
    WHERE ${conditions.join(" AND ")} ORDER BY mapping.content_id
  `).all(...parameters) as Array<{id:string}>).map(({id})=>id));
}

export function verifiedCurriculumContentIds(database:SqliteDatabase,locale:Locale):Set<string>{
  return new Set((database.prepare(`
    SELECT DISTINCT mapping.content_id AS id
    FROM content_curriculum mapping
    JOIN content_nodes node ON node.id=mapping.content_id
    JOIN content_translations translation ON translation.node_id=node.id
    WHERE node.status='PUBLISHED' AND translation.locale=? AND translation.translation_status='PUBLISHED'
      AND EXISTS (
        SELECT 1 FROM content_claims claim
        WHERE claim.content_id=mapping.content_id AND claim.verification_status='VERIFIED'
          AND EXISTS (SELECT 1 FROM claim_evidence evidence WHERE evidence.claim_id=claim.id)
          AND NOT EXISTS (
            SELECT 1 FROM claim_evidence evidence
            JOIN sources source ON source.id=evidence.source_id
            WHERE evidence.claim_id=claim.id AND source.verification_status<>'VERIFIED'
          )
      )
    ORDER BY mapping.content_id
  `).all(locale) as Array<{id:string}>).map(({id})=>id));
}

export function programmeAsOf(database:SqliteDatabase):string{
  return (database.prepare("SELECT MAX(programme_as_of) AS value FROM curriculum_requirements").get() as {value:string|null}).value??new Date(0).toISOString();
}

function summary(grade:Grade,label:string,requirements:Array<{counts:CurriculumCounts}>):CurriculumGradeSummary{
  const requirementCount=requirements.length;
  const publishedRequirementCount=requirements.filter(({counts})=>counts.publishedCount>0).length;
  const verifiedRequirementCount=requirements.filter(({counts})=>counts.verifiedCount>0).length;
  return{grade,label,requirementCount,publishedRequirementCount,verifiedRequirementCount,
    fullCoverage:requirementCount>0&&verifiedRequirementCount===requirementCount,
    publishedLessonCount:0};
}

export function getAdminCurriculumCoverage(database:SqliteDatabase,search:URLSearchParams):AdminCurriculumCoverageView{
  const grade=adminGrade(search.get("grade"));
  const track=adminTrack(search.get("track"));
  const requestedStatus=search.get("status");
  if(requestedStatus!==null&&!coverageStatuses.includes(requestedStatus as CoverageStatus))throw new ApiError(400,"INVALID_QUERY","Trạng thái coverage không hợp lệ.");
  const grouped=new Map<Grade,CurriculumRequirementRow[]>();
  for(const row of requirementRows(database,{grade,track}))grouped.set(row.grade,[...(grouped.get(row.grade)??[]),row]);
  const result:AdminCurriculumCoverageView["grades"]=[];
  for(const currentGrade of grades){
    const rows=grouped.get(currentGrade)??[];
    if(!rows.length)continue;
    const measured=rows.map((row)=>({row,counts:curriculumCounts(database,row.id)}));
    const filtered=measured.filter(({counts})=>requestedStatus===null||coverageStatus(counts)===requestedStatus);
    if(requestedStatus!==null&&!filtered.length)continue;
    const gradeSummary=summary(currentGrade,`Lớp ${currentGrade}`,measured);
    const publishedIds=database.prepare(`
      SELECT COUNT(DISTINCT mapping.content_id) AS count FROM content_curriculum mapping
      JOIN curriculum_requirements requirement ON requirement.id=mapping.requirement_id
      JOIN content_nodes node ON node.id=mapping.content_id
      WHERE requirement.grade=? AND node.status='PUBLISHED'
        AND EXISTS (SELECT 1 FROM content_translations translation WHERE translation.node_id=node.id AND translation.translation_status='PUBLISHED')
        ${track?"AND requirement.track=?":""}
    `).get(...(track?[currentGrade,track]:[currentGrade])) as {count:number};
    result.push({...gradeSummary,publishedLessonCount:publishedIds.count,requirements:filtered.map(({row,counts})=>requirementRef(row,counts,"vi"))});
  }
  return{asOf:programmeAsOf(database),grades:result};
}
