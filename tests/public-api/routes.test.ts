import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase } from "@/lib/db/migrate";
import { GET as home } from "@/app/api/v1/[locale]/home/route";
import { GET as periods } from "@/app/api/v1/[locale]/periods/route";
import { GET as timeline } from "@/app/api/v1/[locale]/timeline/route";
import { GET as contents } from "@/app/api/v1/[locale]/contents/route";
import { GET as detail } from "@/app/api/v1/[locale]/contents/[type]/[slug]/route";
import { GET as search } from "@/app/api/v1/[locale]/search/route";
import { GET as taxonomies } from "@/app/api/v1/[locale]/taxonomies/route";
import { GET as alternate } from "@/app/api/v1/contents/[id]/alternate/route";

const directory = mkdtempSync(join(tmpdir(), "quan-su-viet-public-api-"));
const databasePath = join(directory, "public.db");
const localeContext = (locale: string) => ({ params: Promise.resolve({ locale }) });

beforeAll(() => {
  process.env.DATABASE_PATH = databasePath;
  migrateDatabase(databasePath);
  execFileSync(resolve("node_modules/.bin/tsx"), ["scripts/seed.ts"], {
    cwd: resolve("."), env: { ...process.env, DATABASE_PATH: databasePath }, stdio: "pipe",
  });
});

afterAll(() => {
  delete process.env.DATABASE_PATH;
  rmSync(directory, { recursive: true, force: true });
});

