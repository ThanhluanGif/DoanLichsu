import { openDatabase } from "../src/lib/db/connection";
import { migrateDatabase } from "../src/lib/db/migrate";
import { demoContent, demoTags, unpublishedEnglishNodeId } from "../src/data/demo-content";
import { normalizeSearchText } from "../src/lib/search/normalize";
import { readEnv } from "../src/lib/env";
import { hashPassword } from "../src/lib/auth/password";
import { curriculumMappings,curriculumProgrammeAsOf,curriculumRequirements } from "../src/data/curriculum/requirements";
import { grade6BatchAsOf,grade6Lessons,grade6Sources } from "../src/data/curriculum/grade-6/content";
import { grade7BatchAsOf,grade7Lessons,grade7Sources } from "../src/data/curriculum/grade-7/content";
import { grade8BatchAsOf,grade8Lessons,grade8Sources } from "../src/data/curriculum/grade-8/content";
import { grade9BatchAsOf,grade9Lessons,grade9Sources } from "../src/data/curriculum/grade-9/content";

const curriculumOnly=process.env.CURRICULUM_SEED_ONLY==="1";
const grade6Only=process.env.GRADE_6_SEED_ONLY==="1";
const allowGrade6Update=process.env.ALLOW_GRADE_6_BATCH_UPDATE==="1";
const grade7Only=process.env.GRADE_7_SEED_ONLY==="1";
const allowGrade7Update=process.env.ALLOW_GRADE_7_BATCH_UPDATE==="1";
const grade8Only=process.env.GRADE_8_SEED_ONLY==="1";
const allowGrade8Update=process.env.ALLOW_GRADE_8_BATCH_UPDATE==="1";
const grade9Only=process.env.GRADE_9_SEED_ONLY==="1";
const allowGrade9Update=process.env.ALLOW_GRADE_9_BATCH_UPDATE==="1";

const selectedSeedModes=[
  ["CURRICULUM_SEED_ONLY",curriculumOnly],
  ["GRADE_6_SEED_ONLY",grade6Only],
  ["GRADE_7_SEED_ONLY",grade7Only],
  ["GRADE_8_SEED_ONLY",grade8Only],
  ["GRADE_9_SEED_ONLY",grade9Only],
] as const;
const enabledSeedModes=selectedSeedModes.filter(([,enabled])=>enabled).map(([name])=>name);
if(enabledSeedModes.length>1){
  throw new Error(`${enabledSeedModes.join(", and ")} cannot be combined.`);
}

if (process.env.NODE_ENV === "production"&&!curriculumOnly&&!grade6Only&&!grade7Only&&!grade8Only&&!grade9Only) {
  if (process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error("Refusing to replace production content without ALLOW_DEMO_SEED=1.");
  }
  for (const name of ["SEED_ADMIN_PASSWORD", "SEED_EDITOR_PASSWORD", "SEED_REVIEWER_PASSWORD"] as const) {
    const password = process.env[name];
    if (!password || password.length < 16 || /Demo-2026|replace-with|change-me/i.test(password)) {
      throw new Error(`${name} must be an explicit non-demo password of at least 16 characters in production.`);
    }
  }
}

const { databasePath } = readEnv();
migrateDatabase(databasePath);
const database = openDatabase(databasePath);
const now = "2026-08-06T00:00:00.000Z";
const allowReplacement = process.env.ALLOW_DEMO_SEED === "1";
const demoUsers = [
  { id: "user-admin", email: "admin@quansuviet.local", displayName: "Quản trị viên", role: "ADMIN", password: process.env.SEED_ADMIN_PASSWORD ?? "Admin-Demo-2026!" },
  { id: "user-editor", email: "editor@quansuviet.local", displayName: "Biên tập viên", role: "EDITOR", password: process.env.SEED_EDITOR_PASSWORD ?? "Editor-Demo-2026!" },
  { id: "user-reviewer", email: "reviewer@quansuviet.local", displayName: "Kiểm duyệt viên", role: "REVIEWER", password: process.env.SEED_REVIEWER_PASSWORD ?? "Reviewer-Demo-2026!" },
] as const;
const passwordHashes:Map<string,string>=curriculumOnly||grade6Only||grade7Only||grade8Only||grade9Only
  ?new Map()
  :new Map(await Promise.all(demoUsers.map(async(user)=>[user.id,await hashPassword(user.password)] as const)));

const englishLocations: Record<string, string> = {
  "Biên giới Tây Nam": "Southwestern border",
  "Biên giới phía Bắc": "Northern border",
  "Bắc Bộ": "Northern Vietnam",
  "Bắc Giang": "Bac Giang",
  "Cao Bằng–Lạng Sơn": "Cao Bang–Lang Son",
  "Hà Giang": "Ha Giang",
  "Hà Nội và toàn quốc": "Hanoi and nationwide",
  "Hà Nội, Hải Phòng": "Hanoi and Hai Phong",
  "Nhiều đô thị miền Nam": "Multiple cities in southern Vietnam",
  "Như Nguyệt": "Nhu Nguyet River",
  "Sài Gòn–Gia Định": "Saigon–Gia Dinh",
  "Sông Bạch Đằng": "Bach Dang River",
  "Thanh Hóa và Bắc Bộ": "Thanh Hoa and northern Vietnam",
  "Thăng Long": "Thang Long",
  "Trường Sơn": "Truong Son range",
  "Điện Biên": "Dien Bien",
  "Đà Nẵng": "Da Nang",
};
const englishResults: Record<string, string> = {
  "Chấm dứt thời kỳ Bắc thuộc kéo dài": "Ended the prolonged period of Chinese rule",
  "Tập đoàn cứ điểm Pháp bị đánh bại": "The French fortified position was defeated",
};
const englishRoles: Record<string, string> = {
  "Chỉ huy quân sự, quân vương": "Military commander and ruler",
  "Chủ tịch nước": "President",
  "Hoàng đế, chỉ huy quân sự": "Emperor and military commander",
  "Lãnh tụ Cần Vương": "Leader of the Can Vuong movement",
  "Lãnh tụ khởi nghĩa, hoàng đế": "Uprising leader and emperor",
  "Lãnh đạo khởi nghĩa": "Uprising leader",
  "Phó tư lệnh": "Deputy commander",
  "Quốc công Tiết chế": "Supreme commander",
  "Thủ lĩnh nghĩa quân": "Insurgent leader",
  "Đại tướng, Tổng tư lệnh": "General and commander-in-chief",
};
const englishMetadataValues: Record<string, string> = {
  "Bảo tàng Chiến thắng Điện Biên Phủ": "Dien Bien Phu Victory Museum",
  "Bảo tàng Lịch sử Quân sự Việt Nam": "Vietnam Military History Museum",
  "Bảo tàng lịch sử": "History museum",
  "Bảo tàng Đường Hồ Chí Minh": "Ho Chi Minh Trail Museum",
  "Di tích thành Điện Hải": "Dien Hai Citadel historic site",
  "Di tích": "Historic site",
  "Gỗ": "Wood",
  "Hạ tầng hậu cần": "Logistics infrastructure",
  "Kim loại": "Metal",
  "Kho lưu trữ bảo tàng": "Museum archive",
  "Khu di tích Bạch Đằng": "Bach Dang historic site",
  "Khu di tích lịch sử địa đạo Củ Chi": "Cu Chi Tunnels historic site",
  "Máy bay": "Aircraft",
  "Mô hình thuyền chiến": "War-boat model",
  "Phương tiện hậu cần": "Logistics vehicle",
  "Quân kỳ": "Military flag",
  "Tài liệu lưu trữ": "Archival document",
  "Xe tăng": "Tank",
};

function englishValue(value: string | undefined, dictionary: Record<string, string>) {
  return value ? dictionary[value] ?? value : null;
}

function englishMetadata(metadata: Record<string, string> | undefined) {
  if (!metadata) return null;
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, englishMetadataValues[value] ?? value]),
  );
}

function sourceGovernance(url: string, publisher: string) {
  if (url.includes("btlsqsvn.mod.gov.vn") || url.includes("vnmh.com.vn")) {
    return { sourceType: "MUSEUM_CATALOG", qualityTier: "TIER_2_INSTITUTIONAL", institution: publisher };
  }
  if (url.includes("whc.unesco.org")) {
    return { sourceType: "ARCHIVE_CATALOG", qualityTier: "TIER_2_INSTITUTIONAL", institution: publisher };
  }
  if (url.includes("iwm.org.uk")) {
    return { sourceType: "REFERENCE_WORK", qualityTier: "TIER_2_INSTITUTIONAL", institution: publisher };
  }
  if (url.includes("britannica.com")) {
    return { sourceType: "REFERENCE_WORK", qualityTier: "TIER_4_CONTEXTUAL", institution: publisher };
  }
  return { sourceType: "DISCOVERY_ONLY", qualityTier: "TIER_5_DISCOVERY", institution: publisher };
}

