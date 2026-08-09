import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { alternateApiToPublicPath,contentCollectionPath,contentPath,contentTypeFromLocaleSegment,searchPath,timelinePath,withQuery } from "@/lib/public-client/paths";
import { createPublicClient,PublicClientError } from "@/lib/public-client/client";

describe("public bilingual navigation contract",()=>{
  it("maps canonical paths without leaking API URLs",()=>{
    expect(contentPath("vi","EVENT","chien-dich-dien-bien-phu")).toBe("/vi/su-kien/chien-dich-dien-bien-phu");
    expect(contentPath("en","EVENT","battle-of-dien-bien-phu")).toBe("/en/events/battle-of-dien-bien-phu");
    expect(contentCollectionPath("vi","PERSON")).toBe("/vi/nhan-vat");
    expect(contentCollectionPath("en","ARTIFACT","?page=2")).toBe("/en/artifacts?page=2");
    expect(contentTypeFromLocaleSegment("vi","su-kien")).toBe("EVENT");
    expect(contentTypeFromLocaleSegment("en","su-kien")).toBeNull();
    expect(alternateApiToPublicPath("/api/v1/en/contents/EVENT/battle-of-dien-bien-phu")).toBe("/en/events/battle-of-dien-bien-phu");
    expect(alternateApiToPublicPath("/api/v1/en/unknown")).toBeNull();
  });

  it("keeps search and pagination state shareable",()=>{
    expect(searchPath("vi")).toBe("/vi/tim-kiem");
    expect(searchPath("en")).toBe("/en/search");
    expect(timelinePath("vi","?period=period-independence-wars")).toBe("/vi/timeline?period=period-independence-wars");
    expect(withQuery(searchPath("vi"),{q:"dien bien phu",type:"EVENT",period:undefined,page:2})).toBe("/vi/tim-kiem?q=dien+bien+phu&type=EVENT&page=2");
  });
});

describe("public HTTP client",()=>{
  const fetcher=vi.fn<typeof fetch>();
  beforeEach(()=>fetcher.mockReset());
  afterEach(()=>vi.restoreAllMocks());

  it("requests the exact planning-contract endpoint and query",async()=>{
    fetcher.mockResolvedValue(new Response(JSON.stringify({data:[{id:"event-dien-bien-phu"}],meta:{page:1,pageSize:10,total:1,totalPages:1}}),{status:200,headers:{"content-type":"application/json"}}));
    const client=createPublicClient({origin:"http://public.test",fetcher});
    const result=await client.search("vi",new URLSearchParams({q:"dien bien phu",type:"EVENT",page:"1",pageSize:"10"}));
    expect(result.data[0]).toEqual({id:"event-dien-bien-phu"});
    const [request,init]=fetcher.mock.calls[0];
    expect(String(request)).toBe("http://public.test/api/v1/vi/search?q=dien+bien+phu&type=EVENT&page=1&pageSize=10");
    expect(init).toMatchObject({cache:"no-store",headers:{accept:"application/json"}});
  });

  it("preserves API status and code for route-level error states",async()=>{
    fetcher.mockResolvedValue(new Response(JSON.stringify({code:"CONTENT_NOT_FOUND",message:"Không tồn tại",requestId:"req-1"}),{status:404}));
    const client=createPublicClient({origin:"http://public.test",fetcher});
    await expect(client.detail("vi","EVENT","missing")).rejects.toEqual(expect.objectContaining<Partial<PublicClientError>>({status:404,code:"CONTENT_NOT_FOUND",message:"Không tồn tại"}));
  });

  it("supports type browsing without requiring a search term",async()=>{
    fetcher.mockResolvedValue(new Response(JSON.stringify({data:[],meta:{page:1,pageSize:10,total:0,totalPages:0}}),{status:200}));
    const client=createPublicClient({origin:"http://public.test",fetcher});
    await client.contents("vi",new URLSearchParams({type:"EVENT",page:"1",pageSize:"10"}));
    expect(String(fetcher.mock.calls[0][0])).toBe("http://public.test/api/v1/vi/contents?type=EVENT&page=1&pageSize=10");
  });
});
