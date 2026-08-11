export const grade6BatchAsOf = "2026-08-11T00:00:00.000Z";

export type Grade6SourceSeed = {
  id: string;
  title: string;
  publisher: string;
  year: number | null;
  url: string;
  sourceType: "PRIMARY_RECORD" | "MUSEUM_CATALOG" | "REFERENCE_WORK";
  qualityTier: "TIER_1_PRIMARY" | "TIER_2_INSTITUTIONAL";
  institution: string;
  identifier: string | null;
  verificationNote: string;
};

export type Grade6ClaimSeed = {
  id: string;
  claimType: "DATE" | "PLACE" | "OUTCOME" | "INTERPRETATION" | "CONTEXT";
  assessment: "CONFIRMED" | "DISPUTED";
  statementVi: string;
  statementEn: string;
  sourceId: string;
  locator: string;
  note: string;
};

type Grade6LocaleSeed = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  learningObjectives: string[];
  originalSummary: string;
  analysis: string;
  debates: Array<{ title: string; summary: string; claimIds: string[] }>;
};

export type Grade6LessonSeed = {
  id: string;
  requirementId: string;
  sourceIds: string[];
  vi: Grade6LocaleSeed;
  en: Grade6LocaleSeed;
  claims: Grade6ClaimSeed[];
};

export const grade6Sources: Grade6SourceSeed[] = [
  {
    id: "source-g6-official-programme",
    title: "Thông tư 17/2025/TT-BGDĐT và tài liệu Chương trình giáo dục phổ thông",
    publisher: "Bộ Giáo dục và Đào tạo",
    year: 2025,
    url: "https://vanban.chinhphu.vn/?docid=215347&pageid=27160&typegroupid=6",
    sourceType: "PRIMARY_RECORD",
    qualityTier: "TIER_1_PRIMARY",
    institution: "Bộ Giáo dục và Đào tạo",
    identifier: "17/2025/TT-BGDĐT; cập nhật chương trình theo 32/2018/TT-BGDĐT",
    verificationNote: "Đã kiểm tra cơ quan ban hành, hiệu lực và tài liệu 17-bgddt.pdf đính kèm trên Cổng Thông tin điện tử Chính phủ; các mục lớp 6 được đối chiếu với chương trình hợp nhất đã lập chỉ mục. Đây là nguồn chương trình, không phải nguồn duy nhất cho dữ kiện lịch sử.",
  },
  {
    id: "source-g6-smithsonian-human-evolution",
    title: "Human Evolution Evidence",
    publisher: "Smithsonian Institution Human Origins Program",
    year: null,
    url: "https://humanorigins.si.edu/evidence",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Smithsonian Institution",
    identifier: null,
    verificationNote: "Đã kiểm tra trang chương trình nghiên cứu của Smithsonian và các mục fossil, behaviour, genetics, dating; nội dung bài là diễn giải gốc ở mức lớp 6.",
  },
  {
    id: "source-g6-british-museum-ancient-world",
    title: "Schools resources for ages 7–11",
    publisher: "British Museum",
    year: null,
    url: "https://www.britishmuseum.org/learn/schools/ages-7-11",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "British Museum",
    identifier: null,
    verificationNote: "Đã kiểm tra các nhóm tài nguyên Ancient Egypt, Ancient Greece, Ancient Rome và Middle East and Asia; không sao chép tài liệu học tập của bảo tàng.",
  },
  {
    id: "source-g6-unesco-silk-roads",
    title: "About the Silk Roads",
    publisher: "UNESCO",
    year: null,
    url: "https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO",
    identifier: "UNESCO Silk Roads Programme",
    verificationNote: "Đã kiểm tra các mục về mạng đường bộ, đường biển và trao đổi hàng hóa, tri thức, kỹ thuật, tín ngưỡng giữa các xã hội Á–Âu.",
  },
  {
    id: "source-g6-vnmh-dong-son",
    title: "Văn hóa Đông Sơn ở Việt Nam - 90 năm phát hiện và nghiên cứu (Phần 1)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2014,
    url: "https://baotanglichsu.vn/VI/Articles/3101/16655/van-hoa-djong-son-o-viet-nam-90-nam-phat-hien-va-nghien-cuu-phan-1.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-3101-16655",
    verificationNote: "Đã kiểm tra niên đại, phạm vi khảo cổ và nhận định về cơ sở vật chất của các nhà nước sơ khai; bài học tách bằng chứng khảo cổ khỏi truyền thuyết.",
  },
  {
    id: "source-g6-vnmh-independence",
    title: "Struggles to gain national independence, 1st–10th centuries AD",
    publisher: "Vietnam National Museum of History",
    year: null,
    url: "https://baotanglichsu.vn/en/Articles/4198/struggles-to-gain-national-independence-1st-10th-centuries-ad",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-4198-independence",
    verificationNote: "Đã kiểm tra chuỗi khởi nghĩa tiêu biểu và mốc Bạch Đằng 938 trên trang trưng bày của Bảo tàng Lịch sử Quốc gia.",
  },
  {
    id: "source-g6-unesco-my-son",
    title: "My Son Sanctuary",
    publisher: "UNESCO World Heritage Centre",
    year: null,
    url: "https://whc.unesco.org/en/list/949/",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO World Heritage Centre",
    identifier: "World Heritage List 949",
    verificationNote: "Đã kiểm tra brief synthesis và criteria (ii), (iii) về niên đại, vai trò của Mỹ Sơn và sự giao lưu văn hóa của Chăm-pa.",
  },
  {
    id: "source-g6-vnmh-funan",
    title: "Vương quốc Phù Nam qua cổ vật",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2012,
    url: "https://baotanglichsu.vn/vi/Articles/2001/66242/vuong-quoc-phu-nam-qua-co-vat.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-2001-66242",
    verificationNote: "Đã kiểm tra phần trình bày quan hệ giữa tư liệu khảo cổ Óc Eo, giao thương và lịch sử Phù Nam; bài học không đồng nhất máy móc văn hóa khảo cổ với toàn bộ nhà nước.",
  },
];