function assertOnlyDemoData(): void {
  if (allowReplacement) return;
  const expected: Record<string, Set<string>> = {
    content_nodes: new Set(demoContent.map(({ id }) => id)),
    content_translations: new Set(demoContent.flatMap(({ id }) => [`${id}-vi`, `${id}-en`])),
    sources: new Set(demoContent.map(({ id }) => `source-${id}`)),
    media: new Set(demoContent.filter(({ type }) => type === "ARTIFACT").map(({ id }) => `media-${id}`)),
    tags: new Set(demoTags.map(({ id }) => id)),
    users: new Set(demoUsers.map(({ id }) => id)),
    curriculum_requirements: new Set(curriculumRequirements.map(({ id }) => id)),
  };
  for (const [table, expectedIds] of Object.entries(expected)) {
    const rows = database.prepare(`SELECT id FROM ${table}`).all() as Array<{ id: string }>;
    const unknown = rows.find(({ id }) => !expectedIds.has(id));
    if (unknown) {
      throw new Error(`Refusing to replace non-demo row ${table}.${unknown.id}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
    }
  }
  const expectedMappings=new Set(curriculumMappings.map(({contentId,requirementId})=>`${contentId}|${requirementId}`));
  const unknownMapping=(database.prepare("SELECT content_id AS contentId,requirement_id AS requirementId FROM content_curriculum").all() as Array<{contentId:string;requirementId:string}>).find(({contentId,requirementId})=>!expectedMappings.has(`${contentId}|${requirementId}`));
  if(unknownMapping)throw new Error(`Refusing to replace non-demo curriculum mapping ${unknownMapping.contentId}|${unknownMapping.requirementId}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
  for (const table of ["content_nodes", "content_translations", "sources", "media", "users", "curriculum_requirements"]) {
    const changed = database.prepare(
      `SELECT id FROM ${table} WHERE updated_at <> ? LIMIT 1`,
    ).get(now) as { id: string } | undefined;
    if (changed) {
      throw new Error(`Refusing to replace edited demo row ${table}.${changed.id}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
    }
  }
  for (const table of ["audit_logs", "login_rate_limits"]) {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
    if (row.count > 0) throw new Error(`Refusing to erase ${table}; set ALLOW_DEMO_SEED=1 to reset explicitly.`);
  }
}

const grade6LessonIds=grade6Lessons.map(({id})=>id);
const grade6SourceIds=grade6Sources.map(({id})=>id);
const grade6Claims=grade6Lessons.flatMap(({id,claims})=>claims.map((claim)=>({...claim,contentId:id})));
const grade6ClaimIds=grade6Claims.map(({id})=>id);
const grade6RequirementIds=grade6Lessons.map(({requirementId})=>requirementId);
const grade6ReviewerVi="Kiểm duyệt nội bộ C-028 (chưa thay thế Hội đồng sử học)";
const grade6ReviewerEn="C-028 internal editorial review (not a substitute for the future historian council)";
const grade6VerificationNote="Kiểm tra biên tập nội bộ C-028; trạng thái này không phải xác nhận của Hội đồng sử học độc lập.";

function assertUniqueGrade6Ids(values:string[],label:string){
  if(new Set(values).size!==values.length)throw new Error(`Grade 6 batch has duplicate ${label} ids.`);
}

function assertGrade6BatchDefinition(){
  assertUniqueGrade6Ids(grade6LessonIds,"lesson");
  assertUniqueGrade6Ids(grade6SourceIds,"source");
  assertUniqueGrade6Ids(grade6ClaimIds,"claim");
  assertUniqueGrade6Ids(grade6RequirementIds,"requirement");
  if(grade6Lessons.length!==8||grade6Claims.length!==16||grade6Sources.length!==8){
    throw new Error(`Grade 6 batch invariant failed: ${JSON.stringify({lessons:grade6Lessons.length,claims:grade6Claims.length,sources:grade6Sources.length})}`);
  }
  const sourceIds=new Set(grade6SourceIds);
  for(const lesson of grade6Lessons){
    const lessonClaimIds=new Set(lesson.claims.map(({id})=>id));
    if(!lesson.sourceIds.length)throw new Error(`Grade 6 lesson ${lesson.id} has no source.`);
    for(const sourceId of lesson.sourceIds)if(!sourceIds.has(sourceId))throw new Error(`Grade 6 lesson ${lesson.id} references unknown source ${sourceId}.`);
    for(const claim of lesson.claims)if(!lesson.sourceIds.includes(claim.sourceId))throw new Error(`Grade 6 claim ${claim.id} uses a source not attached to ${lesson.id}.`);
    for(const locale of [lesson.vi,lesson.en])for(const debate of locale.debates){
      for(const claimId of debate.claimIds)if(!lessonClaimIds.has(claimId))throw new Error(`Grade 6 debate in ${lesson.id} references unknown claim ${claimId}.`);
    }
  }
}

function assertGrade6Prerequisites(){
  const requiredUsers=[
    {id:"user-admin",role:"ADMIN"},
    {id:"user-editor",role:"EDITOR"},
    {id:"user-reviewer",role:"REVIEWER"},
  ];
  for(const expected of requiredUsers){
    const row=database.prepare("SELECT role,active FROM users WHERE id=?").get(expected.id) as {role:string;active:number}|undefined;
    if(!row||row.role!==expected.role||row.active!==1)throw new Error(`Grade 6 batch requires active ${expected.id} with role ${expected.role}; run the base seed first.`);
  }
  for(const id of grade6RequirementIds){
    const row=database.prepare("SELECT grade,track FROM curriculum_requirements WHERE id=?").get(id) as {grade:number;track:string}|undefined;
    if(!row||row.grade!==6||row.track!=="MANDATORY")throw new Error(`Grade 6 batch requires mandatory curriculum requirement ${id}; run the curriculum seed first.`);
  }
}

function assertGrade6BatchCanReplace(){
  if(allowGrade6Update)return;
  const knownTranslations=new Set(grade6LessonIds.flatMap((id)=>[`${id}-vi`,`${id}-en`]));
  const knownClaims=new Set(grade6ClaimIds);
  const expectedSourcesByLesson=new Map(grade6Lessons.map((lesson)=>[lesson.id,new Set(lesson.sourceIds)]));
  const expectedRequirementByLesson=new Map(grade6Lessons.map((lesson)=>[lesson.id,lesson.requirementId]));
  for(const lessonId of grade6LessonIds){
    const node=database.prepare("SELECT updated_at AS updatedAt FROM content_nodes WHERE id=?").get(lessonId) as {updatedAt:string}|undefined;
    if(node&&node.updatedAt!==grade6BatchAsOf)throw new Error(`Refusing to replace edited Grade 6 row content_nodes.${lessonId}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_translations WHERE node_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownTranslations.has(row.id)||row.updatedAt!==grade6BatchAsOf)throw new Error(`Refusing to replace edited Grade 6 row content_translations.${row.id}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_claims WHERE content_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownClaims.has(row.id)||row.updatedAt!==grade6BatchAsOf)throw new Error(`Refusing to replace edited Grade 6 row content_claims.${row.id}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT locale,as_of AS asOf,reviewed_at AS reviewedAt FROM lesson_translations WHERE content_id=?").all(lessonId) as Array<{locale:string;asOf:string;reviewedAt:string}>){
      if(!["vi","en"].includes(row.locale)||row.asOf!==grade6BatchAsOf||row.reviewedAt!==grade6BatchAsOf)throw new Error(`Refusing to replace edited Grade 6 lesson translation ${lessonId}|${row.locale}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
    }
    const expectedSources=expectedSourcesByLesson.get(lessonId)!;
    for(const row of database.prepare("SELECT source_id AS sourceId,sort_order AS sortOrder FROM content_sources WHERE content_id=?").all(lessonId) as Array<{sourceId:string;sortOrder:number}>){
      const expectedSort=grade6Lessons.find(({id})=>id===lessonId)!.sourceIds.indexOf(row.sourceId);
      if(!expectedSources.has(row.sourceId)||row.sortOrder!==expectedSort)throw new Error(`Refusing to erase a manually attached source from ${lessonId}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT requirement_id AS requirementId,as_of AS asOf,mapped_at AS mappedAt FROM content_curriculum WHERE content_id=?").all(lessonId) as Array<{requirementId:string;asOf:string|null;mappedAt:string}>){
      if(row.requirementId!==expectedRequirementByLesson.get(lessonId)||row.asOf!==grade6BatchAsOf||row.mappedAt!==grade6BatchAsOf)throw new Error(`Refusing to erase a manually edited curriculum mapping from ${lessonId}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
    }
    const attached=(database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM content_tags WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_media WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_relations WHERE content_id=? OR related_id=?) AS count
    `).get(lessonId,lessonId,lessonId,lessonId) as {count:number}).count;
    if(attached)throw new Error(`Refusing to erase manually attached tags, media, or relations from ${lessonId}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
  }
  for(const sourceId of grade6SourceIds){
    const row=database.prepare("SELECT updated_at AS updatedAt FROM sources WHERE id=?").get(sourceId) as {updatedAt:string}|undefined;
    if(row&&row.updatedAt!==grade6BatchAsOf)throw new Error(`Refusing to replace edited Grade 6 row sources.${sourceId}; set ALLOW_GRADE_6_BATCH_UPDATE=1 to update explicitly.`);
  }
}

function grade6Count(table:string,column:string,ids:string[]){
  const placeholders=ids.map(()=>"?").join(",");
  return(database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} IN (${placeholders})`).get(...ids) as {count:number}).count;
}

const grade7LessonIds=grade7Lessons.map(({id})=>id);
const grade7SourceIds=grade7Sources.map(({id})=>id);
const grade7Claims=grade7Lessons.flatMap(({id,claims})=>claims.map((claim)=>({...claim,contentId:id})));
const grade7ClaimIds=grade7Claims.map(({id})=>id);
const grade7RequirementIds=grade7Lessons.map(({requirementId})=>requirementId);
const grade7ReviewerVi="Kiểm duyệt nội bộ C-029 (chưa thay thế Hội đồng sử học)";
const grade7ReviewerEn="C-029 internal editorial review (not a substitute for the future historian council)";
const grade7VerificationNote="Kiểm tra biên tập nội bộ C-029; trạng thái này không phải xác nhận của Hội đồng sử học độc lập.";

function assertUniqueGrade7Ids(values:string[],label:string){
  if(new Set(values).size!==values.length)throw new Error(`Grade 7 batch has duplicate ${label} ids.`);
}

function assertGrade7BatchDefinition(){
  assertUniqueGrade7Ids(grade7LessonIds,"lesson");
  assertUniqueGrade7Ids(grade7SourceIds,"source");
  assertUniqueGrade7Ids(grade7ClaimIds,"claim");
  assertUniqueGrade7Ids(grade7RequirementIds,"requirement");
  if(grade7Lessons.length!==6||grade7Claims.length!==12||grade7Sources.length!==18){
    throw new Error(`Grade 7 batch invariant failed: ${JSON.stringify({lessons:grade7Lessons.length,claims:grade7Claims.length,sources:grade7Sources.length})}`);
  }
  const sourceIds=new Set(grade7SourceIds);
  for(const lesson of grade7Lessons){
    const lessonClaimIds=new Set(lesson.claims.map(({id})=>id));
    if(!lesson.sourceIds.length)throw new Error(`Grade 7 lesson ${lesson.id} has no source.`);
    for(const sourceId of lesson.sourceIds)if(!sourceIds.has(sourceId))throw new Error(`Grade 7 lesson ${lesson.id} references unknown source ${sourceId}.`);
    for(const claim of lesson.claims)if(!lesson.sourceIds.includes(claim.sourceId))throw new Error(`Grade 7 claim ${claim.id} uses a source not attached to ${lesson.id}.`);
    for(const locale of [lesson.vi,lesson.en])for(const debate of locale.debates){
      for(const claimId of debate.claimIds)if(!lessonClaimIds.has(claimId))throw new Error(`Grade 7 debate in ${lesson.id} references unknown claim ${claimId}.`);
    }
  }
}

function assertGrade7Prerequisites(){
  const requiredUsers=[
    {id:"user-admin",role:"ADMIN"},
    {id:"user-editor",role:"EDITOR"},
    {id:"user-reviewer",role:"REVIEWER"},
  ];
  for(const expected of requiredUsers){
    const row=database.prepare("SELECT role,active FROM users WHERE id=?").get(expected.id) as {role:string;active:number}|undefined;
    if(!row||row.role!==expected.role||row.active!==1)throw new Error(`Grade 7 batch requires active ${expected.id} with role ${expected.role}; run the base seed first.`);
  }
  for(const id of grade7RequirementIds){
    const row=database.prepare("SELECT grade,track FROM curriculum_requirements WHERE id=?").get(id) as {grade:number;track:string}|undefined;
    if(!row||row.grade!==7||row.track!=="MANDATORY")throw new Error(`Grade 7 batch requires mandatory curriculum requirement ${id}; run the curriculum seed first.`);
  }
}

function assertGrade7BatchCanReplace(){
  if(allowGrade7Update)return;
  const knownTranslations=new Set(grade7LessonIds.flatMap((id)=>[`${id}-vi`,`${id}-en`]));
  const knownClaims=new Set(grade7ClaimIds);
  const expectedSourcesByLesson=new Map(grade7Lessons.map((lesson)=>[lesson.id,new Set(lesson.sourceIds)]));
  const expectedRequirementByLesson=new Map(grade7Lessons.map((lesson)=>[lesson.id,lesson.requirementId]));
  for(const lessonId of grade7LessonIds){
    const node=database.prepare("SELECT updated_at AS updatedAt FROM content_nodes WHERE id=?").get(lessonId) as {updatedAt:string}|undefined;
    if(node&&node.updatedAt!==grade7BatchAsOf)throw new Error(`Refusing to replace edited Grade 7 row content_nodes.${lessonId}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_translations WHERE node_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownTranslations.has(row.id)||row.updatedAt!==grade7BatchAsOf)throw new Error(`Refusing to replace edited Grade 7 row content_translations.${row.id}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_claims WHERE content_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownClaims.has(row.id)||row.updatedAt!==grade7BatchAsOf)throw new Error(`Refusing to replace edited Grade 7 row content_claims.${row.id}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT locale,as_of AS asOf,reviewed_at AS reviewedAt FROM lesson_translations WHERE content_id=?").all(lessonId) as Array<{locale:string;asOf:string;reviewedAt:string}>){
      if(!["vi","en"].includes(row.locale)||row.asOf!==grade7BatchAsOf||row.reviewedAt!==grade7BatchAsOf)throw new Error(`Refusing to replace edited Grade 7 lesson translation ${lessonId}|${row.locale}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
    }
    const expectedSources=expectedSourcesByLesson.get(lessonId)!;
    for(const row of database.prepare("SELECT source_id AS sourceId,sort_order AS sortOrder FROM content_sources WHERE content_id=?").all(lessonId) as Array<{sourceId:string;sortOrder:number}>){
      const expectedSort=grade7Lessons.find(({id})=>id===lessonId)!.sourceIds.indexOf(row.sourceId);
      if(!expectedSources.has(row.sourceId)||row.sortOrder!==expectedSort)throw new Error(`Refusing to erase a manually attached source from ${lessonId}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT requirement_id AS requirementId,as_of AS asOf,mapped_at AS mappedAt FROM content_curriculum WHERE content_id=?").all(lessonId) as Array<{requirementId:string;asOf:string|null;mappedAt:string}>){
      if(row.requirementId!==expectedRequirementByLesson.get(lessonId)||row.asOf!==grade7BatchAsOf||row.mappedAt!==grade7BatchAsOf)throw new Error(`Refusing to erase a manually edited curriculum mapping from ${lessonId}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
    }
    const attached=(database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM content_tags WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_media WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_relations WHERE content_id=? OR related_id=?) AS count
    `).get(lessonId,lessonId,lessonId,lessonId) as {count:number}).count;
    if(attached)throw new Error(`Refusing to erase manually attached tags, media, or relations from ${lessonId}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
  }
  for(const sourceId of grade7SourceIds){
    const row=database.prepare("SELECT updated_at AS updatedAt FROM sources WHERE id=?").get(sourceId) as {updatedAt:string}|undefined;
    if(row&&row.updatedAt!==grade7BatchAsOf)throw new Error(`Refusing to replace edited Grade 7 row sources.${sourceId}; set ALLOW_GRADE_7_BATCH_UPDATE=1 to update explicitly.`);
  }
}

function grade7Count(table:string,column:string,ids:string[]){
  const placeholders=ids.map(()=>"?").join(",");
  return(database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} IN (${placeholders})`).get(...ids) as {count:number}).count;
}

const grade8LessonIds=grade8Lessons.map(({id})=>id);
const grade8SourceIds=grade8Sources.map(({id})=>id);
const grade8Claims=grade8Lessons.flatMap(({id,claims})=>claims.map((claim)=>({...claim,contentId:id})));
const grade8ClaimIds=grade8Claims.map(({id})=>id);
const grade8RequirementIds=grade8Lessons.map(({requirementId})=>requirementId);
const grade8ReviewerVi="Kiểm duyệt nội bộ C-030 (chưa thay thế Hội đồng sử học)";
const grade8ReviewerEn="C-030 internal editorial review (not a substitute for the future historian council)";
const grade8VerificationNote="Kiểm tra biên tập nội bộ C-030; trạng thái này không phải xác nhận của Hội đồng sử học độc lập.";

function assertUniqueGrade8Ids(values:string[],label:string){
  if(new Set(values).size!==values.length)throw new Error(`Grade 8 batch has duplicate ${label} ids.`);
}

function assertGrade8BatchDefinition(){
  assertUniqueGrade8Ids(grade8LessonIds,"lesson");
  assertUniqueGrade8Ids(grade8SourceIds,"source");
  assertUniqueGrade8Ids(grade8ClaimIds,"claim");
  assertUniqueGrade8Ids(grade8RequirementIds,"requirement");
  if(grade8Lessons.length!==7||grade8Claims.length!==14||grade8Sources.length!==27){
    throw new Error(`Grade 8 batch invariant failed: ${JSON.stringify({lessons:grade8Lessons.length,claims:grade8Claims.length,sources:grade8Sources.length})}`);
  }
  const sourceIds=new Set(grade8SourceIds);
  for(const lesson of grade8Lessons){
    const lessonClaimIds=new Set(lesson.claims.map(({id})=>id));
    if(!lesson.sourceIds.length)throw new Error(`Grade 8 lesson ${lesson.id} has no source.`);
    for(const sourceId of lesson.sourceIds)if(!sourceIds.has(sourceId))throw new Error(`Grade 8 lesson ${lesson.id} references unknown source ${sourceId}.`);
    for(const claim of lesson.claims)if(!lesson.sourceIds.includes(claim.sourceId))throw new Error(`Grade 8 claim ${claim.id} uses a source not attached to ${lesson.id}.`);
    for(const locale of [lesson.vi,lesson.en])for(const debate of locale.debates){
      for(const claimId of debate.claimIds)if(!lessonClaimIds.has(claimId))throw new Error(`Grade 8 debate in ${lesson.id} references unknown claim ${claimId}.`);
    }
  }
}

function assertGrade8Prerequisites(){
  const requiredUsers=[
    {id:"user-admin",role:"ADMIN"},
    {id:"user-editor",role:"EDITOR"},
    {id:"user-reviewer",role:"REVIEWER"},
  ];
  for(const expected of requiredUsers){
    const row=database.prepare("SELECT role,active FROM users WHERE id=?").get(expected.id) as {role:string;active:number}|undefined;
    if(!row||row.role!==expected.role||row.active!==1)throw new Error(`Grade 8 batch requires active ${expected.id} with role ${expected.role}; run the base seed first.`);
  }
  for(const id of grade8RequirementIds){
    const row=database.prepare("SELECT grade,track FROM curriculum_requirements WHERE id=?").get(id) as {grade:number;track:string}|undefined;
    if(!row||row.grade!==8||row.track!=="MANDATORY")throw new Error(`Grade 8 batch requires mandatory curriculum requirement ${id}; run the curriculum seed first.`);
  }
}

function assertGrade8BatchCanReplace(){
  if(allowGrade8Update)return;
  const knownTranslations=new Set(grade8LessonIds.flatMap((id)=>[`${id}-vi`,`${id}-en`]));
  const knownClaims=new Set(grade8ClaimIds);
  const expectedSourcesByLesson=new Map(grade8Lessons.map((lesson)=>[lesson.id,new Set(lesson.sourceIds)]));
  const expectedRequirementByLesson=new Map(grade8Lessons.map((lesson)=>[lesson.id,lesson.requirementId]));
  for(const lessonId of grade8LessonIds){
    const node=database.prepare("SELECT updated_at AS updatedAt FROM content_nodes WHERE id=?").get(lessonId) as {updatedAt:string}|undefined;
    if(node&&node.updatedAt!==grade8BatchAsOf)throw new Error(`Refusing to replace edited Grade 8 row content_nodes.${lessonId}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_translations WHERE node_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownTranslations.has(row.id)||row.updatedAt!==grade8BatchAsOf)throw new Error(`Refusing to replace edited Grade 8 row content_translations.${row.id}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_claims WHERE content_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownClaims.has(row.id)||row.updatedAt!==grade8BatchAsOf)throw new Error(`Refusing to replace edited Grade 8 row content_claims.${row.id}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT locale,as_of AS asOf,reviewed_at AS reviewedAt FROM lesson_translations WHERE content_id=?").all(lessonId) as Array<{locale:string;asOf:string;reviewedAt:string}>){
      if(!["vi","en"].includes(row.locale)||row.asOf!==grade8BatchAsOf||row.reviewedAt!==grade8BatchAsOf)throw new Error(`Refusing to replace edited Grade 8 lesson translation ${lessonId}|${row.locale}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
    }
    const expectedSources=expectedSourcesByLesson.get(lessonId)!;
    for(const row of database.prepare("SELECT source_id AS sourceId,sort_order AS sortOrder FROM content_sources WHERE content_id=?").all(lessonId) as Array<{sourceId:string;sortOrder:number}>){
      const expectedSort=grade8Lessons.find(({id})=>id===lessonId)!.sourceIds.indexOf(row.sourceId);
      if(!expectedSources.has(row.sourceId)||row.sortOrder!==expectedSort)throw new Error(`Refusing to erase a manually attached source from ${lessonId}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT requirement_id AS requirementId,as_of AS asOf,mapped_at AS mappedAt FROM content_curriculum WHERE content_id=?").all(lessonId) as Array<{requirementId:string;asOf:string|null;mappedAt:string}>){
      if(row.requirementId!==expectedRequirementByLesson.get(lessonId)||row.asOf!==grade8BatchAsOf||row.mappedAt!==grade8BatchAsOf)throw new Error(`Refusing to erase a manually edited curriculum mapping from ${lessonId}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
    }
    const attached=(database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM content_tags WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_media WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_relations WHERE content_id=? OR related_id=?) AS count
    `).get(lessonId,lessonId,lessonId,lessonId) as {count:number}).count;
    if(attached)throw new Error(`Refusing to erase manually attached tags, media, or relations from ${lessonId}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
  }
  for(const sourceId of grade8SourceIds){
    const row=database.prepare("SELECT updated_at AS updatedAt FROM sources WHERE id=?").get(sourceId) as {updatedAt:string}|undefined;
    if(row&&row.updatedAt!==grade8BatchAsOf)throw new Error(`Refusing to replace edited Grade 8 row sources.${sourceId}; set ALLOW_GRADE_8_BATCH_UPDATE=1 to update explicitly.`);
  }
}

function grade8Count(table:string,column:string,ids:string[]){
  const placeholders=ids.map(()=>"?").join(",");
  return(database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} IN (${placeholders})`).get(...ids) as {count:number}).count;
}

const grade9LessonIds=grade9Lessons.map(({id})=>id);
const grade9SourceIds=grade9Sources.map(({id})=>id);
const grade9Claims=grade9Lessons.flatMap(({id,claims})=>claims.map((claim)=>({...claim,contentId:id})));
const grade9ClaimIds=grade9Claims.map(({id})=>id);
const grade9RequirementIds=grade9Lessons.map(({requirementId})=>requirementId);
const grade9ReviewerVi="Kiểm duyệt nội bộ C-031 (chưa thay thế Hội đồng sử học)";
const grade9ReviewerEn="C-031 internal editorial review (not a substitute for the future historian council)";
const grade9VerificationNote="Kiểm tra biên tập nội bộ C-031; trạng thái này không phải xác nhận của Hội đồng sử học độc lập.";

function assertUniqueGrade9Ids(values:string[],label:string){
  if(new Set(values).size!==values.length)throw new Error(`Grade 9 batch has duplicate ${label} ids.`);
}

function assertGrade9BatchDefinition(){
  assertUniqueGrade9Ids(grade9LessonIds,"lesson");
  assertUniqueGrade9Ids(grade9SourceIds,"source");
  assertUniqueGrade9Ids(grade9ClaimIds,"claim");
  assertUniqueGrade9Ids(grade9RequirementIds,"requirement");
  if(grade9Lessons.length!==6||grade9Claims.length!==12||grade9Sources.length!==22){
    throw new Error(`Grade 9 batch invariant failed: ${JSON.stringify({lessons:grade9Lessons.length,claims:grade9Claims.length,sources:grade9Sources.length})}`);
  }
  const sourceIds=new Set(grade9SourceIds);
  for(const lesson of grade9Lessons){
    const lessonClaimIds=new Set(lesson.claims.map(({id})=>id));
    if(!lesson.sourceIds.length)throw new Error(`Grade 9 lesson ${lesson.id} has no source.`);
    for(const sourceId of lesson.sourceIds)if(!sourceIds.has(sourceId))throw new Error(`Grade 9 lesson ${lesson.id} references unknown source ${sourceId}.`);
    for(const claim of lesson.claims)if(!lesson.sourceIds.includes(claim.sourceId))throw new Error(`Grade 9 claim ${claim.id} uses a source not attached to ${lesson.id}.`);
    for(const locale of [lesson.vi,lesson.en])for(const debate of locale.debates){
      for(const claimId of debate.claimIds)if(!lessonClaimIds.has(claimId))throw new Error(`Grade 9 debate in ${lesson.id} references unknown claim ${claimId}.`);
    }
  }
}

function assertGrade9Prerequisites(){
  const requiredUsers=[
    {id:"user-admin",role:"ADMIN"},
    {id:"user-editor",role:"EDITOR"},
    {id:"user-reviewer",role:"REVIEWER"},
  ];
  for(const expected of requiredUsers){
    const row=database.prepare("SELECT role,active FROM users WHERE id=?").get(expected.id) as {role:string;active:number}|undefined;
    if(!row||row.role!==expected.role||row.active!==1)throw new Error(`Grade 9 batch requires active ${expected.id} with role ${expected.role}; run the base seed first.`);
  }
  for(const id of grade9RequirementIds){
    const row=database.prepare("SELECT grade,track FROM curriculum_requirements WHERE id=?").get(id) as {grade:number;track:string}|undefined;
    if(!row||row.grade!==9||row.track!=="MANDATORY")throw new Error(`Grade 9 batch requires mandatory curriculum requirement ${id}; run the base seed first.`);
  }
}

function assertGrade9BatchCanReplace(){
  if(allowGrade9Update)return;
  const knownTranslations=new Set(grade9LessonIds.flatMap((id)=>[`${id}-vi`,`${id}-en`]));
  const knownClaims=new Set(grade9ClaimIds);
  const expectedSourcesByLesson=new Map(grade9Lessons.map((lesson)=>[lesson.id,new Set(lesson.sourceIds)]));
  const expectedRequirementByLesson=new Map(grade9Lessons.map((lesson)=>[lesson.id,lesson.requirementId]));
  for(const lessonId of grade9LessonIds){
    const node=database.prepare("SELECT updated_at AS updatedAt FROM content_nodes WHERE id=?").get(lessonId) as {updatedAt:string}|undefined;
    if(node&&node.updatedAt!==grade9BatchAsOf)throw new Error(`Refusing to replace edited Grade 9 row content_nodes.${lessonId}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_translations WHERE node_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownTranslations.has(row.id)||row.updatedAt!==grade9BatchAsOf)throw new Error(`Refusing to replace edited Grade 9 row content_translations.${row.id}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT id,updated_at AS updatedAt FROM content_claims WHERE content_id=?").all(lessonId) as Array<{id:string;updatedAt:string}>){
      if(!knownClaims.has(row.id)||row.updatedAt!==grade9BatchAsOf)throw new Error(`Refusing to replace edited Grade 9 row content_claims.${row.id}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT locale,as_of AS asOf,reviewed_at AS reviewedAt FROM lesson_translations WHERE content_id=?").all(lessonId) as Array<{locale:string;asOf:string;reviewedAt:string}>){
      if(!["vi","en"].includes(row.locale)||row.asOf!==grade9BatchAsOf||row.reviewedAt!==grade9BatchAsOf)throw new Error(`Refusing to replace edited Grade 9 lesson translation ${lessonId}|${row.locale}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
    }
    const expectedSources=expectedSourcesByLesson.get(lessonId)!;
    for(const row of database.prepare("SELECT source_id AS sourceId,sort_order AS sortOrder FROM content_sources WHERE content_id=?").all(lessonId) as Array<{sourceId:string;sortOrder:number}>){
      const expectedSort=grade9Lessons.find(({id})=>id===lessonId)!.sourceIds.indexOf(row.sourceId);
      if(!expectedSources.has(row.sourceId)||row.sortOrder!==expectedSort)throw new Error(`Refusing to erase a manually attached source from ${lessonId}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
    }
    for(const row of database.prepare("SELECT requirement_id AS requirementId,as_of AS asOf,mapped_at AS mappedAt FROM content_curriculum WHERE content_id=?").all(lessonId) as Array<{requirementId:string;asOf:string|null;mappedAt:string}>){
      if(row.requirementId!==expectedRequirementByLesson.get(lessonId)||row.asOf!==grade9BatchAsOf||row.mappedAt!==grade9BatchAsOf)throw new Error(`Refusing to erase a manually edited curriculum mapping from ${lessonId}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
    }
    const attached=(database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM content_tags WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_media WHERE content_id=?) +
        (SELECT COUNT(*) FROM content_relations WHERE content_id=? OR related_id=?) AS count
    `).get(lessonId,lessonId,lessonId,lessonId) as {count:number}).count;
    if(attached)throw new Error(`Refusing to erase manually attached tags, media, or relations from ${lessonId}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
  }
  for(const sourceId of grade9SourceIds){
    const row=database.prepare("SELECT updated_at AS updatedAt FROM sources WHERE id=?").get(sourceId) as {updatedAt:string}|undefined;
    if(row&&row.updatedAt!==grade9BatchAsOf)throw new Error(`Refusing to replace edited Grade 9 row sources.${sourceId}; set ALLOW_GRADE_9_BATCH_UPDATE=1 to update explicitly.`);
  }
}

function grade9Count(table:string,column:string,ids:string[]){
  const placeholders=ids.map(()=>"?").join(",");
  return(database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} IN (${placeholders})`).get(...ids) as {count:number}).count;
}

if(grade9Only){
  try{
    assertGrade9BatchDefinition();
    assertGrade9Prerequisites();
    assertGrade9BatchCanReplace();
    const result=database.transaction(()=>{
      const deleteEvidence=database.prepare("DELETE FROM claim_evidence WHERE content_id=?");
      const deleteClaims=database.prepare("DELETE FROM content_claims WHERE content_id=?");
      const deleteLessons=database.prepare("DELETE FROM lesson_translations WHERE content_id=?");
      const deleteMappings=database.prepare("DELETE FROM content_curriculum WHERE content_id=?");
      const deleteSources=database.prepare("DELETE FROM content_sources WHERE content_id=?");
      const deleteTranslations=database.prepare("DELETE FROM content_translations WHERE node_id=?");
      const deleteRelations=database.prepare("DELETE FROM content_relations WHERE content_id=? OR related_id=?");
      const deleteTags=database.prepare("DELETE FROM content_tags WHERE content_id=?");
      const deleteMedia=database.prepare("DELETE FROM content_media WHERE content_id=?");
      const deleteNode=database.prepare("DELETE FROM content_nodes WHERE id=?");
      for(const id of grade9LessonIds){
        deleteEvidence.run(id);deleteClaims.run(id);deleteLessons.run(id);deleteMappings.run(id);
        deleteSources.run(id);deleteTranslations.run(id);deleteRelations.run(id,id);deleteTags.run(id);deleteMedia.run(id);deleteNode.run(id);
      }

      const upsertSource=database.prepare(`
        INSERT INTO sources(
          id,title,author,publisher,year,url,accessed_at,citation_note,created_at,updated_at,version,
          source_type,quality_tier,institution,identifier,edition,archived_url,checksum,
          verification_status,verified_by,verified_at,verification_note
        ) VALUES(?,?,NULL,?,?,?,?,?,?,?,1,?,?,?,?,NULL,NULL,NULL,'VERIFIED','user-reviewer',?,?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,author=excluded.author,publisher=excluded.publisher,year=excluded.year,url=excluded.url,
          accessed_at=excluded.accessed_at,citation_note=excluded.citation_note,created_at=excluded.created_at,
          updated_at=excluded.updated_at,version=excluded.version,source_type=excluded.source_type,
          quality_tier=excluded.quality_tier,institution=excluded.institution,identifier=excluded.identifier,
          edition=excluded.edition,archived_url=excluded.archived_url,checksum=excluded.checksum,
          verification_status=excluded.verification_status,verified_by=excluded.verified_by,
          verified_at=excluded.verified_at,verification_note=excluded.verification_note
      `);
      for(const source of grade9Sources)upsertSource.run(
        source.id,source.title,source.publisher,source.year,source.url,grade9BatchAsOf,
        "Chỉ dẫn nguồn bên ngoài; batch C-031 không tải hoặc sao chép tệp nhị phân của bên thứ ba.",
        grade9BatchAsOf,grade9BatchAsOf,source.sourceType,source.qualityTier,source.institution,
        source.identifier,grade9BatchAsOf,`${source.verificationNote} ${grade9VerificationNote}`,
      );

      const insertNode=database.prepare(`
        INSERT INTO content_nodes(
          id,type,status,featured,reviewed_by,published_at,created_at,updated_at,
          version,updated_by,reviewed_at
        ) VALUES(?,'TOPIC','PUBLISHED',0,?,?,?, ?,1,'user-editor',?)
      `);
      const insertTranslation=database.prepare(`
        INSERT INTO content_translations(
          id,node_id,locale,title,slug,summary,body,seo_title,seo_description,
          translation_status,search_text,created_at,updated_at,version
        ) VALUES(?,?,?,?,?,?,?,?,?,'PUBLISHED',?,?,?,1)
      `);
      const attachSource=database.prepare("INSERT INTO content_sources(content_id,source_id,sort_order) VALUES(?,?,?)");
      const insertLesson=database.prepare(`
        INSERT INTO lesson_translations(
          content_id,locale,learning_objectives,original_summary,analysis,debates,as_of,reviewed_by,reviewed_at
        ) VALUES(?,?,?,?,?,?,?,?,?)
      `);
      const insertClaim=database.prepare(`
        INSERT INTO content_claims(
          id,content_id,claim_type,assessment,statement_vi,statement_en,verification_status,version,
          verified_by,verified_at,verification_note,created_by,updated_by,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,'VERIFIED',1,'user-reviewer',?,?, 'user-editor','user-editor',?,?)
      `);
      const insertEvidence=database.prepare(`
        INSERT INTO claim_evidence(claim_id,content_id,source_id,locator,quote,note,sort_order)
        VALUES(?,?,?,?,NULL,?,0)
      `);
      const attachRequirement=database.prepare(`
        INSERT INTO content_curriculum(content_id,requirement_id,as_of,mapped_by,mapped_at)
        VALUES(?,?,?,'user-editor',?)
      `);
      for(const lesson of grade9Lessons){
        insertNode.run(lesson.id,grade9ReviewerVi,grade9BatchAsOf,grade9BatchAsOf,grade9BatchAsOf,grade9BatchAsOf);
        for(const [locale,value] of [["vi",lesson.vi],["en",lesson.en]] as const){
          insertTranslation.run(
            `${lesson.id}-${locale}`,lesson.id,locale,value.title,value.slug,value.summary,value.body,
            value.title,value.summary,normalizeSearchText(`${value.title} ${value.summary} ${value.body}`),
            grade9BatchAsOf,grade9BatchAsOf,
          );
          insertLesson.run(
            lesson.id,locale,JSON.stringify(value.learningObjectives),value.originalSummary,value.analysis,
            JSON.stringify(value.debates),grade9BatchAsOf,locale==="vi"?grade9ReviewerVi:grade9ReviewerEn,grade9BatchAsOf,
          );
        }
        lesson.sourceIds.forEach((sourceId,index)=>attachSource.run(lesson.id,sourceId,index));
        for(const claim of lesson.claims){
          insertClaim.run(
            claim.id,lesson.id,claim.claimType,claim.assessment,claim.statementVi,claim.statementEn,
            grade9BatchAsOf,`${claim.note} ${grade9VerificationNote}`,grade9BatchAsOf,grade9BatchAsOf,
          );
          insertEvidence.run(claim.id,lesson.id,claim.sourceId,claim.locator,claim.note);
        }
        attachRequirement.run(lesson.id,lesson.requirementId,grade9BatchAsOf,grade9BatchAsOf);
      }

      const counts={
        lessons:grade9Count("content_nodes","id",grade9LessonIds),
        translations:grade9Count("content_translations","node_id",grade9LessonIds),
        lessonTranslations:grade9Count("lesson_translations","content_id",grade9LessonIds),
        sources:grade9Count("sources","id",grade9SourceIds),
        claims:grade9Count("content_claims","id",grade9ClaimIds),
        evidence:grade9Count("claim_evidence","claim_id",grade9ClaimIds),
        mappings:grade9Count("content_curriculum","content_id",grade9LessonIds),
      };
      const expected={lessons:6,translations:12,lessonTranslations:12,sources:22,claims:12,evidence:12,mappings:6};
      if(JSON.stringify(counts)!==JSON.stringify(expected))throw new Error(`Grade 9 seed invariant failed: ${JSON.stringify(counts)}`);
      return{mode:"grade-9-only",asOf:grade9BatchAsOf,review:"internal-c031-not-historian-council",copyright:"citations-only-no-third-party-binaries",...counts};
    }).immediate();
    console.log(JSON.stringify(result));
  }finally{database.close();}
}else if(grade8Only){
  try{
    assertGrade8BatchDefinition();
    assertGrade8Prerequisites();
    assertGrade8BatchCanReplace();
    const result=database.transaction(()=>{
      const deleteEvidence=database.prepare("DELETE FROM claim_evidence WHERE content_id=?");
      const deleteClaims=database.prepare("DELETE FROM content_claims WHERE content_id=?");
      const deleteLessons=database.prepare("DELETE FROM lesson_translations WHERE content_id=?");
      const deleteMappings=database.prepare("DELETE FROM content_curriculum WHERE content_id=?");
      const deleteSources=database.prepare("DELETE FROM content_sources WHERE content_id=?");
      const deleteTranslations=database.prepare("DELETE FROM content_translations WHERE node_id=?");
      const deleteRelations=database.prepare("DELETE FROM content_relations WHERE content_id=? OR related_id=?");
      const deleteTags=database.prepare("DELETE FROM content_tags WHERE content_id=?");
      const deleteMedia=database.prepare("DELETE FROM content_media WHERE content_id=?");
      const deleteNode=database.prepare("DELETE FROM content_nodes WHERE id=?");
      for(const id of grade8LessonIds){
        deleteEvidence.run(id);deleteClaims.run(id);deleteLessons.run(id);deleteMappings.run(id);
        deleteSources.run(id);deleteTranslations.run(id);deleteRelations.run(id,id);deleteTags.run(id);deleteMedia.run(id);deleteNode.run(id);
      }

      const upsertSource=database.prepare(`
        INSERT INTO sources(
          id,title,author,publisher,year,url,accessed_at,citation_note,created_at,updated_at,version,
          source_type,quality_tier,institution,identifier,edition,archived_url,checksum,
          verification_status,verified_by,verified_at,verification_note
        ) VALUES(?,?,NULL,?,?,?,?,?,?,?,1,?,?,?,?,NULL,NULL,NULL,'VERIFIED','user-reviewer',?,?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,author=excluded.author,publisher=excluded.publisher,year=excluded.year,url=excluded.url,
          accessed_at=excluded.accessed_at,citation_note=excluded.citation_note,created_at=excluded.created_at,
          updated_at=excluded.updated_at,version=excluded.version,source_type=excluded.source_type,
          quality_tier=excluded.quality_tier,institution=excluded.institution,identifier=excluded.identifier,
          edition=excluded.edition,archived_url=excluded.archived_url,checksum=excluded.checksum,
          verification_status=excluded.verification_status,verified_by=excluded.verified_by,
          verified_at=excluded.verified_at,verification_note=excluded.verification_note
      `);
      for(const source of grade8Sources)upsertSource.run(
        source.id,source.title,source.publisher,source.year,source.url,grade8BatchAsOf,
        "Chỉ dẫn nguồn bên ngoài; batch C-030 không tải hoặc sao chép tệp nhị phân của bên thứ ba.",
        grade8BatchAsOf,grade8BatchAsOf,source.sourceType,source.qualityTier,source.institution,
        source.identifier,grade8BatchAsOf,`${source.verificationNote} ${grade8VerificationNote}`,
      );

      const insertNode=database.prepare(`
        INSERT INTO content_nodes(
          id,type,status,featured,reviewed_by,published_at,created_at,updated_at,
          version,updated_by,reviewed_at
        ) VALUES(?,'TOPIC','PUBLISHED',0,?,?,?, ?,1,'user-editor',?)
      `);
      const insertTranslation=database.prepare(`
        INSERT INTO content_translations(
          id,node_id,locale,title,slug,summary,body,seo_title,seo_description,
          translation_status,search_text,created_at,updated_at,version
        ) VALUES(?,?,?,?,?,?,?,?,?,'PUBLISHED',?,?,?,1)
      `);
      const attachSource=database.prepare("INSERT INTO content_sources(content_id,source_id,sort_order) VALUES(?,?,?)");
      const insertLesson=database.prepare(`
        INSERT INTO lesson_translations(
          content_id,locale,learning_objectives,original_summary,analysis,debates,as_of,reviewed_by,reviewed_at
        ) VALUES(?,?,?,?,?,?,?,?,?)
      `);
      const insertClaim=database.prepare(`
        INSERT INTO content_claims(
          id,content_id,claim_type,assessment,statement_vi,statement_en,verification_status,version,
          verified_by,verified_at,verification_note,created_by,updated_by,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,'VERIFIED',1,'user-reviewer',?,?, 'user-editor','user-editor',?,?)
      `);
      const insertEvidence=database.prepare(`
        INSERT INTO claim_evidence(claim_id,content_id,source_id,locator,quote,note,sort_order)
        VALUES(?,?,?,?,NULL,?,0)
      `);
      const attachRequirement=database.prepare(`
        INSERT INTO content_curriculum(content_id,requirement_id,as_of,mapped_by,mapped_at)
        VALUES(?,?,?,'user-editor',?)
      `);
      for(const lesson of grade8Lessons){
        insertNode.run(lesson.id,grade8ReviewerVi,grade8BatchAsOf,grade8BatchAsOf,grade8BatchAsOf,grade8BatchAsOf);
        for(const [locale,value] of [["vi",lesson.vi],["en",lesson.en]] as const){
          insertTranslation.run(
            `${lesson.id}-${locale}`,lesson.id,locale,value.title,value.slug,value.summary,value.body,
            value.title,value.summary,normalizeSearchText(`${value.title} ${value.summary} ${value.body}`),
            grade8BatchAsOf,grade8BatchAsOf,
          );
          insertLesson.run(
            lesson.id,locale,JSON.stringify(value.learningObjectives),value.originalSummary,value.analysis,
            JSON.stringify(value.debates),grade8BatchAsOf,locale==="vi"?grade8ReviewerVi:grade8ReviewerEn,grade8BatchAsOf,
          );
        }
        lesson.sourceIds.forEach((sourceId,index)=>attachSource.run(lesson.id,sourceId,index));
        for(const claim of lesson.claims){
          insertClaim.run(
            claim.id,lesson.id,claim.claimType,claim.assessment,claim.statementVi,claim.statementEn,
            grade8BatchAsOf,`${claim.note} ${grade8VerificationNote}`,grade8BatchAsOf,grade8BatchAsOf,
          );
          insertEvidence.run(claim.id,lesson.id,claim.sourceId,claim.locator,claim.note);
        }
        attachRequirement.run(lesson.id,lesson.requirementId,grade8BatchAsOf,grade8BatchAsOf);
      }

      const counts={
        lessons:grade8Count("content_nodes","id",grade8LessonIds),
        translations:grade8Count("content_translations","node_id",grade8LessonIds),
        lessonTranslations:grade8Count("lesson_translations","content_id",grade8LessonIds),
        sources:grade8Count("sources","id",grade8SourceIds),
        claims:grade8Count("content_claims","id",grade8ClaimIds),
        evidence:grade8Count("claim_evidence","claim_id",grade8ClaimIds),
        mappings:grade8Count("content_curriculum","content_id",grade8LessonIds),
      };
      const expected={lessons:7,translations:14,lessonTranslations:14,sources:27,claims:14,evidence:14,mappings:7};
      if(JSON.stringify(counts)!==JSON.stringify(expected))throw new Error(`Grade 8 seed invariant failed: ${JSON.stringify(counts)}`);
      return{mode:"grade-8-only",asOf:grade8BatchAsOf,review:"internal-c030-not-historian-council",copyright:"citations-only-no-third-party-binaries",...counts};
    }).immediate();
    console.log(JSON.stringify(result));
  }finally{database.close();}
}else if(grade7Only){
  try{
    assertGrade7BatchDefinition();
    assertGrade7Prerequisites();
    assertGrade7BatchCanReplace();
    const result=database.transaction(()=>{
      const deleteEvidence=database.prepare("DELETE FROM claim_evidence WHERE content_id=?");
      const deleteClaims=database.prepare("DELETE FROM content_claims WHERE content_id=?");
      const deleteLessons=database.prepare("DELETE FROM lesson_translations WHERE content_id=?");
      const deleteMappings=database.prepare("DELETE FROM content_curriculum WHERE content_id=?");
      const deleteSources=database.prepare("DELETE FROM content_sources WHERE content_id=?");
      const deleteTranslations=database.prepare("DELETE FROM content_translations WHERE node_id=?");
      const deleteRelations=database.prepare("DELETE FROM content_relations WHERE content_id=? OR related_id=?");
      const deleteTags=database.prepare("DELETE FROM content_tags WHERE content_id=?");
      const deleteMedia=database.prepare("DELETE FROM content_media WHERE content_id=?");
      const deleteNode=database.prepare("DELETE FROM content_nodes WHERE id=?");
      for(const id of grade7LessonIds){
        deleteEvidence.run(id);deleteClaims.run(id);deleteLessons.run(id);deleteMappings.run(id);
        deleteSources.run(id);deleteTranslations.run(id);deleteRelations.run(id,id);deleteTags.run(id);deleteMedia.run(id);deleteNode.run(id);
      }

      const upsertSource=database.prepare(`
        INSERT INTO sources(
          id,title,author,publisher,year,url,accessed_at,citation_note,created_at,updated_at,version,
          source_type,quality_tier,institution,identifier,edition,archived_url,checksum,
          verification_status,verified_by,verified_at,verification_note
        ) VALUES(?,?,NULL,?,?,?,?,?,?,?,1,?,?,?,?,NULL,NULL,NULL,'VERIFIED','user-reviewer',?,?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,author=excluded.author,publisher=excluded.publisher,year=excluded.year,url=excluded.url,
          accessed_at=excluded.accessed_at,citation_note=excluded.citation_note,created_at=excluded.created_at,
          updated_at=excluded.updated_at,version=excluded.version,source_type=excluded.source_type,
          quality_tier=excluded.quality_tier,institution=excluded.institution,identifier=excluded.identifier,
          edition=excluded.edition,archived_url=excluded.archived_url,checksum=excluded.checksum,
          verification_status=excluded.verification_status,verified_by=excluded.verified_by,
          verified_at=excluded.verified_at,verification_note=excluded.verification_note
      `);
      for(const source of grade7Sources)upsertSource.run(
        source.id,source.title,source.publisher,source.year,source.url,grade7BatchAsOf,
        "Chỉ dẫn nguồn bên ngoài; batch C-029 không tải hoặc sao chép tệp nhị phân của bên thứ ba.",
        grade7BatchAsOf,grade7BatchAsOf,source.sourceType,source.qualityTier,source.institution,
        source.identifier,grade7BatchAsOf,`${source.verificationNote} ${grade7VerificationNote}`,
      );

      const insertNode=database.prepare(`
        INSERT INTO content_nodes(
          id,type,status,featured,reviewed_by,published_at,created_at,updated_at,
          version,updated_by,reviewed_at
        ) VALUES(?,'TOPIC','PUBLISHED',0,?,?,?, ?,1,'user-editor',?)
      `);
      const insertTranslation=database.prepare(`
        INSERT INTO content_translations(
          id,node_id,locale,title,slug,summary,body,seo_title,seo_description,
          translation_status,search_text,created_at,updated_at,version
        ) VALUES(?,?,?,?,?,?,?,?,?,'PUBLISHED',?,?,?,1)
      `);
      const attachSource=database.prepare("INSERT INTO content_sources(content_id,source_id,sort_order) VALUES(?,?,?)");
      const insertLesson=database.prepare(`
        INSERT INTO lesson_translations(
          content_id,locale,learning_objectives,original_summary,analysis,debates,as_of,reviewed_by,reviewed_at
        ) VALUES(?,?,?,?,?,?,?,?,?)
      `);
      const insertClaim=database.prepare(`
        INSERT INTO content_claims(
          id,content_id,claim_type,assessment,statement_vi,statement_en,verification_status,version,
          verified_by,verified_at,verification_note,created_by,updated_by,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,'VERIFIED',1,'user-reviewer',?,?, 'user-editor','user-editor',?,?)
      `);
      const insertEvidence=database.prepare(`
        INSERT INTO claim_evidence(claim_id,content_id,source_id,locator,quote,note,sort_order)
        VALUES(?,?,?,?,NULL,?,0)
      `);
      const attachRequirement=database.prepare(`
        INSERT INTO content_curriculum(content_id,requirement_id,as_of,mapped_by,mapped_at)
        VALUES(?,?,?,'user-editor',?)
      `);
      for(const lesson of grade7Lessons){
        insertNode.run(lesson.id,grade7ReviewerVi,grade7BatchAsOf,grade7BatchAsOf,grade7BatchAsOf,grade7BatchAsOf);
        for(const [locale,value] of [["vi",lesson.vi],["en",lesson.en]] as const){
          insertTranslation.run(
            `${lesson.id}-${locale}`,lesson.id,locale,value.title,value.slug,value.summary,value.body,
            value.title,value.summary,normalizeSearchText(`${value.title} ${value.summary} ${value.body}`),
            grade7BatchAsOf,grade7BatchAsOf,
          );
          insertLesson.run(
            lesson.id,locale,JSON.stringify(value.learningObjectives),value.originalSummary,value.analysis,
            JSON.stringify(value.debates),grade7BatchAsOf,locale==="vi"?grade7ReviewerVi:grade7ReviewerEn,grade7BatchAsOf,
          );
        }
        lesson.sourceIds.forEach((sourceId,index)=>attachSource.run(lesson.id,sourceId,index));
        for(const claim of lesson.claims){
          insertClaim.run(
            claim.id,lesson.id,claim.claimType,claim.assessment,claim.statementVi,claim.statementEn,
            grade7BatchAsOf,`${claim.note} ${grade7VerificationNote}`,grade7BatchAsOf,grade7BatchAsOf,
          );
          insertEvidence.run(claim.id,lesson.id,claim.sourceId,claim.locator,claim.note);
        }
        attachRequirement.run(lesson.id,lesson.requirementId,grade7BatchAsOf,grade7BatchAsOf);
      }

      const counts={
        lessons:grade7Count("content_nodes","id",grade7LessonIds),
        translations:grade7Count("content_translations","node_id",grade7LessonIds),
        lessonTranslations:grade7Count("lesson_translations","content_id",grade7LessonIds),
        sources:grade7Count("sources","id",grade7SourceIds),
        claims:grade7Count("content_claims","id",grade7ClaimIds),
        evidence:grade7Count("claim_evidence","claim_id",grade7ClaimIds),
        mappings:grade7Count("content_curriculum","content_id",grade7LessonIds),
      };
      const expected={lessons:6,translations:12,lessonTranslations:12,sources:18,claims:12,evidence:12,mappings:6};
      if(JSON.stringify(counts)!==JSON.stringify(expected))throw new Error(`Grade 7 seed invariant failed: ${JSON.stringify(counts)}`);
      return{mode:"grade-7-only",asOf:grade7BatchAsOf,review:"internal-c029-not-historian-council",copyright:"citations-only-no-third-party-binaries",...counts};
    }).immediate();
    console.log(JSON.stringify(result));
  }finally{database.close();}
}else if(grade6Only){
  try{
    assertGrade6BatchDefinition();
    assertGrade6Prerequisites();
    assertGrade6BatchCanReplace();
    const result=database.transaction(()=>{
      const deleteEvidence=database.prepare("DELETE FROM claim_evidence WHERE content_id=?");
      const deleteClaims=database.prepare("DELETE FROM content_claims WHERE content_id=?");
      const deleteLessons=database.prepare("DELETE FROM lesson_translations WHERE content_id=?");
      const deleteMappings=database.prepare("DELETE FROM content_curriculum WHERE content_id=?");
      const deleteSources=database.prepare("DELETE FROM content_sources WHERE content_id=?");
      const deleteTranslations=database.prepare("DELETE FROM content_translations WHERE node_id=?");
      const deleteRelations=database.prepare("DELETE FROM content_relations WHERE content_id=? OR related_id=?");
      const deleteTags=database.prepare("DELETE FROM content_tags WHERE content_id=?");
      const deleteMedia=database.prepare("DELETE FROM content_media WHERE content_id=?");
      const deleteNode=database.prepare("DELETE FROM content_nodes WHERE id=?");
      for(const id of grade6LessonIds){
        deleteEvidence.run(id);deleteClaims.run(id);deleteLessons.run(id);deleteMappings.run(id);
        deleteSources.run(id);deleteTranslations.run(id);deleteRelations.run(id,id);deleteTags.run(id);deleteMedia.run(id);deleteNode.run(id);
      }

      const upsertSource=database.prepare(`
        INSERT INTO sources(
          id,title,author,publisher,year,url,accessed_at,citation_note,created_at,updated_at,version,
          source_type,quality_tier,institution,identifier,edition,archived_url,checksum,
          verification_status,verified_by,verified_at,verification_note
        ) VALUES(?,?,NULL,?,?,?,?,?,?,?,1,?,?,?,?,NULL,NULL,NULL,'VERIFIED','user-reviewer',?,?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,author=excluded.author,publisher=excluded.publisher,year=excluded.year,url=excluded.url,
          accessed_at=excluded.accessed_at,citation_note=excluded.citation_note,created_at=excluded.created_at,
          updated_at=excluded.updated_at,version=excluded.version,source_type=excluded.source_type,
          quality_tier=excluded.quality_tier,institution=excluded.institution,identifier=excluded.identifier,
          edition=excluded.edition,archived_url=excluded.archived_url,checksum=excluded.checksum,
          verification_status=excluded.verification_status,verified_by=excluded.verified_by,
          verified_at=excluded.verified_at,verification_note=excluded.verification_note
      `);
      for(const source of grade6Sources)upsertSource.run(
        source.id,source.title,source.publisher,source.year,source.url,grade6BatchAsOf,
        "Chỉ dẫn nguồn bên ngoài; batch C-028 không tải hoặc sao chép tệp nhị phân của bên thứ ba.",
        grade6BatchAsOf,grade6BatchAsOf,source.sourceType,source.qualityTier,source.institution,
        source.identifier,grade6BatchAsOf,`${source.verificationNote} ${grade6VerificationNote}`,
      );

      const insertNode=database.prepare(`
        INSERT INTO content_nodes(
          id,type,status,featured,reviewed_by,published_at,created_at,updated_at,
          version,updated_by,reviewed_at
        ) VALUES(?,'TOPIC','PUBLISHED',0,?,?,?, ?,1,'user-editor',?)
      `);
      const insertTranslation=database.prepare(`
        INSERT INTO content_translations(
          id,node_id,locale,title,slug,summary,body,seo_title,seo_description,
          translation_status,search_text,created_at,updated_at,version
        ) VALUES(?,?,?,?,?,?,?,?,?,'PUBLISHED',?,?,?,1)
      `);
      const attachSource=database.prepare("INSERT INTO content_sources(content_id,source_id,sort_order) VALUES(?,?,?)");
      const insertLesson=database.prepare(`
        INSERT INTO lesson_translations(
          content_id,locale,learning_objectives,original_summary,analysis,debates,as_of,reviewed_by,reviewed_at
        ) VALUES(?,?,?,?,?,?,?,?,?)
      `);
      const insertClaim=database.prepare(`
        INSERT INTO content_claims(
          id,content_id,claim_type,assessment,statement_vi,statement_en,verification_status,version,
          verified_by,verified_at,verification_note,created_by,updated_by,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,'VERIFIED',1,'user-reviewer',?,?, 'user-editor','user-editor',?,?)
      `);
      const insertEvidence=database.prepare(`
        INSERT INTO claim_evidence(claim_id,content_id,source_id,locator,quote,note,sort_order)
        VALUES(?,?,?,?,NULL,?,0)
      `);
      const attachRequirement=database.prepare(`
        INSERT INTO content_curriculum(content_id,requirement_id,as_of,mapped_by,mapped_at)
        VALUES(?,?,?,'user-editor',?)
      `);
      for(const lesson of grade6Lessons){
        insertNode.run(lesson.id,grade6ReviewerVi,grade6BatchAsOf,grade6BatchAsOf,grade6BatchAsOf,grade6BatchAsOf);
        for(const [locale,value] of [["vi",lesson.vi],["en",lesson.en]] as const){
          insertTranslation.run(
            `${lesson.id}-${locale}`,lesson.id,locale,value.title,value.slug,value.summary,value.body,
            value.title,value.summary,normalizeSearchText(`${value.title} ${value.summary} ${value.body}`),
            grade6BatchAsOf,grade6BatchAsOf,
          );
          insertLesson.run(
            lesson.id,locale,JSON.stringify(value.learningObjectives),value.originalSummary,value.analysis,
            JSON.stringify(value.debates),grade6BatchAsOf,locale==="vi"?grade6ReviewerVi:grade6ReviewerEn,grade6BatchAsOf,
          );
        }
        lesson.sourceIds.forEach((sourceId,index)=>attachSource.run(lesson.id,sourceId,index));
        for(const claim of lesson.claims){
          insertClaim.run(
            claim.id,lesson.id,claim.claimType,claim.assessment,claim.statementVi,claim.statementEn,
            grade6BatchAsOf,`${claim.note} ${grade6VerificationNote}`,grade6BatchAsOf,grade6BatchAsOf,
          );
          insertEvidence.run(claim.id,lesson.id,claim.sourceId,claim.locator,claim.note);
        }
        attachRequirement.run(lesson.id,lesson.requirementId,grade6BatchAsOf,grade6BatchAsOf);
      }

      const counts={
        lessons:grade6Count("content_nodes","id",grade6LessonIds),
        translations:grade6Count("content_translations","node_id",grade6LessonIds),
        lessonTranslations:grade6Count("lesson_translations","content_id",grade6LessonIds),
        sources:grade6Count("sources","id",grade6SourceIds),
        claims:grade6Count("content_claims","id",grade6ClaimIds),
        evidence:grade6Count("claim_evidence","claim_id",grade6ClaimIds),
        mappings:grade6Count("content_curriculum","content_id",grade6LessonIds),
      };
      const expected={lessons:8,translations:16,lessonTranslations:16,sources:8,claims:16,evidence:16,mappings:8};
      if(JSON.stringify(counts)!==JSON.stringify(expected))throw new Error(`Grade 6 seed invariant failed: ${JSON.stringify(counts)}`);
      return{mode:"grade-6-only",asOf:grade6BatchAsOf,review:"internal-c028-not-historian-council",copyright:"citations-only-no-third-party-binaries",...counts};
    }).immediate();
    console.log(JSON.stringify(result));
  }finally{database.close();}
}else if(curriculumOnly){
  try{
    const result=database.transaction(()=>{
      const upsert=database.prepare(`
        INSERT INTO curriculum_requirements(
          id,grade,track,topic_vi,topic_en,slug_vi,slug_en,official_program_ref,
          period_start,period_end,required_outcomes_vi,required_outcomes_en,sort_order,
          programme_as_of,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          grade=excluded.grade,track=excluded.track,topic_vi=excluded.topic_vi,topic_en=excluded.topic_en,
          slug_vi=excluded.slug_vi,slug_en=excluded.slug_en,official_program_ref=excluded.official_program_ref,
          period_start=excluded.period_start,period_end=excluded.period_end,
          required_outcomes_vi=excluded.required_outcomes_vi,required_outcomes_en=excluded.required_outcomes_en,
          sort_order=excluded.sort_order,programme_as_of=excluded.programme_as_of,updated_at=excluded.updated_at
      `);
      for(const requirement of curriculumRequirements)upsert.run(requirement.id,requirement.grade,requirement.track,
        requirement.topicVi,requirement.topicEn,requirement.slugVi,requirement.slugEn,
        requirement.officialProgramRef,requirement.periodStart,requirement.periodEnd,
        JSON.stringify(requirement.requiredOutcomesVi),JSON.stringify(requirement.requiredOutcomesEn),
        requirement.sortOrder,curriculumProgrammeAsOf,now,now);
      const attach=database.prepare(`
        INSERT OR IGNORE INTO content_curriculum(content_id,requirement_id,as_of,mapped_by,mapped_at)
        SELECT ?,?,?,NULL,? WHERE EXISTS(SELECT 1 FROM content_nodes WHERE id=?)
      `);
      for(const mapping of curriculumMappings)attach.run(mapping.contentId,mapping.requirementId,mapping.asOf,now,mapping.contentId);
      return{
        mode:"curriculum-only",
        curriculumRequirements:(database.prepare("SELECT COUNT(*) AS count FROM curriculum_requirements").get() as {count:number}).count,
        curriculumMappings:(database.prepare("SELECT COUNT(*) AS count FROM content_curriculum").get() as {count:number}).count,
      };
    }).immediate();
    console.log(JSON.stringify(result));
  }finally{database.close();}
}else try {
  assertOnlyDemoData();
  const seed = database.transaction(() => {
    database.exec(`
      DELETE FROM login_rate_limits;
      DELETE FROM audit_logs;
      DELETE FROM claim_evidence;
      DELETE FROM content_claims;
      DELETE FROM content_curriculum;
      DELETE FROM content_relations;
      DELETE FROM content_tags;
      DELETE FROM content_media;
      DELETE FROM content_sources;
      DELETE FROM media;
      DELETE FROM sources;
      DELETE FROM content_translations;
      DELETE FROM content_nodes;
      DELETE FROM curriculum_requirements;
      DELETE FROM tags;
      DELETE FROM users;
    `);

    const insertUser = database.prepare(`
      INSERT INTO users (id, email, display_name, role, password_hash, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);
    for (const user of demoUsers) {
      insertUser.run(user.id, user.email, user.displayName, user.role, passwordHashes.get(user.id), now, now);
    }

    const insertRequirement=database.prepare(`
      INSERT INTO curriculum_requirements(
        id,grade,track,topic_vi,topic_en,slug_vi,slug_en,official_program_ref,
        period_start,period_end,required_outcomes_vi,required_outcomes_en,sort_order,
        programme_as_of,created_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    for(const requirement of curriculumRequirements){
      insertRequirement.run(requirement.id,requirement.grade,requirement.track,
        requirement.topicVi,requirement.topicEn,requirement.slugVi,requirement.slugEn,
        requirement.officialProgramRef,requirement.periodStart,requirement.periodEnd,
        JSON.stringify(requirement.requiredOutcomesVi),JSON.stringify(requirement.requiredOutcomesEn),
        requirement.sortOrder,curriculumProgrammeAsOf,now,now);
    }

    const insertTag = database.prepare(
      "INSERT INTO tags (id, slug, name_vi, name_en) VALUES (?, ?, ?, ?)",
    );
    for (const tag of demoTags) {
      insertTag.run(tag.id, tag.slug, tag.nameVi, tag.nameEn);
    }

    const insertNode = database.prepare(`
      INSERT INTO content_nodes (
        id, type, status, featured, start_date, end_date, date_precision, period_id,
        location, location_en, result, result_en, role, role_en, artifact_meta, artifact_meta_en,
        reviewed_by, published_at, created_at, updated_at
      ) VALUES (?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTranslation = database.prepare(`
      INSERT INTO content_translations (
        id, node_id, locale, title, slug, summary, body, seo_title, seo_description,
        translation_status, search_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSource = database.prepare(`
      INSERT INTO sources (
        id, title, author, publisher, year, url, accessed_at, citation_note,
        source_type, quality_tier, institution, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const attachSource = database.prepare(
      "INSERT INTO content_sources (content_id, source_id, sort_order) VALUES (?, ?, 0)",
    );
    const attachTag = database.prepare(
      "INSERT INTO content_tags (content_id, tag_id) VALUES (?, ?)",
    );
    const insertMedia = database.prepare(`
      INSERT INTO media (
        id, url, kind, credit, license, alt_vi, alt_en, caption_vi, caption_en,
        width, height, created_at, updated_at
      ) VALUES (?, ?, 'DOCUMENT', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
    `);
    const attachMedia = database.prepare(
      "INSERT INTO content_media (content_id, media_id, sort_order, is_thumbnail) VALUES (?, ?, 0, 0)",
    );

    for (const item of demoContent) {
      insertNode.run(
        item.id,
        item.type,
        item.featured ? 1 : 0,
        item.startDate ?? null,
        item.endDate ?? null,
        item.datePrecision ?? null,
        item.periodId ?? null,
        item.location ?? null,
        englishValue(item.location, englishLocations),
        item.result ?? null,
        englishValue(item.result, englishResults),
        item.role ?? null,
        englishValue(item.role, englishRoles),
        item.artifactMeta ? JSON.stringify(item.artifactMeta) : null,
        item.artifactMeta ? JSON.stringify(englishMetadata(item.artifactMeta)) : null,
        "Ban biên tập Quân Sử Việt",
        now,
        now,
        now,
      );

      for (const locale of ["vi", "en"] as const) {
        const translation = item[locale];
        const translationStatus =
          locale === "en" && item.id === unpublishedEnglishNodeId
            ? "READY_FOR_REVIEW"
            : "PUBLISHED";
        insertTranslation.run(
          `${item.id}-${locale}`,
          item.id,
          locale,
          translation.title,
          translation.slug,
          translation.summary,
          translation.body,
          translation.title,
          translation.summary,
          translationStatus,
          normalizeSearchText(
            `${translation.title} ${translation.summary} ${translation.body}`,
          ),
          now,
          now,
        );
      }

      const sourceId = `source-${item.id}`;
      const governance = sourceGovernance(item.sourceUrl, item.sourcePublisher);
      insertSource.run(
        sourceId,
        item.sourceTitle,
        null,
        item.sourcePublisher,
        null,
        item.sourceUrl,
        now,
        null,
        governance.sourceType,
        governance.qualityTier,
        governance.institution,
        now,
        now,
      );
      attachSource.run(item.id, sourceId);
      for (const tagId of item.tags) attachTag.run(item.id, tagId);
      if (item.type === "ARTIFACT") {
        const mediaId = `media-${item.id}`;
        insertMedia.run(
          mediaId,
          item.sourceUrl,
          item.sourcePublisher,
          "External reference; rights remain with the source publisher.",
          `Tài liệu tham khảo về ${item.vi.title}`,
          `Reference document for ${item.en.title}`,
          `Mở nguồn bên ngoài cho ${item.vi.title}.`,
          `Open the external source for ${item.en.title}.`,
          now,
          now,
        );
        attachMedia.run(item.id, mediaId);
      }
    }

    const relations: Array<[string, string]> = [
      ["event-trung-sisters", "person-trung-sisters"],
      ["event-bach-dang-938", "person-ngo-quyen"],
      ["event-bach-dang-1288", "person-tran-hung-dao"],
      ["event-lam-son", "person-le-loi"],
      ["event-ngoc-hoi", "person-quang-trung"],
      ["event-dien-bien-phu", "person-vo-nguyen-giap"],
      ["event-dien-bien-phu", "artifact-pack-bicycle"],
      ["event-ho-chi-minh-campaign", "artifact-tank-843"],
      ["person-vo-nguyen-giap", "event-dien-bien-phu"],
      ["artifact-bach-dang-stakes", "event-bach-dang-1288"],
    ];
    const insertRelation = database.prepare(
      "INSERT INTO content_relations (content_id, related_id, sort_order) VALUES (?, ?, ?)",
    );
    relations.forEach(([from, to], index) => insertRelation.run(from, to, index));

    const attachCurriculum=database.prepare(`
      INSERT INTO content_curriculum(content_id,requirement_id,as_of,mapped_by,mapped_at)
      VALUES(?,?,?,?,?)
    `);
    for(const mapping of curriculumMappings)attachCurriculum.run(mapping.contentId,mapping.requirementId,mapping.asOf,"user-admin",now);

    const counts = database
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM content_nodes) AS contentNodes,
          (SELECT COUNT(*) FROM content_translations) AS translations,
          (SELECT COUNT(*) FROM sources) AS sources,
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM curriculum_requirements) AS curriculumRequirements,
          (SELECT COUNT(*) FROM content_curriculum) AS curriculumMappings
      `)
      .get() as { contentNodes: number; translations: number; sources: number; users: number; curriculumRequirements:number;curriculumMappings:number };
    const distribution = Object.fromEntries(
      (database
        .prepare("SELECT type, COUNT(*) AS count FROM content_nodes GROUP BY type ORDER BY type")
        .all() as Array<{ type: string; count: number }>).map(({ type, count }) => [type, count]),
    );

    if (counts.contentNodes !== 50 || counts.translations !== 100 || counts.sources < 50 || counts.users !== 3 || counts.curriculumRequirements!==curriculumRequirements.length || counts.curriculumMappings!==curriculumMappings.length) {
      throw new Error(`Seed invariant failed: ${JSON.stringify(counts)}`);
    }
    const expectedDistribution = { ARTIFACT: 10, EVENT: 20, PERIOD: 6, PERSON: 10, TOPIC: 4 };
    if (JSON.stringify(distribution) !== JSON.stringify(expectedDistribution)) {
      throw new Error(`Seed distribution invariant failed: ${JSON.stringify(distribution)}`);
    }
    return counts;
  });

  console.log(JSON.stringify(seed.immediate()));
} finally {
  database.close();
}