describe("public read API", () => {
  it("returns exact home, period and taxonomy envelopes from published locale rows", async () => {
    const homeResponse = await home(new Request("http://local/api/v1/vi/home"), localeContext("vi"));
    const homeBody = await homeResponse.json();
    expect(homeResponse.status).toBe(200);
    expect(Object.keys(homeBody)).toEqual(["data"]);
    expect(Object.keys(homeBody.data)).toEqual(["featured", "periods", "latest", "counts"]);
    expect(homeBody.data.counts).toEqual({ PERIOD: 6, EVENT: 20, PERSON: 10, ARTIFACT: 10, TOPIC: 4 });

    const periodsResponse = await periods(new Request("http://local/api/v1/vi/periods?includeEmpty=true"), localeContext("vi"));
    const periodsBody = await periodsResponse.json();
    expect(Object.keys(periodsBody)).toEqual(["data", "meta"]);
    expect(periodsBody.data).toHaveLength(6);
    expect(Object.keys(periodsBody.data[0])).toEqual(["id", "title", "slug", "summary", "startYear", "endYear", "contentCount"]);

    const taxonomyResponse = await taxonomies(new Request("http://local/api/v1/vi/taxonomies"), localeContext("vi"));
    const taxonomyBody = await taxonomyResponse.json();
    expect(Object.keys(taxonomyBody.data)).toEqual(["periods", "tags", "types"]);
    expect(taxonomyBody.data.types).toEqual(["PERIOD", "EVENT", "PERSON", "ARTIFACT", "TOPIC"]);
  });

  it("returns exact list/detail shapes, sources and only published translations", async () => {
    const listResponse = await contents(new Request("http://local/api/v1/vi/contents?type=EVENT&pageSize=3"), localeContext("vi"));
    const listBody = await listResponse.json();
    expect(listBody.meta).toEqual({ page: 1, pageSize: 3, total: 20, totalPages: 7 });
    expect(Object.keys(listBody.data[0])).toEqual(["id", "type", "locale", "title", "slug", "summary", "thumbnail", "startDate", "endDate", "datePrecision", "period", "tags"]);

    const detailResponse = await detail(
      new Request("http://local/api/v1/vi/contents/EVENT/chien-dich-dien-bien-phu"),
      { params: Promise.resolve({ locale: "vi", type: "EVENT", slug: "chien-dich-dien-bien-phu" }) },
    );
    const detailBody = await detailResponse.json();
    expect(detailResponse.status).toBe(200);
    expect(Object.keys(detailBody.data)).toEqual([
      "id", "type", "locale", "title", "slug", "summary", "thumbnail", "startDate", "endDate", "datePrecision", "period", "tags",
      "body", "location", "result", "role", "artifactMeta", "media", "sources", "related", "alternate", "reviewedBy", "publishedAt", "updatedAt",
    ]);
    expect(detailBody.data.sources[0]).toEqual({
      id: expect.any(String), title: expect.any(String), author: null,
      publisher: "Encyclopaedia Britannica", year: null,
      url: "https://www.britannica.com/event/Battle-of-Dien-Bien-Phu",
      accessedAt: "2026-08-06T00:00:00.000Z", citationNote: null,
    });

    const englishDetail = await detail(
      new Request("http://local/api/v1/en/contents/EVENT/battle-of-dien-bien-phu"),
      { params: Promise.resolve({ locale: "en", type: "EVENT", slug: "battle-of-dien-bien-phu" }) },
    );
    expect((await englishDetail.json()).data).toMatchObject({
      location: "Dien Bien",
      result: "The French fortified position was defeated",
    });

    const artifact = await detail(
      new Request("http://local/api/v1/vi/contents/ARTIFACT/xe-dap-tho-dien-bien-phu"),
      { params: Promise.resolve({ locale: "vi", type: "ARTIFACT", slug: "xe-dap-tho-dien-bien-phu" }) },
    );
    expect((await artifact.json()).data.media[0]).toMatchObject({
      kind: "DOCUMENT",
      credit: "Encyclopaedia Britannica",
      license: expect.stringContaining("rights remain"),
      alt: expect.stringContaining("Xe đạp thồ"),
    });

    const hiddenEnglish = await detail(
      new Request("http://local/api/v1/en/contents/ARTIFACT/mig-21-aircraft-4324"),
      { params: Promise.resolve({ locale: "en", type: "ARTIFACT", slug: "mig-21-aircraft-4324" }) },
    );
    expect(hiddenEnglish.status).toBe(404);
    expect(await hiddenEnglish.json()).toMatchObject({ code: "CONTENT_NOT_FOUND", requestId: expect.any(String) });
  });

  it("preserves date precision and deterministic id tie-breakers across pagination", async () => {
    const timelineResponse = await timeline(new Request("http://local/api/v1/vi/timeline?pageSize=50"), localeContext("vi"));
    const timelineBody = await timelineResponse.json();
    expect(timelineBody.data).toHaveLength(20);
    expect(new Set(timelineBody.data.map((item: { datePrecision: string }) => item.datePrecision))).toEqual(new Set(["DAY", "MONTH", "YEAR", "APPROXIMATE"]));
    expect(timelineBody.data.find((item: { id: string }) => item.id === "event-trung-sisters")).toMatchObject({ startDate: "0040-01-01", datePrecision: "APPROXIMATE" });

    const first = await (await contents(new Request("http://local/api/v1/vi/contents?sort=updated&page=1&pageSize=5"), localeContext("vi"))).json();
    const second = await (await contents(new Request("http://local/api/v1/vi/contents?sort=updated&page=2&pageSize=5"), localeContext("vi"))).json();
    const repeated = await (await contents(new Request("http://local/api/v1/vi/contents?sort=updated&page=1&pageSize=5"), localeContext("vi"))).json();
    expect(first.data.map((item: { id: string }) => item.id)).toEqual(repeated.data.map((item: { id: string }) => item.id));
    const combined = [...first.data, ...second.data].map((item: { id: string }) => item.id);
    expect(combined).toEqual([...combined].sort());
    expect(new Set(combined).size).toBe(10);
  });

  it("searches Vietnamese with or without accents and keeps filtered pagination metadata", async () => {
    const accented = await (await search(new Request("http://local/api/v1/vi/search?q=Điện%20Biên%20Phủ&type=EVENT&page=1&pageSize=5"), localeContext("vi"))).json();
    const plain = await (await search(new Request("http://local/api/v1/vi/search?q=dien%20bien%20phu&type=EVENT&page=1&pageSize=5"), localeContext("vi"))).json();
    expect(accented.data[0].id).toBe("event-dien-bien-phu");
    expect(plain.data[0].id).toBe(accented.data[0].id);
    expect(plain.meta).toEqual(accented.meta);
    expect(plain.meta).toMatchObject({ page: 1, pageSize: 5 });
  });

  it("returns the matching alternate URL and null for an unpublished EN fixture", async () => {
    const bilingual = await alternate(
      new Request("http://local/api/v1/contents/event-dien-bien-phu/alternate?locale=vi"),
      { params: Promise.resolve({ id: "event-dien-bien-phu" }) },
    );
    expect(await bilingual.json()).toEqual({ data: {
      id: "event-dien-bien-phu",
      current: { locale: "vi", url: "/api/v1/vi/contents/EVENT/chien-dich-dien-bien-phu" },
      alternate: { locale: "en", url: "/api/v1/en/contents/EVENT/battle-of-dien-bien-phu" },
    } });

    const unpublished = await alternate(
      new Request("http://local/api/v1/contents/artifact-mig21-4324/alternate?locale=vi"),
      { params: Promise.resolve({ id: "artifact-mig21-4324" }) },
    );
    expect(unpublished.status).toBe(200);
    expect((await unpublished.json()).data.alternate).toBeNull();
  });

  it.each([
    ["unknown locale", () => contents(new Request("http://local/api/v1/fr/contents"), localeContext("fr")), 404, "LOCALE_NOT_FOUND"],
    ["unknown type", () => contents(new Request("http://local/api/v1/vi/contents?type=BATTLE"), localeContext("vi")), 404, "CONTENT_TYPE_NOT_FOUND"],
    ["invalid page", () => contents(new Request("http://local/api/v1/vi/contents?page=0"), localeContext("vi")), 400, "INVALID_QUERY"],
    ["invalid page size", () => contents(new Request("http://local/api/v1/vi/contents?pageSize=51"), localeContext("vi")), 400, "INVALID_QUERY"],
    ["unsafe page integer", () => contents(new Request("http://local/api/v1/vi/contents?page=999999999999999999999999999"), localeContext("vi")), 400, "INVALID_QUERY"],
    ["missing search query", () => search(new Request("http://local/api/v1/vi/search"), localeContext("vi")), 400, "INVALID_QUERY"],
    ["oversized search query", () => search(new Request(`http://local/api/v1/vi/search?q=${"a".repeat(201)}`), localeContext("vi")), 400, "INVALID_QUERY"],
  ])("rejects %s with the shared ApiError shape", async (_label, call, status, code) => {
    const response = await call();
    const body = await response.json();
    expect(response.status).toBe(status);
    expect(body).toMatchObject({ code, message: expect.any(String), requestId: expect.any(String) });
  });
});