export const grade6Lessons: Grade6LessonSeed[] = [
  {
    id: "lesson-g6-why-study-history",
    requirementId: "g6-why-study-history",
    sourceIds: ["source-g6-official-programme"],
    vi: {
      title: "Học lịch sử từ dấu vết và thời gian",
      slug: "hoc-lich-su-tu-dau-vet-va-thoi-gian",
      summary: "Lịch sử được tìm hiểu từ nhiều loại tư liệu; người học phải đặt câu hỏi về người tạo nguồn, hoàn cảnh và cách xác định thời gian.",
      body: "Quá khứ đã xảy ra không thể lặp lại nguyên vẹn trước mắt chúng ta. Người học tiếp cận quá khứ qua dấu vết còn lại như hiện vật, di tích, văn bản, hình ảnh, lời kể và dữ liệu khảo cổ. Mỗi loại tư liệu trả lời một nhóm câu hỏi khác nhau và đều cần được đặt trong bối cảnh.\n\nThời gian giúp sắp xếp sự kiện và nhận ra quan hệ trước–sau. Thập kỉ, thế kỉ, thiên niên kỉ, trước Công nguyên và Công nguyên là các quy ước để biểu đạt mốc thời gian; ngày tháng trong sử liệu có thể chính xác, xấp xỉ hoặc chỉ biết theo khoảng.\n\nHọc lịch sử vì thế không phải chỉ ghi nhớ đáp án. Đó là quá trình nêu câu hỏi, kiểm tra bằng chứng, phân biệt dữ kiện với diễn giải và sẵn sàng điều chỉnh nhận định khi xuất hiện tư liệu tốt hơn.",
      learningObjectives: [
        "Phân biệt quá khứ đã xảy ra với hiểu biết được dựng lại từ tư liệu.",
        "Nhận diện tư liệu hiện vật, chữ viết, hình ảnh và truyền miệng.",
        "Sử dụng đúng thập kỉ, thế kỉ, thiên niên kỉ, trước Công nguyên và Công nguyên.",
      ],
      originalSummary: "Môn Lịch sử tìm hiểu quá khứ bằng cách kiểm tra nhiều loại tư liệu và đặt chúng trên một trục thời gian có quy ước rõ ràng.",
      analysis: "Một nguồn có thể rất gần sự kiện nhưng vẫn mang góc nhìn của người tạo ra nó. Ngược lại, công trình viết muộn hơn có thể tổng hợp nhiều bằng chứng nhưng phụ thuộc cách lựa chọn của tác giả. Vì vậy độ tin cậy không được quyết định chỉ bằng tuổi của tài liệu. Người học cần hỏi nguồn do ai tạo, nhằm mục đích gì, còn nguyên vẹn không, và có thể đối chiếu với nguồn nào khác.",
      debates: [{
        title: "Tư liệu có tự nói lên toàn bộ sự thật không?",
        summary: "Tư liệu là bằng chứng cần thiết nhưng luôn phải được đọc trong bối cảnh; cùng một dấu vết có thể dẫn tới những cách giải thích cần tiếp tục kiểm tra.",
        claimIds: ["claim-g6-why-study-history-evidence"],
      }],
    },
    en: {
      title: "Learning history from evidence and time",
      slug: "learning-history-from-evidence-and-time",
      summary: "History is studied through different kinds of evidence; learners ask who created a source, in what setting, and how its dates are known.",
      body: "The past cannot be replayed in front of us. Learners approach it through surviving traces such as objects, sites, written records, images, oral accounts, and archaeological data. Each kind of evidence answers different questions and needs context.\n\nTime helps arrange events and examine what came before or after. Decades, centuries, millennia, BCE, and CE are conventions for expressing historical time. A historical date may be exact, approximate, or known only as a range.\n\nLearning history is therefore more than memorising an answer. It involves asking questions, checking evidence, distinguishing facts from interpretations, and revising an explanation when better evidence appears.",
      learningObjectives: [
        "Distinguish the historical past from knowledge reconstructed through evidence.",
        "Recognise material, written, visual, and oral sources.",
        "Use decades, centuries, millennia, BCE, and CE correctly.",
      ],
      originalSummary: "History investigates the past by checking different sources and arranging evidence on a clearly defined timeline.",
      analysis: "A source may be close to an event and still express the perspective of its creator. A later study may compare more evidence but depends on the author's selection and method. Reliability is therefore not decided by age alone. Learners should ask who created the source, why it was created, whether it survives intact, and what other evidence can test it.",
      debates: [{
        title: "Does a source tell the whole truth by itself?",
        summary: "Evidence is essential but must be read in context; the same trace can support interpretations that need further testing.",
        claimIds: ["claim-g6-why-study-history-evidence"],
      }],
    },
    claims: [
      {
        id: "claim-g6-why-study-history-evidence",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Yêu cầu lớp 6 đặt việc nhận diện và đánh giá nguồn tư liệu vào nền tảng của năng lực tìm hiểu lịch sử.",
        statementEn: "The Grade 6 programme places the recognition and assessment of sources at the foundation of historical enquiry.",
        sourceId: "source-g6-official-programme",
        locator: "Lớp 6 — Tại sao cần học Lịch sử? — Dựa vào đâu để biết và dựng lại lịch sử?",
        note: "Claim mô tả yêu cầu chương trình; các ví dụ và lời giải thích trong bài do dự án biên soạn gốc.",
      },
      {
        id: "claim-g6-why-study-history-time",
        claimType: "DATE",
        assessment: "CONFIRMED",
        statementVi: "Chương trình lớp 6 yêu cầu người học sử dụng các khái niệm thập kỉ, thế kỉ, thiên niên kỉ, trước Công nguyên và Công nguyên.",
        statementEn: "The Grade 6 programme requires learners to use decades, centuries, millennia, BCE, and CE.",
        sourceId: "source-g6-official-programme",
        locator: "Lớp 6 — Tại sao cần học Lịch sử? — Thời gian trong lịch sử",
        note: "Không ép mọi mốc lịch sử thành ngày chính xác; ứng dụng giữ date precision riêng.",
      },
    ],
  },
  {
    id: "lesson-g6-human-origins",
    requirementId: "g6-human-origins",
    sourceIds: ["source-g6-smithsonian-human-evolution"],
    vi: {
      title: "Nguồn gốc loài người và đời sống nguyên thủy",
      slug: "nguon-goc-loai-nguoi-va-doi-song-nguyen-thuy",
      summary: "Hóa thạch, công cụ, dấu chân, di truyền và phương pháp định tuổi giúp nghiên cứu quá trình tiến hóa cùng đời sống của người nguyên thủy.",
      body: "Lịch sử loài người kéo dài sâu hơn rất nhiều so với thời đại có chữ viết. Các nhà nghiên cứu kết hợp hóa thạch, công cụ đá, dấu chân, dấu vết bếp lửa, nghệ thuật sớm, dữ liệu di truyền và phương pháp định tuổi để dựng lại những giai đoạn xa xưa.\n\nTiến hóa của loài người không phải một hàng thẳng trong đó loài sau lần lượt thay thế loài trước. Nhiều nhóm người cổ từng cùng tồn tại; ngày nay Homo sapiens là loài người còn tồn tại. Lao động, chế tác công cụ, kiếm thức ăn, hợp tác xã hội và thích nghi với môi trường thay đổi dần qua thời gian.\n\nTư liệu tiền sử thường không đầy đủ. Nhà nghiên cứu có thể thống nhất về nền tảng tiến hóa nhưng còn tranh luận về quan hệ chính xác giữa một số nhánh và cách diễn giải từng phát hiện mới.",
      learningObjectives: [
        "Kể tên các nhóm bằng chứng chính dùng để nghiên cứu nguồn gốc loài người.",
        "Giải thích vì sao tiến hóa loài người không phải một đường thẳng đơn giản.",
        "Liên hệ công cụ, lao động và thích nghi với đời sống cộng đồng nguyên thủy.",
      ],
      originalSummary: "Nguồn gốc và đời sống người nguyên thủy được nghiên cứu bằng nhiều nhóm bằng chứng khoa học, trong đó mỗi phát hiện mới có thể làm rõ thêm một phần bức tranh.",
      analysis: "Hóa thạch cho biết đặc điểm cơ thể; công cụ và dấu vết cư trú cho biết hành vi; di truyền giúp xem quan hệ và di chuyển; định tuổi đặt chúng vào thời gian. Không một nhóm bằng chứng nào đủ cho mọi câu hỏi. Việc so sánh nhiều loại dữ liệu giúp tránh biến một mẫu vật đơn lẻ thành kết luận quá rộng.",
      debates: [{
        title: "Cây tiến hóa có bao nhiêu nhánh?",
        summary: "Sự tồn tại của tiến hóa người có nền tảng bằng chứng rộng, nhưng quan hệ chính xác giữa một số loài và nhánh vẫn được nghiên cứu và điều chỉnh.",
        claimIds: ["claim-g6-human-origins-branches"],
      }],
    },
    en: {
      title: "Human origins and early society",
      slug: "human-origins-and-early-society",
      summary: "Fossils, tools, footprints, genetics, and dating methods help researchers study human evolution and early ways of life.",
      body: "Human history reaches far beyond the age of writing. Researchers combine fossils, stone tools, footprints, hearths, early art, genetic data, and dating methods to investigate the distant past.\n\nHuman evolution was not a straight line in which one species simply replaced the next. Several early human groups existed at the same time; Homo sapiens is the surviving human species today. Toolmaking, obtaining food, social cooperation, and adaptation changed over long periods.\n\nPrehistoric evidence is incomplete. Researchers can agree on the broad evidence for evolution while debating the exact relationships among some branches and the meaning of new discoveries.",
      learningObjectives: [
        "Name the principal forms of evidence used to study human origins.",
        "Explain why human evolution is not a simple straight line.",
        "Connect tools, labour, adaptation, and early social life.",
      ],
      originalSummary: "Human origins and early society are studied through several forms of scientific evidence, and each new discovery can clarify part of the wider picture.",
      analysis: "Fossils describe bodies; tools and sites describe behaviour; genetics helps investigate relationships and movement; dating places evidence in time. No single category answers every question. Comparing different evidence prevents one specimen from being stretched into an overly broad conclusion.",
      debates: [{
        title: "How many branches belong on the human family tree?",
        summary: "Human evolution has a broad evidential foundation, while the exact relationships among some species and branches remain under study.",
        claimIds: ["claim-g6-human-origins-branches"],
      }],
    },
    claims: [
      {
        id: "claim-g6-human-origins-evidence",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Nghiên cứu tiến hóa người kết hợp hóa thạch, công cụ và dấu vết hành vi, di truyền cùng phương pháp định tuổi.",
        statementEn: "Research on human evolution combines fossils, tools and behavioural traces, genetics, and dating methods.",
        sourceId: "source-g6-smithsonian-human-evolution",
        locator: "Evidence of Evolution — Human Fossils, Behavior, Genetics, Dating",
        note: "Bài học rút gọn khái niệm cho lớp 6 và không sao chép mô tả của Smithsonian.",
      },
      {
        id: "claim-g6-human-origins-branches",
        claimType: "INTERPRETATION",
        assessment: "CONFIRMED",
        statementVi: "Cây tiến hóa người có nhiều nhánh; các nhà nghiên cứu còn tranh luận về quan hệ chính xác giữa một số nhóm.",
        statementEn: "The human family tree has many branches, and researchers still debate the exact relationships among some groups.",
        sourceId: "source-g6-smithsonian-human-evolution",
        locator: "Human Fossils — Fossil Evidence",
        note: "Claim xác nhận sự tồn tại của tranh luận khoa học, không tự chọn một sơ đồ phân loại làm đáp án cuối cùng.",
      },
    ],
  },
  {
    id: "lesson-g6-ancient-civilisations",
    requirementId: "g6-ancient-civilisations",
    sourceIds: ["source-g6-british-museum-ancient-world", "source-g6-unesco-silk-roads"],
    vi: {
      title: "Đọc các nền văn minh cổ qua thành tựu và giao lưu",
      slug: "doc-cac-nen-van-minh-co-qua-thanh-tuu-va-giao-luu",
      summary: "Ai Cập, Lưỡng Hà, Ấn Độ, Trung Hoa, Hy Lạp và La Mã để lại những thành tựu khác nhau về đô thị, chữ viết, nhà nước, khoa học, nghệ thuật và luật pháp.",
      body: "Những xã hội cổ đại phát triển trong các môi trường khác nhau và không đi theo một con đường duy nhất. Ai Cập gắn với thung lũng sông Nile và kiến trúc đá; Lưỡng Hà nổi bật với đô thị, chữ hình nêm và truyền thống luật; lưu vực Ấn phát triển đô thị quy hoạch; Trung Hoa duy trì chữ viết và kỹ thuật thủ công; Hy Lạp để lại di sản về polis, triết học và nghệ thuật; La Mã phát triển luật, kỹ thuật và quản trị trên phạm vi rộng.\n\nCác thành tựu ấy được nghiên cứu qua di tích, hiện vật, chữ viết và môi trường khảo cổ. Không nên xếp các nền văn minh thành một bảng hơn–kém đơn giản vì mỗi xã hội giải quyết những điều kiện riêng.\n\nĐường bộ và đường biển kết nối nhiều khu vực. Hàng hóa đi cùng kỹ thuật, tín ngưỡng, hình thức nghệ thuật và tri thức, nhưng mỗi cộng đồng tiếp nhận rồi biến đổi chúng theo bối cảnh của mình.",
      learningObjectives: [
        "Nêu một số thành tựu tiêu biểu của sáu không gian văn minh cổ đại trong chương trình.",
        "Nhận diện hiện vật, kiến trúc và chữ viết như bằng chứng lịch sử.",
        "Giải thích vì sao giao lưu không làm các nền văn minh trở nên giống hệt nhau.",
      ],
      originalSummary: "Các nền văn minh cổ để lại hệ thống thành tựu đa dạng và luôn tồn tại trong những mạng giao lưu rộng hơn biên giới của một nhà nước.",
      analysis: "So sánh có ích khi cùng đặt một câu hỏi—chẳng hạn cách tổ chức đô thị hoặc lưu giữ chữ viết—nhưng trở nên sai lệch nếu dùng một tiêu chí hiện đại để xếp hạng mọi xã hội. Hiện vật bảo tàng cho thấy kỹ thuật và đời sống; tuyến giao lưu cho thấy ý tưởng không tồn tại trong cô lập. Hai góc nhìn cần được dùng cùng nhau.",
      debates: [{
        title: "Có thể dùng một thước đo chung để xếp hạng văn minh không?",
        summary: "Khái niệm thành tựu phụ thuộc câu hỏi nghiên cứu; so sánh cần chỉ rõ tiêu chí và tránh biến khác biệt thành thứ bậc đơn giản.",
        claimIds: ["claim-g6-ancient-civilisations-evidence"],
      }],
    },
    en: {
      title: "Reading ancient civilisations through achievements and exchange",
      slug: "reading-ancient-civilisations-through-achievements-and-exchange",
      summary: "Egypt, Mesopotamia, India, China, Greece, and Rome left different achievements in cities, writing, government, science, art, and law.",
      body: "Ancient societies developed in different environments and did not follow one route. Egypt was closely connected to the Nile valley and monumental stone building; Mesopotamia to cities, cuneiform, and legal traditions; the Indus region to planned cities; China to durable writing and crafts; Greece to the polis, philosophy, and art; and Rome to law, engineering, and administration across a wide territory.\n\nThese achievements are studied through sites, objects, written records, and archaeological settings. Civilisations should not be arranged in a simple ladder because each society responded to particular conditions.\n\nLand and maritime routes connected many regions. Goods travelled with techniques, beliefs, artistic forms, and knowledge, but communities adapted them to local contexts rather than becoming identical.",
      learningObjectives: [
        "Identify representative achievements of the six ancient cultural regions in the programme.",
        "Recognise objects, architecture, and writing as historical evidence.",
        "Explain why exchange did not make civilisations identical.",
      ],
      originalSummary: "Ancient civilisations left diverse achievements and participated in networks of exchange extending beyond the borders of a single state.",
      analysis: "Comparison works when it asks the same question—such as how cities were organised or writing preserved—but misleads when a modern criterion is used to rank every society. Museum objects illuminate technology and life; exchange routes reveal that ideas did not exist in isolation. Both views are needed.",
      debates: [{
        title: "Can one scale rank every civilisation?",
        summary: "What counts as an achievement depends on the research question; comparison needs explicit criteria and should not turn difference into a simple hierarchy.",
        claimIds: ["claim-g6-ancient-civilisations-evidence"],
      }],
    },
    claims: [
      {
        id: "claim-g6-ancient-civilisations-evidence",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Hiện vật và bộ sưu tập bảo tàng là nguồn quan trọng để học về Ai Cập, Tây Á, Hy Lạp và La Mã cổ đại.",
        statementEn: "Museum objects and collections are important sources for learning about ancient Egypt, Western Asia, Greece, and Rome.",
        sourceId: "source-g6-british-museum-ancient-world",
        locator: "Discover sessions and resources — Ancient Egypt, Ancient Greece, Ancient Rome, Middle East and Asia",
        note: "Bài học không tái sử dụng hình hoặc worksheet của bảo tàng.",
      },
      {
        id: "claim-g6-ancient-civilisations-exchange",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Các mạng giao lưu đường bộ và đường biển kết nối nhiều xã hội cổ, chuyên chở cả hàng hóa, kỹ thuật, tri thức và tín ngưỡng.",
        statementEn: "Land and maritime networks connected many ancient societies and carried goods, techniques, knowledge, and beliefs.",
        sourceId: "source-g6-unesco-silk-roads",
        locator: "About the Silk Roads — Routes of Dialogue",
        note: "Dùng để giải thích giao lưu; không coi thuật ngữ hiện đại Silk Roads là tên người cổ đại tự dùng cho toàn mạng lưới.",
      },
    ],
  },
  {
    id: "lesson-g6-southeast-asia-to-tenth-century",
    requirementId: "g6-southeast-asia-to-tenth-century",
    sourceIds: ["source-g6-unesco-silk-roads", "source-g6-unesco-my-son", "source-g6-vnmh-funan"],
    vi: {
      title: "Đông Nam Á đến thế kỉ X: vương quốc và mạng giao lưu",
      slug: "dong-nam-a-den-the-ki-x-vuong-quoc-va-mang-giao-luu",
      summary: "Các cộng đồng Đông Nam Á hình thành nhiều trung tâm và vương quốc, kết nối bằng sông, biển và những mạng trao đổi văn hóa rộng lớn.",
      body: "Đông Nam Á gồm lục địa, bán đảo và nhiều quần đảo, vì vậy đường sông và đường biển có vai trò đặc biệt. Từ những thế kỉ đầu Công nguyên, các trung tâm cư trú và quyền lực phát triển tại nhiều lưu vực, đồng bằng và cửa biển.\n\nGiao thương nối khu vực với Ấn Độ Dương và biển Đông. Hàng hóa, chữ viết, tín ngưỡng và nghệ thuật được tiếp nhận có chọn lọc. Dấu tích Chăm-pa, Óc Eo–Phù Nam cùng các di sản ở nhiều quốc gia cho thấy giao lưu sâu rộng nhưng không xóa đi nền tảng và cách sáng tạo của cư dân địa phương.\n\nKhông nên kể lịch sử khu vực như lịch sử của một dân tộc hay một đế chế duy nhất. Mỗi vương quốc có thời gian, địa bàn và nguồn tư liệu khác nhau; bản đồ hiện đại cũng không thể áp ngược nguyên vẹn lên ranh giới cổ.",
      learningObjectives: [
        "Mô tả vai trò của sông, biển và cảng thị trong giao lưu Đông Nam Á.",
        "Nhận biết một số trung tâm/vương quốc tiêu biểu đến khoảng thế kỉ X.",
        "Giải thích sự tiếp nhận và biến đổi yếu tố văn hóa bên ngoài tại địa phương.",
      ],
      originalSummary: "Đến khoảng thế kỉ X, Đông Nam Á đã có nhiều trung tâm và vương quốc tham gia các mạng giao thương, tín ngưỡng và nghệ thuật đường bộ lẫn đường biển.",
      analysis: "Khái niệm khu vực giúp nhìn thấy các tuyến liên hệ, nhưng không được làm mất tính đa dạng. Một bia ký, đền tháp hoặc hiện vật nhập khẩu cho thấy có tiếp xúc; để kết luận về tổ chức xã hội còn cần khảo cổ, cư trú, sản xuất và văn bản. Vì vậy bài học dùng nhiều ví dụ thay vì một mô hình duy nhất.",
      debates: [{
        title: "Giao lưu hay sự sao chép?",
        summary: "Những yếu tố từ bên ngoài thường được cộng đồng địa phương chọn lọc và biến đổi; sự tương đồng không đồng nghĩa hai xã hội giống hệt nhau.",
        claimIds: ["claim-g6-sea-exchange"],
      }],
    },
    en: {
      title: "Southeast Asia to the tenth century: kingdoms and exchange networks",
      slug: "southeast-asia-to-the-tenth-century-kingdoms-and-exchange",
      summary: "Southeast Asian communities formed multiple centres and kingdoms connected by rivers, seas, and wider cultural networks.",
      body: "Southeast Asia includes mainland, peninsular, and island environments, making rivers and seas especially important. From the early centuries CE, settlements and centres of power developed around different basins, deltas, and ports.\n\nTrade connected the region to the Indian Ocean and the East Sea. Goods, writing, beliefs, and art were selectively adopted. Champa and Oc Eo–Funan evidence, alongside heritage elsewhere in the region, reveals wide exchange without erasing local foundations and creativity.\n\nRegional history should not be reduced to one people or empire. Each kingdom has a different chronology, territory, and evidential record, and modern national borders cannot simply be projected backwards.",
      learningObjectives: [
        "Describe the role of rivers, seas, and ports in Southeast Asian exchange.",
        "Recognise selected centres and kingdoms to around the tenth century.",
        "Explain the local adaptation of cultural influences.",
      ],
      originalSummary: "By around the tenth century, Southeast Asia contained multiple centres and kingdoms involved in land and maritime networks of trade, belief, and art.",
      analysis: "A regional view reveals connections but must preserve diversity. An inscription, tower, or imported object demonstrates contact; conclusions about society also require settlement, production, archaeology, and texts. The lesson therefore uses several examples rather than one universal model.",
      debates: [{
        title: "Exchange or copying?",
        summary: "Communities often selected and transformed outside influences; similarity does not make two societies identical.",
        claimIds: ["claim-g6-sea-exchange"],
      }],
    },
    claims: [
      {
        id: "claim-g6-sea-exchange",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Mạng giao lưu biển và đất liền đưa hàng hóa, kỹ thuật, ý tưởng và tín ngưỡng tới nhiều xã hội Đông Nam Á.",
        statementEn: "Maritime and land networks carried goods, techniques, ideas, and beliefs to multiple Southeast Asian societies.",
        sourceId: "source-g6-unesco-silk-roads",
        locator: "About the Silk Roads — maritime routes and dissemination of religions",
        note: "Claim ở cấp khu vực; các ví dụ Chăm-pa và Phù Nam được kiểm tra ở nguồn riêng.",
      },
      {
        id: "claim-g6-sea-local-adaptation",
        claimType: "INTERPRETATION",
        assessment: "CONFIRMED",
        statementVi: "Di sản Mỹ Sơn cho thấy cộng đồng Chăm tiếp nhận ảnh hưởng Ấn Độ và tạo nên một truyền thống kiến trúc, tôn giáo tại chỗ.",
        statementEn: "My Son shows Cham communities adapting Indian influences into a local architectural and religious tradition.",
        sourceId: "source-g6-unesco-my-son",
        locator: "Outstanding Universal Value — Brief synthesis and criterion (ii)",
        note: "Không dùng một di sản để đại diện cho toàn bộ Đông Nam Á.",
      },
    ],
  },
  {
    id: "lesson-g6-van-lang-au-lac",
    requirementId: "g6-van-lang-au-lac",
    sourceIds: ["source-g6-vnmh-dong-son"],
    vi: {
      title: "Văn Lang – Âu Lạc qua khảo cổ và truyền thống",
      slug: "van-lang-au-lac-qua-khao-co-va-truyen-thong",
      summary: "Di tích và hiện vật Đông Sơn giúp tìm hiểu cơ sở vật chất, đời sống và quá trình hình thành những nhà nước sơ khai ở miền Bắc Việt Nam.",
      body: "Văn Lang và Âu Lạc được tìm hiểu từ cả thư tịch, truyền thuyết và bằng chứng khảo cổ. Trong đó, văn hóa Đông Sơn phân bố rộng tại Bắc Bộ và một phần Bắc Trung Bộ, với dấu tích cư trú, mộ táng, công cụ, vũ khí và đồ đồng.\n\nNông nghiệp lúa nước, nghề luyện kim, trao đổi và tổ chức cộng đồng tạo nên nền tảng vật chất cho những trung tâm quyền lực sơ khai. Trống đồng và nhiều hiện vật khác vừa cho biết kỹ thuật chế tác, vừa gợi mở nghi lễ, giao tiếp và biểu tượng cộng đồng.\n\nTruyền thuyết Hùng Vương, An Dương Vương hay nỏ thần có giá trị trong ký ức văn hóa nhưng không được dùng như biên bản sự kiện. Khi đặt truyền thuyết cạnh khảo cổ và thư tịch, người học cần phân biệt loại nguồn và mức độ có thể kết luận.",
      learningObjectives: [
        "Xác định phạm vi và một số loại di vật tiêu biểu của văn hóa Đông Sơn.",
        "Liên hệ sản xuất, luyện kim và cộng đồng với sự hình thành nhà nước sơ khai.",
        "Phân biệt bằng chứng khảo cổ với truyền thuyết lịch sử.",
      ],
      originalSummary: "Văn Lang–Âu Lạc được nghiên cứu bằng cách đối chiếu khảo cổ Đông Sơn, thư tịch và truyền thống; mỗi loại nguồn có giá trị và giới hạn riêng.",
      analysis: "Khảo cổ cho phép nhận diện không gian, kỹ thuật, sản xuất và phân hóa xã hội nhưng hiếm khi tự cho biết tên gọi chính trị. Thư tịch ghi tên người và sự kiện nhưng có thể được biên soạn muộn. Truyền thuyết giữ ký ức cộng đồng song chứa biểu tượng. Kết luận vững hơn khi ba nhóm nguồn được phân loại rồi đối chiếu thay vì trộn lẫn.",
      debates: [{
        title: "Từ văn hóa khảo cổ đến tên một nhà nước",
        summary: "Văn hóa Đông Sơn là nền tảng vật chất quan trọng, nhưng quan hệ giữa phạm vi khảo cổ và ranh giới chính trị cần được trình bày thận trọng.",
        claimIds: ["claim-g6-van-lang-dong-son"],
      }],
    },
    en: {
      title: "Van Lang and Au Lac through archaeology and tradition",
      slug: "van-lang-and-au-lac-through-archaeology-and-tradition",
      summary: "Dong Son sites and objects help investigate the material basis, daily life, and emergence of early states in northern Vietnam.",
      body: "Van Lang and Au Lac are studied through written traditions, legends, and archaeological evidence. Dong Son material is widely distributed across northern and part of north-central Vietnam, including settlements, burials, tools, weapons, and bronzes.\n\nWet-rice farming, metallurgy, exchange, and community organisation provided a material foundation for early centres of power. Bronze drums and other objects reveal craft skills and suggest ritual, communication, and shared symbols.\n\nStories about the Hung Kings, An Duong Vuong, or the magic crossbow matter in cultural memory but are not event reports. When legends are placed beside archaeology and texts, learners need to distinguish source types and the strength of possible conclusions.",
      learningObjectives: [
        "Locate Dong Son culture and identify representative evidence.",
        "Connect production, metallurgy, and community organisation to early states.",
        "Distinguish archaeological evidence from historical legend.",
      ],
      originalSummary: "Van Lang and Au Lac are investigated by comparing Dong Son archaeology, written records, and traditions, each with different value and limits.",
      analysis: "Archaeology can identify space, technology, production, and social differentiation but rarely supplies political names by itself. Texts name people and events but may have been compiled later. Legends preserve community memory while using symbols. Stronger conclusions classify and compare these sources instead of blending them together.",
      debates: [{
        title: "From an archaeological culture to the name of a state",
        summary: "Dong Son culture is an important material foundation, while the relationship between an archaeological distribution and political borders needs careful wording.",
        claimIds: ["claim-g6-van-lang-dong-son"],
      }],
    },
    claims: [
      {
        id: "claim-g6-van-lang-dong-son",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Văn hóa Đông Sơn tồn tại khoảng từ thế kỉ VII trước Công nguyên đến thế kỉ I–II và là cơ sở vật chất quan trọng để nghiên cứu Văn Lang–Âu Lạc.",
        statementEn: "Dong Son culture dates approximately from the seventh century BCE to the first or second century CE and is an important material basis for studying Van Lang and Au Lac.",
        sourceId: "source-g6-vnmh-dong-son",
        locator: "Phần mở đầu — niên đại, phân bố và quan hệ với nhà nước sơ khai",
        note: "Niên đại được trình bày dưới dạng khoảng; không biến phạm vi khảo cổ thành đường biên chính trị chính xác.",
      },
      {
        id: "claim-g6-van-lang-material-life",
        claimType: "INTERPRETATION",
        assessment: "CONFIRMED",
        statementVi: "Di vật Đông Sơn cung cấp bằng chứng về kỹ thuật, sản xuất, nghi lễ và đời sống cộng đồng của cư dân cổ.",
        statementEn: "Dong Son objects provide evidence about technology, production, ritual, and community life.",
        sourceId: "source-g6-vnmh-dong-son",
        locator: "Các nhóm di tích và di vật Đông Sơn được giới thiệu trong bài",
        note: "Các ý nghĩa biểu tượng cụ thể cần gắn với từng hiện vật và nghiên cứu chuyên môn.",
      },
    ],
  },
  {
    id: "lesson-g6-northern-rule-resistance",
    requirementId: "g6-northern-rule-resistance",
    sourceIds: ["source-g6-vnmh-independence"],
    vi: {
      title: "Bắc thuộc, chuyển biến xã hội và hành trình giành tự chủ",
      slug: "bac-thuoc-chuyen-bien-xa-hoi-va-hanh-trinh-gianh-tu-chu",
      summary: "Từ đầu Công nguyên đến năm 938, cư dân bản địa vừa thích nghi và bảo lưu văn hóa, vừa liên tục đấu tranh để giành lại quyền tự chủ.",
      body: "Trong nhiều thế kỉ, vùng đất Việt Nam chịu sự cai trị của các triều đại phong kiến phương Bắc. Bộ máy quản lý, thuế khóa và những yếu tố văn hóa mới tác động tới xã hội, trong khi cộng đồng địa phương vẫn duy trì và biến đổi nhiều truyền thống của mình.\n\nCác cuộc nổi dậy diễn ra ở những thời điểm và điều kiện khác nhau: Hai Bà Trưng, Bà Triệu, Lý Bí, Mai Thúc Loan, Phùng Hưng, họ Khúc và Dương Đình Nghệ là những dấu mốc tiêu biểu. Không phải cuộc đấu tranh nào cũng duy trì được chính quyền lâu dài, nhưng chúng cho thấy ý chí và năng lực tổ chức tự chủ nối tiếp qua nhiều thế hệ.\n\nNăm 938, Ngô Quyền đánh bại quân Nam Hán trên sông Bạch Đằng. Chiến thắng này chấm dứt thời kì lệ thuộc kéo dài và mở ra thời đại độc lập, tự chủ lâu dài.",
      learningObjectives: [
        "Trình bày một số chuyển biến xã hội và văn hóa trong thời Bắc thuộc.",
        "Sắp xếp các cuộc đấu tranh tiêu biểu trên trục thời gian.",
        "Giải thích ý nghĩa của chiến thắng Bạch Đằng năm 938.",
      ],
      originalSummary: "Hành trình giành tự chủ là một tiến trình dài gồm bảo lưu văn hóa, thích nghi xã hội và nhiều cuộc đấu tranh, đạt bước ngoặt ở Bạch Đằng năm 938.",
      analysis: "Nếu chỉ liệt kê khởi nghĩa, người học khó thấy tiến trình. Cần đặt từng cuộc đấu tranh trong bối cảnh bộ máy cai trị, lực lượng địa phương và khả năng duy trì chính quyền. Đồng thời, thay đổi văn hóa không chỉ là mất hoặc còn nguyên: nhiều yếu tố được tiếp nhận, biến đổi và kết hợp trong đời sống địa phương.",
      debates: [{
        title: "Liên tục và thay đổi dưới thời Bắc thuộc",
        summary: "Bảo lưu bản sắc và tiếp nhận yếu tố mới có thể diễn ra đồng thời; cần tránh mô tả xã hội như hoàn toàn bất biến hoặc hoàn toàn bị thay thế.",
        claimIds: ["claim-g6-northern-rule-continuity"],
      }],
    },
    en: {
      title: "Northern rule, social change, and the path to self-rule",
      slug: "northern-rule-social-change-and-the-path-to-self-rule",
      summary: "From the early centuries CE to 938, local communities adapted and preserved culture while repeatedly seeking political self-rule.",
      body: "For many centuries, territories in Vietnam were governed by northern Chinese dynasties. Administration, taxation, and new cultural elements affected society, while local communities maintained and transformed many traditions.\n\nUprisings occurred under different conditions: the Trung Sisters, Lady Trieu, Ly Bi, Mai Thuc Loan, Phung Hung, the Khuc family, and Duong Dinh Nghe mark important moments. Not every struggle sustained a government, but together they show recurring efforts and capacities for self-rule.\n\nIn 938, Ngo Quyen defeated the Southern Han fleet on the Bach Dang River. The victory ended the long period of external rule and opened a durable era of independence.",
      learningObjectives: [
        "Outline social and cultural changes during northern rule.",
        "Arrange representative struggles on a timeline.",
        "Explain the significance of the Bach Dang victory in 938.",
      ],
      originalSummary: "The path to self-rule was a long process of cultural continuity, social adaptation, and repeated struggle, reaching a turning point at Bach Dang in 938.",
      analysis: "A list of uprisings can hide the process connecting them. Each struggle needs the context of administration, local forces, and the capacity to sustain government. Cultural change was also not a choice between complete loss and no change: communities adopted, transformed, and combined different elements.",
      debates: [{
        title: "Continuity and change under northern rule",
        summary: "Cultural continuity and the adoption of new elements can occur together; society should not be presented as either unchanged or wholly replaced.",
        claimIds: ["claim-g6-northern-rule-continuity"],
      }],
    },
    claims: [
      {
        id: "claim-g6-northern-rule-struggles",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Từ thế kỉ I đến đầu thế kỉ X đã diễn ra nhiều cuộc đấu tranh tiêu biểu, từ Hai Bà Trưng đến họ Khúc và Ngô Quyền.",
        statementEn: "From the first to the early tenth century, representative struggles extended from the Trung Sisters to the Khuc family and Ngo Quyen.",
        sourceId: "source-g6-vnmh-independence",
        locator: "Exhibition narrative — sequence of struggles from the first to tenth centuries",
        note: "Bài chọn các mốc theo chương trình lớp 6, không khẳng định danh sách là toàn bộ.",
      },
      {
        id: "claim-g6-northern-rule-continuity",
        claimType: "OUTCOME",
        assessment: "CONFIRMED",
        statementVi: "Chiến thắng Bạch Đằng năm 938 kết thúc thời kì lệ thuộc và mở ra thời đại độc lập, tự chủ.",
        statementEn: "The Bach Dang victory in 938 ended external domination and opened an era of independence and self-rule.",
        sourceId: "source-g6-vnmh-independence",
        locator: "Final paragraph — Bach Dang battle victory in 938",
        note: "Mốc 938 được trình bày như bước ngoặt; các giai đoạn xây dựng nhà nước tiếp theo thuộc lộ trình lớp 7.",
      },
    ],
  },
  {
    id: "lesson-g6-champa",
    requirementId: "g6-champa",
    sourceIds: ["source-g6-unesco-my-son"],
    vi: {
      title: "Chăm-pa: vương quốc, giao lưu và di sản Mỹ Sơn",
      slug: "cham-pa-vuong-quoc-giao-luu-va-di-san-my-son",
      summary: "Chăm-pa phát triển dọc miền Trung, tham gia giao thương biển và để lại di sản kiến trúc, điêu khắc, bia ký cùng truyền thống văn hóa đa dạng.",
      body: "Chăm-pa không phải một đô thị duy nhất mà là lịch sử của nhiều trung tâm quyền lực nối tiếp và liên kết dọc miền Trung. Vị trí ven biển tạo điều kiện tham gia các mạng giao thương, còn sông và thung lũng kết nối cảng với vùng nội địa.\n\nMỹ Sơn là một trung tâm tôn giáo và chính trị quan trọng trong nhiều thế kỉ. Kiến trúc đền tháp, bia ký và điêu khắc cho thấy ảnh hưởng Hindu giáo từ Ấn Độ được cộng đồng Chăm tiếp nhận và sáng tạo theo truyền thống địa phương. Phật giáo cũng hiện diện trong một số giai đoạn và khu vực.\n\nDi sản còn lại không đại diện đầy đủ cho mọi mặt đời sống Chăm-pa. Nghiên cứu cần kết hợp đền tháp với cư trú, sản xuất, cảng thị, thư tịch và văn hóa Chăm đang tiếp tục tồn tại.",
      learningObjectives: [
        "Xác định không gian phát triển chính của Chăm-pa trên bản đồ.",
        "Mô tả vai trò của Mỹ Sơn và một số loại bằng chứng về Chăm-pa.",
        "Giải thích giao lưu văn hóa như một quá trình tiếp nhận và sáng tạo tại chỗ.",
      ],
      originalSummary: "Lịch sử Chăm-pa được tìm hiểu qua nhiều trung tâm và loại nguồn; Mỹ Sơn minh họa rõ sự kết hợp giữa giao lưu khu vực và sáng tạo của cộng đồng Chăm.",
      analysis: "Đền tháp được bảo tồn tốt hơn nhiều dấu vết đời thường nên dễ làm câu chuyện nghiêng về tôn giáo và tầng lớp quyền lực. Để hiểu xã hội rộng hơn, cần đặt kiến trúc cạnh bia ký, khảo cổ cư trú, sản xuất, thương mại và ký ức cộng đồng. Cũng cần tránh áp một đường biên cố định cho toàn bộ lịch sử Chăm-pa.",
      debates: [{
        title: "Một di sản có đại diện cho toàn bộ vương quốc không?",
        summary: "Mỹ Sơn là bằng chứng đặc biệt quan trọng nhưng chỉ là một phần của lịch sử chính trị, kinh tế và xã hội Chăm-pa.",
        claimIds: ["claim-g6-champa-my-son"],
      }],
    },
    en: {
      title: "Champa: kingdom, exchange, and the heritage of My Son",
      slug: "champa-kingdom-exchange-and-the-heritage-of-my-son",
      summary: "Champa developed along central Vietnam, participated in maritime trade, and left architecture, sculpture, inscriptions, and diverse cultural traditions.",
      body: "Champa was not a single city but a history of changing and connected centres of power along central Vietnam. Coastal locations supported maritime exchange, while rivers and valleys linked ports to inland areas.\n\nMy Son was an important religious and political centre for many centuries. Towers, inscriptions, and sculpture show Indian Hindu influences being adopted and reshaped through Cham traditions. Buddhism was also present in some periods and regions.\n\nSurviving monuments do not represent every aspect of Champa life. Research needs to combine temples with settlements, production, ports, texts, and living Cham culture.",
      learningObjectives: [
        "Locate the principal area of Champa's development.",
        "Describe the role of My Son and evidence used to study Champa.",
        "Explain cultural exchange as local selection and creativity.",
      ],
      originalSummary: "Champa is investigated through several centres and source types; My Son clearly illustrates the interaction of regional exchange and Cham creativity.",
      analysis: "Temples often survive better than traces of ordinary life, which can tilt the story toward religion and elites. A wider account places architecture alongside inscriptions, settlements, production, trade, and community memory. It also avoids projecting one fixed border across Champa's whole history.",
      debates: [{
        title: "Can one heritage site represent an entire kingdom?",
        summary: "My Son is exceptionally important evidence, but it represents only part of Champa's political, economic, and social history.",
        claimIds: ["claim-g6-champa-my-son"],
      }],
    },
    claims: [
      {
        id: "claim-g6-champa-my-son",
        claimType: "PLACE",
        assessment: "CONFIRMED",
        statementVi: "Mỹ Sơn là trung tâm tôn giáo và chính trị quan trọng của Chăm-pa, với chuỗi đền tháp có niên đại chủ yếu từ thế kỉ IV đến XIII.",
        statementEn: "My Son was an important religious and political centre of Champa, with a sequence of tower temples dating mainly from the fourth to thirteenth centuries.",
        sourceId: "source-g6-unesco-my-son",
        locator: "Outstanding Universal Value — Brief synthesis",
        note: "Niên đại mô tả di sản Mỹ Sơn, không phải toàn bộ thời gian tồn tại của Chăm-pa.",
      },
      {
        id: "claim-g6-champa-exchange",
        claimType: "INTERPRETATION",
        assessment: "CONFIRMED",
        statementVi: "Kiến trúc Mỹ Sơn thể hiện quá trình cộng đồng Chăm thích nghi ảnh hưởng Hindu giáo và nghệ thuật Ấn Độ trong bối cảnh địa phương.",
        statementEn: "My Son architecture reflects Cham adaptation of Hindu and Indian artistic influences in a local context.",
        sourceId: "source-g6-unesco-my-son",
        locator: "Criterion (ii)",
        note: "Dùng khái niệm thích nghi/sáng tạo, tránh mô tả văn hóa Chăm như bản sao.",
      },
    ],
  },
  {
    id: "lesson-g6-funan",
    requirementId: "g6-funan",
    sourceIds: ["source-g6-vnmh-funan"],
    vi: {
      title: "Phù Nam và thế giới Óc Eo",
      slug: "phu-nam-va-the-gioi-oc-eo",
      summary: "Khảo cổ Óc Eo ở Nam Bộ cho thấy một không gian cư trú, sản xuất và giao thương phát triển, giúp nghiên cứu lịch sử Phù Nam trong những thế kỉ đầu Công nguyên.",
      body: "Các thư tịch cổ nhắc tới Phù Nam, còn khảo cổ học tại Óc Eo và nhiều địa điểm Nam Bộ cung cấp bằng chứng vật chất phong phú. Dấu tích kiến trúc, kênh cổ, đồ gốm, tượng, trang sức, tiền và hàng hóa từ xa cho thấy cư dân tham gia cả sản xuất nông nghiệp lẫn mạng giao thương rộng.\n\nVăn hóa Óc Eo phát triển mạnh trong những thế kỉ đầu Công nguyên. Đồ vật và biểu tượng cho thấy giao lưu với Ấn Độ và nhiều vùng khác, nhưng chúng được chế tác, sử dụng trong môi trường xã hội Nam Bộ.\n\nKhông nên coi mọi hiện vật Óc Eo đều tự động là tài sản của một triều vua Phù Nam cụ thể. Quan hệ giữa một văn hóa khảo cổ, đô thị cổ và tên gọi chính trị trong thư tịch cần được giải thích bằng nhiều nguồn.",
      learningObjectives: [
        "Xác định vùng phân bố chính và niên đại khái quát của văn hóa Óc Eo.",
        "Nhận diện bằng chứng về sản xuất, tín ngưỡng và giao thương.",
        "Phân biệt văn hóa khảo cổ Óc Eo với khái niệm nhà nước Phù Nam trong thư tịch.",
      ],
      originalSummary: "Óc Eo cung cấp lớp bằng chứng vật chất quan trọng để nghiên cứu Phù Nam và lịch sử Nam Bộ trong mạng giao thương Đông Nam Á thời cổ.",
      analysis: "Khảo cổ và thư tịch không dùng cùng một hệ thống tên gọi. Hiện vật cho biết vật liệu, kỹ thuật, phân bố và quan hệ trao đổi; văn bản cho biết tên nước, vua hoặc sự kiện theo góc nhìn người viết. Việc nối hai nhóm nguồn cần nêu rõ bước suy luận và tránh biến một phát hiện thành kết luận cho toàn vùng.",
      debates: [{
        title: "Óc Eo có hoàn toàn đồng nghĩa với Phù Nam không?",
        summary: "Hai khái niệm liên hệ chặt chẽ nhưng thuộc hai loại bằng chứng khác nhau; việc xác định ranh giới, chủ thể và niên đại cụ thể vẫn cần đối chiếu.",
        claimIds: ["claim-g6-funan-oc-eo"],
      }],
    },
    en: {
      title: "Funan and the Oc Eo world",
      slug: "funan-and-the-oc-eo-world",
      summary: "Oc Eo archaeology in southern Vietnam reveals developed settlement, production, and exchange, helping investigate Funan in the early centuries CE.",
      body: "Ancient texts refer to Funan, while archaeology at Oc Eo and other southern sites provides rich material evidence. Architecture, canals, ceramics, sculpture, jewellery, coins, and goods from distant regions show communities engaged in agriculture and wide exchange networks.\n\nOc Eo culture flourished in the early centuries CE. Objects and symbols demonstrate contact with India and other regions, but they were made and used in southern Vietnamese social settings.\n\nNot every Oc Eo object can automatically be assigned to a particular Funan ruler. The relationship among an archaeological culture, an ancient urban centre, and a political name in texts needs explanation from several source types.",
      learningObjectives: [
        "Locate Oc Eo culture and describe its broad chronology.",
        "Recognise evidence of production, belief, and trade.",
        "Distinguish the archaeological term Oc Eo from Funan in written records.",
      ],
      originalSummary: "Oc Eo provides a major body of material evidence for studying Funan and southern Vietnam within ancient Southeast Asian exchange networks.",
      analysis: "Archaeology and written records do not use the same naming systems. Objects reveal material, technology, distribution, and exchange; texts name states, rulers, or events from an author's viewpoint. Connecting them requires explicit reasoning and should not turn one discovery into a conclusion about the whole region.",
      debates: [{
        title: "Are Oc Eo and Funan exactly the same thing?",
        summary: "They are closely related concepts drawn from different forms of evidence; specific borders, communities, and dates still require comparison.",
        claimIds: ["claim-g6-funan-oc-eo"],
      }],
    },
    claims: [
      {
        id: "claim-g6-funan-oc-eo",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Văn hóa Óc Eo là nền tảng bằng chứng vật chất quan trọng để nghiên cứu Phù Nam ở Nam Bộ trong những thế kỉ đầu Công nguyên.",
        statementEn: "Oc Eo culture is an important body of material evidence for studying Funan in southern Vietnam during the early centuries CE.",
        sourceId: "source-g6-vnmh-funan",
        locator: "Phần giới thiệu phòng trưng bày Óc Eo–Phù Nam và quan hệ giữa cổ vật với thư tịch",
        note: "Claim dùng từ 'quan trọng để nghiên cứu', không khẳng định hai khái niệm hoàn toàn đồng nhất.",
      },
      {
        id: "claim-g6-funan-trade",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Cổ vật Óc Eo cung cấp bằng chứng về mạng giao thương xa qua tiền, trang sức, đồ vật và nguyên liệu có nguồn gốc ngoài khu vực.",
        statementEn: "Oc Eo objects provide evidence of long-distance exchange through coins, jewellery, objects, and materials originating outside the region.",
        sourceId: "source-g6-vnmh-funan",
        locator: "Các đoạn mô tả tiền kim loại, đá quý và giao thương viễn dương",
        note: "Không suy từ một hiện vật đơn lẻ thành tuyến thương mại cố định; bài mô tả mạng giao lưu ở mức khái quát.",
      },
    ],
  },
];
