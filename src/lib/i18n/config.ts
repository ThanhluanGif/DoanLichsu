import type { ContentType, Locale } from "@/lib/content/types";

export const publicLocales = ["vi", "en"] as const satisfies readonly Locale[];

export function isPublicLocale(value: string): value is Locale {
  return publicLocales.includes(value as Locale);
}

export function requirePublicLocale(value: string): Locale {
  if (!isPublicLocale(value)) throw new Error(`Unsupported locale: ${value}`);
  return value;
}

export const contentTypeLabels: Record<Locale, Record<ContentType, string>> = {
  vi: { PERIOD:"Thời kỳ",EVENT:"Sự kiện",PERSON:"Nhân vật",ARTIFACT:"Hiện vật",TOPIC:"Chủ đề" },
  en: { PERIOD:"Period",EVENT:"Event",PERSON:"Person",ARTIFACT:"Artifact",TOPIC:"Topic" },
};

export const messages = {
  vi: {
    brandSubtitle:"Vietnamese Military History",navTimeline:"Dòng thời gian",navExplore:"Khám phá",navSources:"Nguồn tư liệu",
    switchLabel:"Chuyển sang tiếng Anh",search:"Tìm kiếm",searchPlaceholder:"Nhập sự kiện, nhân vật hoặc hiện vật",skip:"Chuyển đến nội dung",
    homeEyebrow:"Kho tư liệu song ngữ có kiểm chứng",homeTitle:"Theo dòng lịch sử giữ nước của dân tộc Việt Nam",
    homeLead:"Khám phá các thời kỳ, sự kiện, nhân vật và hiện vật qua một dòng thời gian rõ ràng — mỗi nội dung đều dẫn về nguồn tham khảo.",
    exploreTimeline:"Khám phá dòng thời gian",lookup:"Tra cứu nội dung",verifiedCopy:"Nội dung đã xuất bản được đối chiếu nguồn và ghi ngày cập nhật",
    timelineEyebrow:"Khám phá theo thời gian",timelineTitle:"Một lát cắt xuyên suốt lịch sử",allPeriods:"Xem toàn bộ dòng thời gian",
    featuredEyebrow:"Nội dung tiêu biểu",featuredTitle:"Bắt đầu từ những câu chuyện nổi bật",latestTitle:"Mới cập nhật",
    periodUnit:"thời kỳ",eventUnit:"sự kiện",personUnit:"nhân vật",artifactUnit:"hiện vật",sourceUnit:"nguồn",
    searchEyebrow:"Tra cứu nhanh",searchTitle:"Tìm một mốc, một người, một hiện vật",searchHint:"Tìm được cả khi nhập không dấu. Bộ lọc được giữ trong đường dẫn để bạn có thể chia sẻ đúng kết quả.",
    all:"Tất cả",filterType:"Loại nội dung",filterPeriod:"Thời kỳ",sort:"Sắp xếp",sortRelevance:"Liên quan nhất",sortChronology:"Theo thời gian",sortUpdated:"Mới cập nhật",sortTitle:"Theo tiêu đề",
    results:"kết quả",forQuery:"cho",noResults:"Chưa tìm thấy nội dung phù hợp.",noResultsHint:"Thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc.",
    timelineTitlePage:"Dòng thời gian lịch sử quân sự Việt Nam",timelineLead:"Theo dõi các sự kiện đã xuất bản theo niên đại và từng thời kỳ.",
    previous:"Trang trước",next:"Trang sau",page:"Trang",home:"Trang chủ",sources:"Nguồn tham khảo",related:"Nội dung liên quan",
    context:"Bối cảnh và diễn biến",result:"Kết quả",location:"Địa điểm",time:"Thời gian",updated:"Cập nhật",reviewed:"Đã kiểm tra nguồn",
    readEnglish:"Đọc bản tiếng Anh",readVietnamese:"Đọc bản tiếng Việt",alternateMissing:"Bản tiếng Anh của nội dung này chưa được xuất bản.",
    alternateMissingEn:"The Vietnamese edition of this content is not published yet.",copyLink:"Sao chép liên kết",copied:"Đã sao chép",backToTimeline:"Trở lại dòng thời gian",
    loading:"Đang tải nội dung đã xuất bản…",errorTitle:"Không thể tải kho tư liệu",errorCopy:"Vui lòng thử lại sau ít phút.",retry:"Thử lại",
    sourcesEyebrow:"Tài liệu đã đối chiếu",sourcesTitlePage:"Danh mục nguồn tư liệu",sourcesLead:"Tra cứu các tài liệu tham khảo đang được dùng trong nội dung đã xuất bản. Mỗi đường dẫn chỉ xuất hiện một lần.",sourceUsedByOne:"nội dung sử dụng",sourceUsedByMany:"nội dung sử dụng",sourcesAccessed:"Truy cập",openSource:"Mở nguồn",sourceDirectoryCta:"Xem danh mục nguồn",
    footer:"Ưu tiên nguồn rõ ràng, ngôn ngữ nhất quán và khả năng tiếp cận.",emptyTimeline:"Chưa có sự kiện đã xuất bản cho bộ lọc này.",
  },
  en: {
    brandSubtitle:"Lịch sử quân sự Việt Nam",navTimeline:"Timeline",navExplore:"Explore",navSources:"Sources",
    switchLabel:"Switch to Vietnamese",search:"Search",searchPlaceholder:"Enter an event, person, or artifact",skip:"Skip to content",
    homeEyebrow:"A verified bilingual archive",homeTitle:"Follow Vietnam’s history of national defence",
    homeLead:"Explore periods, events, people, and artifacts through a clear timeline, with every published story connected to its sources.",
    exploreTimeline:"Explore the timeline",lookup:"Search the archive",verifiedCopy:"Published entries are source-checked and carry an update date",
    timelineEyebrow:"Explore through time",timelineTitle:"A continuous view across centuries",allPeriods:"View the full timeline",
    featuredEyebrow:"Featured stories",featuredTitle:"Begin with key moments and objects",latestTitle:"Recently updated",
    periodUnit:"periods",eventUnit:"events",personUnit:"people",artifactUnit:"artifacts",sourceUnit:"sources",
    searchEyebrow:"Search the archive",searchTitle:"Find a moment, a person, or an artifact",searchHint:"Search works without Vietnamese diacritics. Filters stay in the URL so the exact view can be shared.",
    all:"All",filterType:"Content type",filterPeriod:"Period",sort:"Sort",sortRelevance:"Most relevant",sortChronology:"Chronological",sortUpdated:"Recently updated",sortTitle:"By title",
    results:"results",forQuery:"for",noResults:"No published content matched this search.",noResultsHint:"Try a shorter query or remove a filter.",
    timelineTitlePage:"Vietnamese military history timeline",timelineLead:"Follow published events chronologically and by historical period.",
    previous:"Previous",next:"Next",page:"Page",home:"Home",sources:"References",related:"Related content",
    context:"Context and account",result:"Result",location:"Location",time:"Date",updated:"Updated",reviewed:"Sources checked",
    readEnglish:"Read in English",readVietnamese:"Đọc bản tiếng Việt",alternateMissing:"The other language edition of this content is not published yet.",
    alternateMissingEn:"The Vietnamese edition of this content is not published yet.",copyLink:"Copy link",copied:"Copied",backToTimeline:"Back to timeline",
    loading:"Loading published content…",errorTitle:"The archive could not be loaded",errorCopy:"Please try again in a moment.",retry:"Try again",
    sourcesEyebrow:"Checked references",sourcesTitlePage:"Source directory",sourcesLead:"Browse the references used by published entries. Each destination appears only once.",sourceUsedByOne:"published entry",sourceUsedByMany:"published entries",sourcesAccessed:"Accessed",openSource:"Open source",sourceDirectoryCta:"View source directory",
    footer:"Clear sources, consistent language, and accessible reading come first.",emptyTimeline:"No published events match this filter yet.",
  },
} as const;

export function t(locale: Locale) {
  return messages[locale];
}
