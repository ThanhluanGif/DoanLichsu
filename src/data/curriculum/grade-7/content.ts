export const grade7BatchAsOf = "2026-08-11T00:00:00.000Z";

export type Grade7SourceSeed = {
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

export type Grade7ClaimSeed = {
  id: string;
  claimType: "DATE" | "PLACE" | "OUTCOME" | "INTERPRETATION" | "CONTEXT";
  assessment: "CONFIRMED" | "DISPUTED";
  statementVi: string;
  statementEn: string;
  sourceId: string;
  locator: string;
  note: string;
};

type Grade7LocaleSeed = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  learningObjectives: string[];
  originalSummary: string;
  analysis: string;
  debates: Array<{ title: string; summary: string; claimIds: string[] }>;
};

export type Grade7LessonSeed = {
  id: string;
  requirementId: string;
  sourceIds: string[];
  vi: Grade7LocaleSeed;
  en: Grade7LocaleSeed;
  claims: Grade7ClaimSeed[];
};

export const grade7Sources: Grade7SourceSeed[] = [
  {
    id: "source-g7-met-feudalism",
    title: "Feudalism and Knights in Medieval Europe",
    publisher: "The Metropolitan Museum of Art",
    year: 2001,
    url: "https://www.metmuseum.org/de/essays/feudalism-and-knights-in-medieval-europe",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Heilbrunn Timeline of Art History",
    verificationNote: "Đã kiểm tra phần giải thích về thái ấp, nghĩa vụ quân sự, quan hệ lãnh chúa–kị sĩ và giới hạn của mô hình phong kiến; bài học không trình bày phong kiến như một hệ thống đồng nhất cho toàn Tây Âu.",
  },
  {
    id: "source-g7-met-renaissance",
    title: "The Art of Renaissance Europe: A Resource for Educators",
    publisher: "The Metropolitan Museum of Art",
    year: 2000,
    url: "https://www.metmuseum.org/de/met-publications/the-art-of-renaissance-europe-a-resource-for-educators",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "MetPublications educator resource",
    verificationNote: "Đã kiểm tra trang ấn phẩm, niên biểu và các mục về đô thị, bảo trợ nghệ thuật, nhân văn, in ấn và sự lan tỏa của Phục hưng; chỉ dẫn tới ấn phẩm gốc, không nhập PDF hoặc hình ảnh vào dự án.",
  },
  {
    id: "source-g7-met-reformation",
    title: "The Reformation",
    publisher: "The Metropolitan Museum of Art",
    year: 2002,
    url: "https://www.metmuseum.org/it/essays/the-reformation",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Heilbrunn Timeline of Art History",
    verificationNote: "Đã kiểm tra diễn biến từ phản đối của Martin Luther năm 1517 đến sự lan rộng của các nhánh Cải cách và phản ứng Công giáo; bài học chỉ khái quát đến nửa đầu thế kỉ XVI.",
  },
  {
    id: "source-g7-met-tang",
    title: "Tang Dynasty (618–907)",
    publisher: "The Metropolitan Museum of Art",
    year: 2001,
    url: "https://www.metmuseum.org/essays/tang-dynasty-618-906",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Heilbrunn Timeline of Art History",
    verificationNote: "Đã kiểm tra mốc 618–907, vai trò Trường An, giao lưu đường dài, khoa cử và thành tựu văn hóa Đường; không sao chép mô tả hiện vật.",
  },
  {
    id: "source-g7-met-china-1000-1400",
    title: "China, 1000–1400 A.D.",
    publisher: "The Metropolitan Museum of Art",
    year: 2001,
    url: "https://82nd-and-fifth.metmuseum.org/toah/ht/07/eac.html",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Heilbrunn Timeline of Art History chronology",
    verificationNote: "Đã kiểm tra niên biểu Tống–Nguyên–Minh cùng các mục về đô thị, thương mại đường biển, in ấn, gốm và giao lưu; bài học nêu rõ niên biểu không đại diện toàn bộ đời sống xã hội.",
  },
  {
    id: "source-g7-met-qing",
    title: "The Qing Dynasty (1644–1911): Painting",
    publisher: "The Metropolitan Museum of Art",
    year: 2003,
    url: "https://www.metmuseum.org/ko/essays/the-qing-dynasty-1644-1911-painting",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Heilbrunn Timeline of Art History",
    verificationNote: "Đã kiểm tra mốc Minh–Thanh năm 1644, nguồn gốc Mãn Châu, sự mở rộng lãnh thổ và vai trò bảo trợ văn hóa dưới Khang Hy–Càn Long; bài chỉ sử dụng đến bối cảnh giữa thế kỉ XIX của requirement lớp 7.",
  },
  {
    id: "source-g7-met-south-southeast-asia",
    title: "The Art of South and Southeast Asia: A Resource for Educators",
    publisher: "The Metropolitan Museum of Art",
    year: 2001,
    url: "https://www.metmuseum.org/-/media/files/learn/for-educators/publications-for-educators/sseasia.pdf",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Met educator resource — South and Southeast Asia",
    verificationNote: "Đã kiểm tra niên biểu Pala–Sena, Chola, Delhi Sultanate, Vijayanagara và các mục về trao đổi tôn giáo–nghệ thuật; chỉ dẫn tới PDF gốc, không nhập tệp hoặc hình ảnh.",
  },
  {
    id: "source-g7-met-south-asia-1600-1800",
    title: "South Asia, 1600–1800 A.D.",
    publisher: "The Metropolitan Museum of Art",
    year: 2003,
    url: "https://82nd-and-fifth.metmuseum.org/toah/ht/09/ssa.html",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The Metropolitan Museum of Art",
    identifier: "Heilbrunn Timeline of Art History chronology",
    verificationNote: "Đã kiểm tra thời Mughal cực thịnh, sự suy giảm sau Aurangzeb năm 1707, tính độc lập tương đối của miền nam và sự lớn mạnh của East India Company đến cuối thế kỉ XVIII.",
  },
  {
    id: "source-g7-unesco-angkor",
    title: "Angkor",
    publisher: "UNESCO World Heritage Centre",
    year: null,
    url: "https://whc.unesco.org/en/list/668/",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO World Heritage Centre",
    identifier: "World Heritage List 668",
    verificationNote: "Đã kiểm tra brief synthesis và tiêu chí về các kinh đô Khmer từ thế kỉ IX đến XV, quy hoạch, thủy lợi, kiến trúc và ý nghĩa văn hóa.",
  },
  {
    id: "source-g7-unesco-borobudur",
    title: "Borobudur Temple Compounds",
    publisher: "UNESCO World Heritage Centre",
    year: null,
    url: "https://whc.unesco.org/en/list/592/",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO World Heritage Centre",
    identifier: "World Heritage List 592",
    verificationNote: "Đã kiểm tra niên đại thế kỉ VIII–IX, cấu trúc quần thể và giá trị giao thoa của Borobudur; bài học không dùng di sản này để đại diện cho toàn bộ Đông Nam Á.",
  },
  {
    id: "source-g7-unesco-sukhothai",
    title: "Historic Town of Sukhothai and Associated Historic Towns",
    publisher: "UNESCO World Heritage Centre",
    year: null,
    url: "https://whc.unesco.org/en/list/574/",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO World Heritage Centre",
    identifier: "World Heritage List 574",
    verificationNote: "Đã kiểm tra vai trò kinh đô Xiêm thế kỉ XIII–XIV và sự kết hợp các truyền thống địa phương với ảnh hưởng khu vực trong kiến trúc, nghệ thuật và quản lý nước.",
  },
  {
    id: "source-g7-vnmh-ngo-dinh-le",
    title: "Triều Ngô - Đinh - Tiền Lê (939–1009)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: null,
    url: "https://baotanglichsu.vn/vi/Articles/4046/trieu-ngo-djinh-tien-le-939-1009",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-4046",
    verificationNote: "Đã kiểm tra phần trưng bày về xây dựng chính quyền độc lập, Hoa Lư, quân sự, kinh tế và các hiện vật thế kỉ X; bài học phân biệt khái quát bảo tàng với từng bằng chứng hiện vật.",
  },
  {
    id: "source-g7-unesco-thang-long",
    title: "Central Sector of the Imperial Citadel of Thang Long - Hanoi",
    publisher: "UNESCO World Heritage Centre",
    year: null,
    url: "https://whc.unesco.org/en/list/1328",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO World Heritage Centre",
    identifier: "World Heritage List 1328",
    verificationNote: "Đã kiểm tra brief synthesis về kinh thành do triều Lý xây dựng từ thế kỉ XI và vai trò trung tâm quyền lực lâu dài; bài học không đồng nhất di sản khảo cổ với toàn bộ lãnh thổ Đại Việt.",
  },
  {
    id: "source-g7-vnmh-ly-tran",
    title: "Triều Lý - Trần (1009–1400)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: null,
    url: "https://baotanglichsu.vn/vi/Articles/4081/trieu-ly-tran-1009-1400",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-4081",
    verificationNote: "Đã kiểm tra tổng quan trưng bày về phát triển nhà nước, kinh tế, văn hóa Lý–Trần, kháng chiến chống Tống năm 1077 và ba lần kháng chiến chống Mông–Nguyên.",
  },
  {
    id: "source-g7-vnmh-ho",
    title: "Triều Hồ (1400–1407)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: null,
    url: "https://baotanglichsu.vn/vi/Articles/4048/trieu-ho-1400-1407",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-4048",
    verificationNote: "Đã kiểm tra niên đại triều Hồ, các chính sách hạn điền, hạn nô, tiền giấy, giáo dục và dấu tích Tây Đô; bài học đặt cải cách cạnh giới hạn thực thi và thất bại năm 1407.",
  },
  {
    id: "source-g7-unesco-ho-citadel",
    title: "Citadel of the Ho Dynasty",
    publisher: "UNESCO World Heritage Centre",
    year: null,
    url: "https://whc.unesco.org/en/list/1358",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "UNESCO World Heritage Centre",
    identifier: "World Heritage List 1358",
    verificationNote: "Đã kiểm tra brief synthesis về việc xây thành năm 1397, chuyển kinh đô, kỹ thuật xây dựng và bối cảnh cải cách cuối Trần–Hồ.",
  },
  {
    id: "source-g7-vnmh-lam-son",
    title: "Tài trí của vua Lê Thái Tổ trong mười năm kháng chiến chống quân Minh (1418–1427)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2013,
    url: "https://baotanglichsu.vn/VI/Articles/3098/14470/tai-tri-cua-vua-le-thai-to-trong-muoi-nam-khang-chien-chong-quan-minh-1418-1427.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-3098-14470",
    verificationNote: "Đã kiểm tra mốc 1418–1427, vai trò lãnh đạo của Lê Lợi, chuyển biến chiến lược và việc thành lập triều Lê năm 1428; bài học tránh kể chiến thắng như kết quả của một cá nhân duy nhất.",
  },
  {
    id: "source-g7-vnmh-lam-kinh",
    title: "Di tích Lịch sử Lam Kinh (Thanh Hoá)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2008,
    url: "https://baotanglichsu.vn/VI/Articles/3096/4010/di-tich-lich-su-lam-kinh-thanh-hoa.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-3096-4010",
    verificationNote: "Đã kiểm tra quan hệ giữa Lam Sơn, khởi nghĩa Lam Sơn, vương triều Hậu Lê và bằng chứng khảo cổ tại Lam Kinh; không sử dụng hình ảnh hoặc tệp của nguồn.",
  },
];

export const grade7Lessons: Grade7LessonSeed[] = [
  {
    id: "lesson-g7-medieval-western-europe",
    requirementId: "g7-medieval-western-europe",
    sourceIds: ["source-g7-met-feudalism", "source-g7-met-renaissance", "source-g7-met-reformation"],
    vi: {
      title: "Tây Âu trung đại: lãnh địa, đô thị và những chuyển đổi tư tưởng",
      slug: "tay-au-trung-dai-lanh-dia-do-thi-va-chuyen-doi-tu-tuong",
      summary: "Từ thế kỉ V đến đầu thế kỉ XVI, Tây Âu biến đổi qua các quan hệ lãnh địa, sự lớn mạnh của đô thị, Phục hưng và Cải cách tôn giáo.",
      body: "Sau khi phần phía tây của Đế quốc La Mã tan rã, quyền lực ở nhiều nơi phân tán giữa vua, quý tộc, giáo hội và các cộng đồng địa phương. Đất đai là nguồn lực chủ yếu; một số quý tộc trao thái ấp để đổi lấy phục vụ quân sự và lòng trung thành. Tuy vậy, không phải mọi vùng đều tổ chức giống nhau, và nông dân có địa vị, nghĩa vụ rất khác tùy thời gian và địa phương.\n\nTừ khoảng thế kỉ XI, sản xuất, dân số và trao đổi tăng ở nhiều khu vực. Đô thị, chợ, nghiệp đoàn và mạng thương mại tạo thêm không gian cho thợ thủ công, thương nhân, trường học và chính quyền thành thị. Sự phát triển này không lập tức xóa bỏ xã hội lãnh địa, mà tạo ra những quan hệ kinh tế và nhóm xã hội mới bên cạnh nó.\n\nTừ thế kỉ XIV, Phục hưng thúc đẩy việc nghiên cứu di sản Hy Lạp–La Mã, quan sát tự nhiên và thử nghiệm hình thức nghệ thuật mới. Đầu thế kỉ XVI, phê phán giáo hội của Martin Luther mở đầu một chuỗi Cải cách tôn giáo, làm Kitô giáo Tây Âu phân hóa và thay đổi quan hệ giữa đức tin, nhà thờ, chính quyền cùng truyền thông in ấn.",
      learningObjectives: [
        "Giải thích quan hệ giữa đất đai, nghĩa vụ và quyền lực trong một số xã hội phong kiến Tây Âu.",
        "Phân tích vai trò của đô thị, thương mại và nghiệp đoàn đối với biến đổi xã hội.",
        "Nêu những nét chính của Phục hưng và Cải cách tôn giáo đến nửa đầu thế kỉ XVI.",
      ],
      originalSummary: "Tây Âu trung đại không đứng yên: các quan hệ lãnh địa tồn tại cùng sự lớn mạnh của đô thị, tri thức nhân văn, nghệ thuật mới và những tranh luận tôn giáo sâu sắc.",
      analysis: "Khái niệm “phong kiến” giúp nhận ra quan hệ đất đai và nghĩa vụ, nhưng dễ che khuất khác biệt giữa các vùng nếu dùng như một sơ đồ duy nhất. Bằng chứng về lâu đài và kị sĩ thường phản ánh tầng lớp quyền lực; hồ sơ đô thị, công cụ, hàng hóa và kiến trúc tôn giáo bổ sung góc nhìn về người lao động, thương nhân và cộng đồng. Phục hưng và Cải cách cũng không phải một lần “thức tỉnh” đồng loạt mà là nhiều chuyển đổi lan với tốc độ khác nhau.",
      debates: [{
        title: "Có một mô hình phong kiến chung cho toàn Tây Âu không?",
        summary: "Thái ấp và phục vụ quân sự là quan hệ quan trọng ở nhiều nơi, nhưng nguồn của Met nhấn mạnh đất đai và lòng trung thành còn được tổ chức bằng nhiều cách khác; vì vậy mô hình cần dùng như công cụ so sánh, không phải khuôn cố định.",
        claimIds: ["claim-g7-western-europe-feudal-variety"],
      }],
    },
    en: {
      title: "Medieval Western Europe: estates, towns, and changing ideas",
      slug: "medieval-western-europe-estates-towns-and-changing-ideas",
      summary: "From the fifth to early sixteenth century, Western Europe changed through landed relations, growing towns, the Renaissance, and religious reform.",
      body: "After the western part of the Roman Empire dissolved, power in many areas was divided among kings, nobles, churches, and local communities. Land was a principal resource. Some nobles granted fiefs in exchange for military service and loyalty, but regions did not all follow one arrangement, and peasants held very different rights and obligations across time and place.\n\nFrom about the eleventh century, production, population, and exchange expanded in many regions. Towns, markets, guilds, and trading networks gave artisans, merchants, schools, and urban governments more room to act. This development did not instantly replace landed society. It created new economic relationships and social groups alongside older ones.\n\nFrom the fourteenth century, the Renaissance encouraged study of Greek and Roman legacies, observation of nature, and experimentation in art. In the early sixteenth century, Martin Luther's criticism of church practices began a series of reform movements. Western Christianity divided, while relations among belief, churches, rulers, and print communication changed.",
      learningObjectives: [
        "Explain relationships among land, obligation, and power in selected Western European societies.",
        "Analyse how towns, trade, and guilds contributed to social change.",
        "Outline the Renaissance and Reformation through the early sixteenth century.",
      ],
      originalSummary: "Medieval Western Europe was not static: landed relationships coexisted with growing towns, humanist learning, new art, and far-reaching religious debate.",
      analysis: "The term 'feudalism' helps identify relationships involving land and service, but it can conceal regional differences when treated as a universal diagram. Castles and knightly objects often represent powerful groups; urban records, tools, goods, and religious buildings add evidence about workers, merchants, and communities. The Renaissance and Reformation were also not one sudden awakening, but connected changes spreading at different speeds.",
      debates: [{
        title: "Was there one feudal model across Western Europe?",
        summary: "Fiefs and military service mattered in many places, but the Met source notes that landholding and loyalty were organised in several ways. The model is therefore useful for comparison, not as a fixed template.",
        claimIds: ["claim-g7-western-europe-feudal-variety"],
      }],
    },
    claims: [
      {
        id: "claim-g7-western-europe-feudal-variety",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Từ thế kỉ IX, thái ấp đổi lấy phục vụ là một cách tổ chức quyền lực ở Tây Âu, nhưng không phải cách duy nhất để giữ đất, duy trì kị sĩ hoặc tạo lòng trung thành.",
        statementEn: "From the ninth century, fiefs exchanged for service were one way to organise power in Western Europe, but not the only way to hold land, maintain knights, or secure loyalty.",
        sourceId: "source-g7-met-feudalism",
        locator: "Essay paragraphs 1–2 — fiefs, military service, and alternative forms of landholding and loyalty",
        note: "Claim chủ động giữ giới hạn của nguồn, tránh biến một mô hình thành quy luật tuyệt đối.",
      },
      {
        id: "claim-g7-western-europe-reformation",
        claimType: "OUTCOME",
        assessment: "CONFIRMED",
        statementVi: "Phong trào khởi đầu từ phản đối của Martin Luther năm 1517 lan rộng, góp phần hình thành các nhánh Tin Lành và làm thay đổi đời sống tôn giáo, chính trị, nghệ thuật Tây Âu.",
        statementEn: "The movement beginning with Martin Luther's protests in 1517 spread widely, contributing to Protestant traditions and changing religious, political, and artistic life in Western Europe.",
        sourceId: "source-g7-met-reformation",
        locator: "Essay paragraphs 175–185 — origins, spread, Protestant branches, and Catholic response",
        note: "Không coi Cải cách chỉ do một nguyên nhân hoặc diễn ra giống nhau ở mọi nước.",
      },
    ],
  },
  {
    id: "lesson-g7-medieval-china-india",
    requirementId: "g7-medieval-china-india",
    sourceIds: ["source-g7-met-tang", "source-g7-met-china-1000-1400", "source-g7-met-qing", "source-g7-met-south-southeast-asia", "source-g7-met-south-asia-1600-1800"],
    vi: {
      title: "Trung Quốc và Ấn Độ trung đại qua nhà nước, giao lưu và văn hóa",
      slug: "trung-quoc-va-an-do-trung-dai-qua-nha-nuoc-giao-luu-va-van-hoa",
      summary: "Trung Quốc và tiểu lục địa Ấn Độ trải qua nhiều triều đại, trung tâm quyền lực và mạng giao lưu, tạo nên thành tựu đa dạng chứ không phải hai tiến trình đơn tuyến.",
      body: "Ở Trung Quốc, nhà Đường thống nhất một không gian rộng, phát triển bộ máy, khoa cử và kinh đô Trường An có quan hệ với nhiều vùng Á–Âu. Sau các giai đoạn phân chia, nhà Tống phát triển đô thị, thương mại, in ấn và kỹ thuật; nhà Nguyên đưa Trung Quốc vào đế quốc Mông Cổ rộng lớn; nhà Minh tái lập chính quyền của triều đại người Hán từ năm 1368. Năm 1644, người Mãn Châu lập nhà Thanh. Dưới Khang Hy và Càn Long, lãnh thổ, kinh tế và bảo trợ văn hóa mở rộng, nhưng đến đầu–giữa thế kỉ XIX, sức ép xã hội và sự can thiệp từ bên ngoài ngày càng sâu.\n\nTiểu lục địa Ấn Độ không được một triều đại duy nhất cai trị trong toàn bộ thời trung đại. Pala và Sena ở đông bắc, Chola ở miền nam, các vương quốc Rajput, Delhi Sultanate và Vijayanagara là những trung tâm tiêu biểu ở những thời điểm khác nhau. Từ năm 1526, Mughal xây dựng đế quốc rộng ở miền bắc; dưới Akbar, bộ máy được củng cố và nghệ thuật kết hợp truyền thống Ba Tư với nhiều dòng địa phương. Sau năm 1707, quyền lực Mughal suy giảm, các chính thể vùng nổi lên và East India Company từng bước mở rộng sức mạnh quân sự–chính trị.\n\nPhật giáo, Hindu giáo, Hồi giáo, Sikh giáo và nhiều truyền thống địa phương tạo nên công trình, văn bản và thực hành phong phú. Đường biển Ấn Độ Dương nối thương nhân, tu sĩ và nghệ nhân với Tây Á, Đông Phi và Đông Nam Á. Không nên kể giao lưu như sự “sao chép”: kỹ thuật, biểu tượng và ý tưởng được lựa chọn, dịch, kết hợp và biến đổi trong điều kiện địa phương.",
      learningObjectives: [
        "Sắp xếp các triều Đường, Tống, Nguyên, Minh, Thanh và nêu một số chuyển biến đến giữa thế kỉ XIX.",
        "Nhận diện tính đa trung tâm của Ấn Độ qua Pala–Sena, Chola, Delhi Sultanate, Vijayanagara và Mughal.",
        "Giải thích vai trò của giao thương và tôn giáo trong sáng tạo văn hóa khu vực.",
      ],
      originalSummary: "Lịch sử trung đại Trung Quốc và Ấn Độ gồm nhiều chu kì thống nhất, phân quyền và giao lưu; thành tựu hình thành từ cả quyền lực nhà nước lẫn kết nối xã hội rộng.",
      analysis: "Niên biểu triều đại giúp định hướng thời gian nhưng thường đặt cung đình ở trung tâm. Hiện vật, công trình và dấu vết thương mại cho phép đặt thêm câu hỏi về nghệ nhân, thương nhân, tu sĩ và cộng đồng địa phương. So sánh hai không gian không nhằm xếp hạng “thịnh trị”, mà xem các thiết chế chính trị khác nhau đã hỗ trợ, kiểm soát hoặc thích nghi với giao lưu như thế nào.",
      debates: [{
        title: "Có thể kể lịch sử Ấn Độ bằng một danh sách triều đại không?",
        summary: "Nguồn niên biểu cho thấy nhiều trung tâm cùng tồn tại ở bắc, nam và Deccan; một danh sách kế vị duy nhất sẽ làm mất tính đa vùng và các mạng trao đổi nối chúng.",
        claimIds: ["claim-g7-india-multiple-centres"],
      }],
    },
    en: {
      title: "Medieval China and India through states, exchange, and culture",
      slug: "medieval-china-and-india-through-states-exchange-and-culture",
      summary: "China and the Indian subcontinent experienced multiple dynasties, centres of power, and exchange networks rather than two simple linear stories.",
      body: "In China, the Tang governed a large unified realm, developed institutions and examinations, and sustained a capital at Chang'an connected to many parts of Eurasia. After periods of division, the Song saw expanding cities, commerce, printing, and technology. The Yuan linked China to the wider Mongol empire, and the Ming restored rule by a Chinese dynasty in 1368. In 1644, Manchu rulers established the Qing. Under the Kangxi and Qianlong emperors, territory, economic activity, and court patronage expanded, but by the early to mid-nineteenth century social pressure and outside intervention were deepening.\n\nNo single dynasty governed the whole Indian subcontinent throughout the medieval period. The Pala and Sena in the northeast, Chola in the south, Rajput kingdoms, the Delhi Sultanate, and Vijayanagara were important centres at different times. From 1526, the Mughals built a wide northern empire. Akbar consolidated administration, while art combined Persian practices with several local traditions. After 1707, Mughal authority weakened, regional powers grew, and the East India Company progressively expanded its military and political power.\n\nBuddhist, Hindu, Islamic, Sikh, and local communities produced varied monuments, texts, and practices. Indian Ocean routes connected merchants, religious travellers, and makers with West Asia, East Africa, and Southeast Asia. Exchange should not be narrated as copying: techniques, symbols, and ideas were selected, translated, combined, and changed in local settings.",
      learningObjectives: [
        "Place the Tang, Song, Yuan, Ming, and Qing on a timeline and identify changes through the mid-nineteenth century.",
        "Recognise India's multiple centres through the Pala-Sena, Chola, Delhi Sultanate, Vijayanagara, and Mughal periods.",
        "Explain the roles of trade and religion in regional cultural creation.",
      ],
      originalSummary: "Medieval China and India experienced cycles of unity, regional power, and exchange; their achievements emerged from states as well as wider social connections.",
      analysis: "Dynastic timelines organise chronology but tend to centre courts. Objects, buildings, and trading evidence support questions about artisans, merchants, religious travellers, and local communities. Comparing the two regions is not a ranking of golden ages. It examines how different political institutions supported, controlled, or adapted to exchange.",
      debates: [{
        title: "Can Indian history be told as one sequence of dynasties?",
        summary: "The chronology shows several centres operating in northern, southern, and Deccan India. A single succession list would hide regional diversity and the networks connecting them.",
        claimIds: ["claim-g7-india-multiple-centres"],
      }],
    },
    claims: [
      {
        id: "claim-g7-china-tang-cosmopolitan",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Thời Đường (618–907), Trường An là kinh đô có sự hiện diện của thương nhân, tu sĩ và sứ giả từ nhiều vùng, đồng thời khoa cử mở thêm con đường tham gia bộ máy nhà nước.",
        statementEn: "Under the Tang (618–907), Chang'an hosted merchants, religious travellers, and envoys from many regions, while examinations opened an additional route into government service.",
        sourceId: "source-g7-met-tang",
        locator: "Essay paragraphs 173–176 — unification, Chang'an networks, trade routes, and examinations",
        note: "Không suy rộng rằng mọi tầng lớp đều có cơ hội ngang nhau; claim chỉ nêu cơ chế và tính kết nối.",
      },
      {
        id: "claim-g7-india-multiple-centres",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Từ khoảng thế kỉ VIII đến XVI, tiểu lục địa Ấn Độ có nhiều trung tâm như Pala–Sena, Chola, Delhi Sultanate và Vijayanagara ở các vùng và thời điểm khác nhau.",
        statementEn: "From roughly the eighth to sixteenth centuries, the Indian subcontinent included centres such as the Pala-Sena, Chola, Delhi Sultanate, and Vijayanagara in different regions and periods.",
        sourceId: "source-g7-met-south-southeast-asia",
        locator: "Chronology, p. 13 — medieval India, Pala and Sena, Chola, Delhi Sultanate, Vijayanagara",
        note: "Danh sách mang tính đại diện, không phải toàn bộ chính thể của tiểu lục địa.",
      },
    ],
  },
  {
    id: "lesson-g7-southeast-asia-tenth-sixteenth",
    requirementId: "g7-southeast-asia-tenth-sixteenth",
    sourceIds: ["source-g7-unesco-angkor", "source-g7-unesco-borobudur", "source-g7-unesco-sukhothai"],
    vi: {
      title: "Đông Nam Á thế kỉ X–XVI: vương quốc, nước và mạng giao lưu",
      slug: "dong-nam-a-the-ki-x-xvi-vuong-quoc-nuoc-va-mang-giao-luu",
      summary: "Các vương quốc Đông Nam Á phát triển trong môi trường sông, đồng bằng, đảo và biển; di sản cho thấy năng lực tổ chức cùng sự sáng tạo từ giao lưu khu vực.",
      body: "Từ nửa sau thế kỉ X đến đầu thế kỉ XVI, Đông Nam Á gồm nhiều trung tâm quyền lực thay đổi theo thời gian. Angkor của người Khmer tổ chức một không gian đô thị và nghi lễ rộng, kết hợp đền, đường, hồ chứa và kênh. Ở lưu vực Chao Phraya, Sukhothai trở thành một kinh đô quan trọng của người Thái trong thế kỉ XIII–XIV. Trên các đảo, các trung tâm Java và Sumatra gắn với cả sản xuất nông nghiệp lẫn thương mại biển.\n\nNước là một điều kiện sống và cũng là phần của tổ chức xã hội. Hệ thống thủy lợi hỗ trợ cư trú, canh tác và quyền lực, nhưng không nên giải thích mọi vương quốc chỉ bằng một yếu tố môi trường. Cảng, eo biển và gió mùa kết nối hàng hóa, người đi biển, ngôn ngữ và tôn giáo qua Ấn Độ Dương và Biển Đông.\n\nBorobudur, Angkor và Sukhothai cho thấy Phật giáo, Hindu giáo và truyền thống địa phương được thể hiện bằng những cách khác nhau. Di sản đá còn lại thường gắn với vua và tôn giáo; để hiểu đời sống rộng hơn cần đặt nó cạnh khu cư trú, gốm, canh tác, trao đổi và văn hóa của các cộng đồng đang tiếp nối.",
      learningObjectives: [
        "Xác định Angkor, Sukhothai, Java và Sumatra trong không gian Đông Nam Á.",
        "Phân tích vai trò của nước, nông nghiệp và thương mại biển trong sự phát triển các vương quốc.",
        "Giải thích di sản khu vực như kết quả của tiếp xúc và sáng tạo địa phương.",
      ],
      originalSummary: "Đông Nam Á trung đại là mạng lưới các vương quốc và cộng đồng thích nghi với nước, đất và biển, đồng thời biến đổi những ảnh hưởng bên ngoài thành hình thức văn hóa riêng.",
      analysis: "Ba di sản UNESCO là cửa sổ mạnh nhưng có thiên lệch: công trình bền vững và trung tâm quyền lực dễ được nhìn thấy hơn nhà ở hay lao động thường ngày. So sánh chúng cần tách điều nguồn xác nhận trực tiếp — niên đại, cấu trúc, giá trị di sản — khỏi diễn giải rộng về cả xã hội. Bản đồ chính trị cũng phải được hiểu là thay đổi, không phải biên giới quốc gia hiện đại kéo lùi về quá khứ.",
      debates: [{
        title: "Đền tháp có kể đủ lịch sử một vương quốc không?",
        summary: "Đền tháp cho biết tổ chức, kỹ thuật và tư tưởng của những trung tâm lớn, nhưng cần nguồn về cư trú, sản xuất và trao đổi để không biến lịch sử khu vực thành câu chuyện chỉ của vua và tôn giáo.",
        claimIds: ["claim-g7-southeast-asia-angkor"],
      }],
    },
    en: {
      title: "Southeast Asia, tenth–sixteenth centuries: kingdoms, water, and exchange",
      slug: "southeast-asia-tenth-sixteenth-centuries-kingdoms-water-and-exchange",
      summary: "Southeast Asian kingdoms developed among rivers, plains, islands, and seas; their heritage demonstrates organisation and creative regional exchange.",
      body: "From the late tenth to early sixteenth century, Southeast Asia contained many changing centres of power. Khmer Angkor organised an extensive urban and ceremonial landscape of temples, roads, reservoirs, and canals. In the Chao Phraya basin, Sukhothai became an important Thai capital in the thirteenth and fourteenth centuries. Across the islands, centres in Java and Sumatra drew on both agricultural production and maritime trade.\n\nWater was a condition of life and part of social organisation. Hydraulic works supported settlement, cultivation, and power, although no kingdom should be explained through one environmental factor alone. Ports, straits, and monsoon winds carried goods, sailors, languages, and religions across the Indian Ocean and South China Sea.\n\nBorobudur, Angkor, and Sukhothai show Buddhist, Hindu, and local traditions taking different forms. Surviving stone monuments often relate to rulers and religion. A broader history must place them alongside settlement, ceramics, farming, exchange, and cultures sustained by living communities.",
      learningObjectives: [
        "Locate Angkor, Sukhothai, Java, and Sumatra within Southeast Asia.",
        "Analyse the roles of water, agriculture, and maritime trade in regional kingdoms.",
        "Explain regional heritage as the result of contact and local creativity.",
      ],
      originalSummary: "Medieval Southeast Asia was a network of kingdoms and communities adapting to land, water, and sea while reshaping outside influences into local cultural forms.",
      analysis: "The three UNESCO sites are powerful windows with a built-in bias: durable monuments and centres of authority are more visible than ordinary homes and labour. Comparison should separate what the sources directly establish—dates, structures, and heritage significance—from wider interpretations of society. Political maps also changed over time and should not project present national borders backward.",
      debates: [{
        title: "Can temples tell the whole history of a kingdom?",
        summary: "Temples reveal organisation, technology, and thought at major centres, but evidence about settlement, production, and exchange is needed to avoid reducing regional history to rulers and religion.",
        claimIds: ["claim-g7-southeast-asia-angkor"],
      }],
    },
    claims: [
      {
        id: "claim-g7-southeast-asia-angkor",
        claimType: "PLACE",
        assessment: "CONFIRMED",
        statementVi: "Angkor lưu giữ dấu tích nhiều kinh đô của Đế quốc Khmer từ thế kỉ IX đến XV cùng hệ thống đô thị, đền và công trình thủy lợi quy mô lớn.",
        statementEn: "Angkor preserves remains of successive Khmer capitals from the ninth to fifteenth centuries, including extensive urban, temple, and hydraulic systems.",
        sourceId: "source-g7-unesco-angkor",
        locator: "Outstanding Universal Value — Brief synthesis and criteria (i)–(iv)",
        note: "Claim mô tả khu di sản, không khẳng định một mô hình thủy lợi duy nhất giải thích toàn bộ đế quốc.",
      },
      {
        id: "claim-g7-southeast-asia-sukhothai",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Sukhothai là kinh đô đầu tiên của một vương quốc Xiêm quan trọng trong thế kỉ XIII–XIV, nơi truyền thống địa phương kết hợp nhiều ảnh hưởng để tạo phong cách riêng.",
        statementEn: "Sukhothai was the capital of an important early Siamese kingdom in the thirteenth and fourteenth centuries, where local traditions combined multiple influences into distinctive forms.",
        sourceId: "source-g7-unesco-sukhothai",
        locator: "Outstanding Universal Value — Brief synthesis and criterion (i)",
        note: "Không dùng từ 'đầu tiên' để phủ nhận các cộng đồng Thái hoặc chính thể sớm khác; claim bám ngữ cảnh di sản UNESCO.",
      },
    ],
  },
  {
    id: "lesson-g7-vietnam-tenth-thirteenth",
    requirementId: "g7-vietnam-tenth-thirteenth",
    sourceIds: ["source-g7-vnmh-ngo-dinh-le", "source-g7-unesco-thang-long", "source-g7-vnmh-ly-tran"],
    vi: {
      title: "Từ tự chủ thế kỉ X đến quốc gia Đại Việt thời Lý",
      slug: "tu-tu-chu-the-ki-x-den-quoc-gia-dai-viet-thoi-ly",
      summary: "Các triều Ngô, Đinh, Tiền Lê và Lý từng bước tổ chức chính quyền, xác lập kinh đô, bảo vệ độc lập và xây dựng nền tảng của quốc gia Đại Việt.",
      body: "Sau chiến thắng Bạch Đằng năm 938, Ngô Quyền xây dựng chính quyền tự chủ. Biến động sau khi ông mất cho thấy độc lập không tự động tạo ra một nhà nước ổn định. Đinh Bộ Lĩnh thống nhất các lực lượng, đặt quốc hiệu Đại Cồ Việt và chọn Hoa Lư làm kinh đô; nhà Tiền Lê tiếp tục củng cố chính quyền và bảo vệ đất nước trước quân Tống năm 981.\n\nNăm 1010, Lý Công Uẩn chuyển kinh đô từ Hoa Lư ra Đại La và đặt tên Thăng Long. Vị trí mới thuận lợi hơn cho một trung tâm lâu dài ở đồng bằng sông Hồng. Triều Lý phát triển bộ máy, luật lệ, quân đội, nông nghiệp, giáo dục và văn hóa; Phật giáo có vai trò lớn, trong khi Nho học dần mở rộng trong quản lý và đào tạo.\n\nCuộc chiến với nhà Tống 1075–1077 gắn với chủ trương chủ động của Lý Thường Kiệt và phòng tuyến Như Nguyệt. Việc kể lịch sử giai đoạn này cần nối chiến thắng quân sự với công việc lâu dài hơn: thu thuế, quản lý địa phương, trị thủy, lập pháp, ngoại giao và xây dựng sự gắn kết giữa triều đình với nhiều cộng đồng.",
      learningObjectives: [
        "Sắp xếp các triều Ngô, Đinh, Tiền Lê và Lý cùng các mốc chính từ 938 đến 1225.",
        "Giải thích ý nghĩa của Hoa Lư, Thăng Long và quá trình xây dựng chính quyền độc lập.",
        "Phân tích mối liên hệ giữa xây dựng đất nước và bảo vệ chủ quyền thời Lý.",
      ],
      originalSummary: "Từ sau Bạch Đằng 938, độc lập được củng cố bằng nhiều thế hệ xây dựng chính quyền, kinh đô, luật lệ, kinh tế và năng lực phòng vệ, đạt bước phát triển dài dưới triều Lý.",
      analysis: "Các triều đại thường được kể như chuỗi vua thay nhau, nhưng câu hỏi quan trọng hơn là thiết chế nào được tạo dựng và người dân chịu tác động ra sao. Hiện vật Hoa Lư và khảo cổ Thăng Long cho thấy nền tảng vật chất của quyền lực; sử liệu về chiến tranh cho biết quyết định và kết quả. Cả hai nhóm đều cần đặt cạnh địa lý, sản xuất và quan hệ trung ương–địa phương.",
      debates: [{
        title: "Một kinh đô mới có tự tạo ra nhà nước mạnh không?",
        summary: "Thăng Long tạo điều kiện địa lý và biểu tượng thuận lợi, nhưng sức bền của quốc gia còn phụ thuộc quản lý, nguồn lực, ngoại giao, quân đội và sự tham gia của các cộng đồng.",
        claimIds: ["claim-g7-vietnam-thang-long"],
      }],
    },
    en: {
      title: "From tenth-century self-rule to Đại Việt under the Lý",
      slug: "from-tenth-century-self-rule-to-dai-viet-under-the-ly",
      summary: "The Ngô, Đinh, Early Lê, and Lý gradually organised government, established capitals, defended independence, and built foundations for Đại Việt.",
      body: "After the Bach Dang victory in 938, Ngo Quyen established a self-governing court. Conflict after his death shows that independence did not automatically create a stable state. Dinh Bo Linh brought competing forces together, named the realm Dai Co Viet, and made Hoa Lu the capital. The Early Le continued to strengthen government and defended the country against Song forces in 981.\n\nIn 1010, Ly Cong Uan moved the capital from Hoa Lu to Dai La and renamed it Thang Long. The new location offered stronger conditions for a lasting centre in the Red River delta. The Ly developed administration, law, armed forces, agriculture, education, and culture. Buddhism held an important role, while Confucian learning gradually expanded in governance and training.\n\nThe war with the Song in 1075–1077 involved Ly Thuong Kiet's forward strategy and defence at the Nhu Nguyet River. The period should connect military victories to longer work: taxation, local administration, water management, law, diplomacy, and relations between the court and diverse communities.",
      learningObjectives: [
        "Order the Ngô, Đinh, Early Lê, and Lý dynasties and major milestones from 938 to 1225.",
        "Explain the significance of Hoa Lư, Thăng Long, and the construction of independent government.",
        "Analyse the relationship between state-building and defence under the Lý.",
      ],
      originalSummary: "After Bach Dang in 938, generations consolidated independence through government, capitals, law, economic organisation, and defence, reaching a sustained development under the Lý.",
      analysis: "Dynasties are often presented as a succession of rulers, but the more useful question is which institutions were built and how people were affected. Objects from Hoa Lu and archaeology at Thang Long reveal the material basis of power; war narratives describe decisions and outcomes. Both need the context of geography, production, and central-local relations.",
      debates: [{
        title: "Does a new capital create a strong state by itself?",
        summary: "Thang Long offered geographic and symbolic advantages, but durability also depended on administration, resources, diplomacy, armed forces, and participation across communities.",
        claimIds: ["claim-g7-vietnam-thang-long"],
      }],
    },
    claims: [
      {
        id: "claim-g7-vietnam-independent-foundations",
        claimType: "OUTCOME",
        assessment: "CONFIRMED",
        statementVi: "Giai đoạn Ngô–Đinh–Tiền Lê (939–1009) củng cố chính quyền độc lập và tạo nền tảng cho sự phát triển lâu dài của quốc gia Đại Việt.",
        statementEn: "The Ngô, Đinh, and Early Lê period (939–1009) consolidated independent government and laid foundations for the longer development of Đại Việt.",
        sourceId: "source-g7-vnmh-ngo-dinh-le",
        locator: "Tổng quan trưng bày — chính quyền độc lập, quân sự, kinh tế, văn hóa và hiện vật Hoa Lư",
        note: "Nguồn dùng ngôn ngữ tổng quan bảo tàng; bài học bổ sung giới hạn và biến động chính trị sau Ngô Quyền.",
      },
      {
        id: "claim-g7-vietnam-thang-long",
        claimType: "PLACE",
        assessment: "CONFIRMED",
        statementVi: "Kinh thành Thăng Long được triều Lý xây dựng từ thế kỉ XI và trở thành trung tâm quyền lực chính trị lâu dài của Đại Việt.",
        statementEn: "The Lý dynasty built the Thăng Long Imperial Citadel from the eleventh century, and it became a long-lasting centre of political power in Đại Việt.",
        sourceId: "source-g7-unesco-thang-long",
        locator: "Outstanding Universal Value — Brief synthesis",
        note: "Claim giới hạn ở trung tâm kinh thành và vai trò chính trị, không suy thành mô tả đầy đủ toàn xã hội.",
      },
    ],
  },
  {
    id: "lesson-g7-vietnam-tran-ho",
    requirementId: "g7-vietnam-tran-ho",
    sourceIds: ["source-g7-vnmh-ly-tran", "source-g7-vnmh-ho", "source-g7-unesco-ho-citadel"],
    vi: {
      title: "Đại Việt thời Trần–Hồ: xây dựng, kháng chiến và cải cách",
      slug: "dai-viet-thoi-tran-ho-xay-dung-khang-chien-va-cai-cach",
      summary: "Thời Trần phát triển nhà nước và ba lần kháng chiến chống Mông–Nguyên; cuối thế kỉ XIV, cải cách Hồ Quý Ly diễn ra trong khủng hoảng và dẫn tới một kết cục phức tạp.",
      body: "Nhà Trần tiếp nhận nhiều nền tảng của thời Lý và điều chỉnh bộ máy bằng quan hệ giữa hoàng đế, Thái thượng hoàng, quý tộc và quan lại. Nông nghiệp, thủ công, thương mại, thi cử và văn hóa tiếp tục phát triển, dù thiên tai, chiến tranh và phân hóa xã hội tạo ra những sức ép khác nhau theo từng giai đoạn.\n\nTrong thế kỉ XIII, Đại Việt ba lần đối đầu các đạo quân Mông–Nguyên. Triều đình và tướng lĩnh tổ chức lực lượng, rút lui khi cần, bảo toàn quân, huy động hậu cần và phản công ở thời điểm phù hợp. Chiến thắng năm 1288 trên sông Bạch Đằng là một đỉnh điểm, nhưng kết quả của cả ba cuộc kháng chiến không thể quy cho một trận đánh hay một cá nhân duy nhất.\n\nCuối thế kỉ XIV, khủng hoảng triều Trần tạo bối cảnh cho Hồ Quý Ly tập trung quyền lực và tiến hành các chính sách về ruộng đất, nô tì, tiền giấy, giáo dục và quân sự. Thành Tây Đô được xây năm 1397; nhà Hồ thành lập năm 1400 và thất bại trước quân Minh năm 1407. Đánh giá cải cách cần tách mục tiêu, cách thực hiện, nhóm chịu tác động và kết quả ngắn hạn.",
      learningObjectives: [
        "Trình bày những nét chính về tổ chức, kinh tế, xã hội và văn hóa Đại Việt thời Trần.",
        "Phân tích nhiều yếu tố tạo nên thắng lợi trong ba lần kháng chiến chống Mông–Nguyên.",
        "Đánh giá cải cách Hồ Quý Ly theo bối cảnh, nội dung, thực thi và kết quả.",
      ],
      originalSummary: "Thời Trần–Hồ kết nối năng lực xây dựng và bảo vệ quốc gia với những sức ép xã hội, cải cách mạnh và thất bại chính trị; mỗi kết quả cần được giải thích bằng nhiều yếu tố.",
      analysis: "Ký ức chiến thắng dễ tập trung vào anh hùng và trận quyết chiến, trong khi sức mạnh còn đến từ hậu cần, địa hình, phối hợp quân dân, ngoại giao và khả năng điều chỉnh chiến lược. Tương tự, gọi cải cách Hồ Quý Ly là “tiến bộ” hay “thất bại” chưa đủ: một chính sách có thể có mục tiêu đáng chú ý nhưng thực thi gấp, gặp chống đối hoặc không giải quyết được khủng hoảng an ninh.",
      debates: [{
        title: "Cải cách có thể được đánh giá chỉ bằng ý tưởng không?",
        summary: "Các chính sách thời Hồ cần được xem cả mục tiêu lẫn năng lực thực hiện, sự chấp nhận xã hội và bối cảnh chiến tranh; ý tưởng mới không tự bảo đảm kết quả tốt.",
        claimIds: ["claim-g7-tran-ho-reforms"],
      }],
    },
    en: {
      title: "Đại Việt under the Trần and Hồ: government, resistance, and reform",
      slug: "dai-viet-under-tran-and-ho-government-resistance-and-reform",
      summary: "The Trần developed the state and resisted three Mongol-Yuan invasions; late-fourteenth-century Hồ reforms unfolded amid crisis and produced a complex outcome.",
      body: "The Tran inherited many Ly foundations and adjusted government through relationships among emperors, retired emperors, aristocrats, and officials. Agriculture, crafts, trade, examinations, and culture continued to develop, while disasters, war, and social inequality generated different pressures over time.\n\nIn the thirteenth century, Dai Viet faced Mongol-Yuan armies three times. Courts and commanders organised forces, withdrew when necessary, preserved troops, mobilised supplies, and counterattacked at chosen moments. The 1288 Bach Dang victory was a high point, but the outcome of all three wars cannot be credited to one battle or one individual.\n\nIn the late fourteenth century, crisis under the Tran formed the setting for Ho Quy Ly to centralise power and pursue policies on land, dependent labour, paper money, education, and defence. The Western Capital was built in 1397; the Ho dynasty began in 1400 and fell to Ming forces in 1407. Reform needs assessment through its aims, implementation, affected groups, and short-term outcomes.",
      learningObjectives: [
        "Outline government, economy, society, and culture in Đại Việt under the Trần.",
        "Analyse multiple factors behind resistance to the Mongol-Yuan invasions.",
        "Assess Hồ Quý Ly's reforms through context, design, implementation, and outcome.",
      ],
      originalSummary: "The Trần-Hồ period connects state-building and defence with social pressure, ambitious reform, and political defeat; each outcome needs a multi-causal explanation.",
      analysis: "Public memory can centre victories on heroes and decisive battles, although logistics, terrain, civilian-military coordination, diplomacy, and strategic adaptation also mattered. Similarly, calling Ho Quy Ly's reforms either progressive or failed is incomplete. A policy may have a notable aim while being rushed, resisted, or unable to resolve a security crisis.",
      debates: [{
        title: "Can reform be judged by ideas alone?",
        summary: "Hồ policies need to be assessed through goals, implementation capacity, social acceptance, and wartime conditions; a new idea does not guarantee a successful result.",
        claimIds: ["claim-g7-tran-ho-reforms"],
      }],
    },
    claims: [
      {
        id: "claim-g7-tran-resistance",
        claimType: "OUTCOME",
        assessment: "CONFIRMED",
        statementVi: "Quân dân Đại Việt thời Trần giành thắng lợi trong ba cuộc kháng chiến chống Mông–Nguyên vào các năm 1258, 1285 và 1288.",
        statementEn: "The people and forces of Đại Việt under the Trần prevailed in three wars against the Mongol-Yuan armies in 1258, 1285, and 1288.",
        sourceId: "source-g7-vnmh-ly-tran",
        locator: "Tổng quan trưng bày — công cuộc giữ nước thời Lý–Trần",
        note: "Bài học giải thích thắng lợi đa nguyên nhân, không biến mốc năm thành toàn bộ diễn biến.",
      },
      {
        id: "claim-g7-tran-ho-reforms",
        claimType: "CONTEXT",
        assessment: "CONFIRMED",
        statementVi: "Triều Hồ (1400–1407) thực hiện chính sách hạn điền, hạn nô, phát hành tiền giấy và điều chỉnh giáo dục trong bối cảnh khủng hoảng cuối Trần.",
        statementEn: "The Hồ dynasty (1400–1407) pursued land and dependent-labour limits, issued paper money, and changed education amid the late-Trần crisis.",
        sourceId: "source-g7-vnmh-ho",
        locator: "Tổng quan trưng bày — chính sách kinh tế, xã hội, giáo dục và hiện vật triều Hồ",
        note: "Xác nhận chính sách tồn tại, không mặc định mức độ thực thi hoặc hiệu quả là đồng đều.",
      },
    ],
  },
  {
    id: "lesson-g7-lam-son-later-le",
    requirementId: "g7-lam-son-later-le",
    sourceIds: ["source-g7-vnmh-lam-son", "source-g7-vnmh-lam-kinh"],
    vi: {
      title: "Khởi nghĩa Lam Sơn và Đại Việt thế kỉ XV",
      slug: "khoi-nghia-lam-son-va-dai-viet-the-ki-xv",
      summary: "Khởi nghĩa Lam Sơn phát triển từ lực lượng ở Thanh Hóa thành cuộc chiến giành độc lập; triều Lê sơ sau năm 1428 xây dựng lại Đại Việt và để lại nhiều thành tựu cùng mâu thuẫn.",
      body: "Sau khi nhà Minh đặt ách cai trị, nhiều cuộc đấu tranh diễn ra nhưng chưa giành được độc lập bền vững. Năm 1418, Lê Lợi dựng cờ tại Lam Sơn. Nghĩa quân trải qua thiếu thốn, tổn thất và những lần phải chuyển địa bàn; việc mở rộng lực lượng, dựa vào dân, kết hợp quân sự với vận động và thư từ ngoại giao giúp cuộc khởi nghĩa chuyển từ phòng thủ sang chủ động.\n\nTừ căn cứ Thanh Hóa, nghĩa quân tiến vào Nghệ An, mở rộng vùng kiểm soát rồi phát triển ra Bắc. Những chiến thắng năm 1426–1427 làm thay đổi cục diện; quân Minh rút và nền độc lập được khôi phục. Năm 1428, Lê Lợi lên ngôi, khôi phục quốc hiệu Đại Việt và mở đầu triều Lê sơ.\n\nTrong thế kỉ XV, nhà Lê củng cố bộ máy trung ương, luật pháp, quân đội, ruộng đất, thi cử và giáo dục. Lam Kinh trở thành không gian tưởng niệm và sơn lăng của triều đại. Thành tựu tổ chức quốc gia cần được nhìn cùng giới hạn của xã hội quân chủ, sự phân tầng, xung đột cung đình và biến động đầu thế kỉ XVI dẫn tới sự suy yếu của Lê sơ.",
      learningObjectives: [
        "Trình bày các giai đoạn chính của khởi nghĩa Lam Sơn từ 1418 đến 1427.",
        "Phân tích vai trò của lãnh đạo, nhân dân, địa bàn, quân sự và ngoại giao đối với thắng lợi.",
        "Khái quát tổ chức, kinh tế, giáo dục, văn hóa và những giới hạn của Đại Việt thời Lê sơ.",
      ],
      originalSummary: "Thắng lợi Lam Sơn là kết quả của một quá trình mười năm thích nghi và mở rộng lực lượng; nhà Lê sơ biến độc lập được khôi phục thành chương trình xây dựng quốc gia trong thế kỉ XV.",
      analysis: "Nguồn tưởng niệm thường làm nổi bật tài năng Lê Lợi, còn phân tích lịch sử cần giữ vai trò của tập thể nghĩa quân, người dân, tướng lĩnh, Nguyễn Trãi, địa hình, hậu cần và sai lầm của đối phương. Với Lê sơ, bộ luật, thi cử và kiến trúc phản ánh năng lực nhà nước nhưng không tự chứng minh mọi nhóm xã hội đều được hưởng lợi như nhau.",
      debates: [{
        title: "Một cuộc khởi nghĩa thắng lợi nhờ người anh hùng hay nhờ cộng đồng?",
        summary: "Lãnh đạo chiến lược của Lê Lợi là quan trọng, nhưng hành trình 1418–1427 chỉ có thể giải thích đầy đủ khi xét lực lượng tham gia, dân chúng, hậu cần, địa bàn, ngoại giao và thời cơ.",
        claimIds: ["claim-g7-lam-son-victory"],
      }],
    },
    en: {
      title: "The Lam Sơn uprising and fifteenth-century Đại Việt",
      slug: "lam-son-uprising-and-fifteenth-century-dai-viet",
      summary: "The Lam Sơn uprising grew from a Thanh Hóa force into a war for independence; after 1428, the Early Lê rebuilt Đại Việt with achievements and tensions.",
      body: "After Ming rule was imposed, several struggles occurred without securing lasting independence. In 1418, Le Loi launched an uprising at Lam Son. The insurgents endured shortages, losses, and repeated movements. Expanding support, working with local people, and combining military action with persuasion and diplomatic letters helped the movement shift from survival to initiative.\n\nFrom its Thanh Hoa base, the force moved into Nghe An, widened the territory it controlled, and later advanced north. Victories in 1426–1427 changed the balance; Ming armies withdrew and independence was restored. In 1428, Le Loi became emperor, restored the name Dai Viet, and began the Early Le dynasty.\n\nDuring the fifteenth century, the Le strengthened central government, law, armed forces, land administration, examinations, and education. Lam Kinh became a commemorative and royal burial landscape. These state-building achievements should be considered alongside the limits of monarchy, social hierarchy, court conflict, and early-sixteenth-century instability that weakened the Early Le.",
      learningObjectives: [
        "Outline the principal stages of the Lam Sơn uprising from 1418 to 1427.",
        "Analyse the roles of leadership, communities, terrain, military action, and diplomacy in victory.",
        "Summarise government, economy, education, culture, and limitations in Early Lê Đại Việt.",
      ],
      originalSummary: "Lam Sơn's victory emerged from ten years of adaptation and widening participation; the Early Lê turned restored independence into a fifteenth-century programme of state-building.",
      analysis: "Commemorative sources often foreground Le Loi's ability, while historical analysis should retain the roles of the wider force, local people, commanders, Nguyen Trai, terrain, logistics, and enemy errors. Under the Early Le, laws, examinations, and architecture show state capacity but do not prove that every social group benefited equally.",
      debates: [{
        title: "Did a hero or a community win the uprising?",
        summary: "Le Loi's strategic leadership mattered, but the 1418–1427 movement can only be explained fully through participants, local support, logistics, terrain, diplomacy, and opportunity.",
        claimIds: ["claim-g7-lam-son-victory"],
      }],
    },
    claims: [
      {
        id: "claim-g7-lam-son-victory",
        claimType: "OUTCOME",
        assessment: "CONFIRMED",
        statementVi: "Khởi nghĩa Lam Sơn do Lê Lợi lãnh đạo diễn ra từ 1418 đến 1427, kết thúc sự cai trị của nhà Minh và dẫn tới việc thành lập triều Lê năm 1428.",
        statementEn: "The Lam Sơn uprising led by Lê Lợi lasted from 1418 to 1427, ended Ming rule, and led to the establishment of the Lê dynasty in 1428.",
        sourceId: "source-g7-vnmh-lam-son",
        locator: "Các đoạn về khởi nghĩa năm 1418, thắng lợi 1427 và Lê Lợi lên ngôi năm 1428",
        note: "Claim xác nhận trục thời gian; bài học tránh đồng nhất toàn bộ lực lượng với một lãnh tụ.",
      },
      {
        id: "claim-g7-later-le-lam-kinh",
        claimType: "PLACE",
        assessment: "CONFIRMED",
        statementVi: "Lam Kinh ở Thanh Hóa là nơi phát tích khởi nghĩa Lam Sơn và trở thành không gian điện miếu, lăng mộ quan trọng của vương triều Hậu Lê.",
        statementEn: "Lam Kinh in Thanh Hóa was the birthplace of the Lam Sơn uprising and became an important palace, temple, and royal burial landscape of the Later Lê dynasty.",
        sourceId: "source-g7-vnmh-lam-kinh",
        locator: "Phần giới thiệu lịch sử Lam Sơn–Lam Kinh và kết quả khảo cổ khu trung tâm",
        note: "Di tích được dùng như bằng chứng về ký ức triều đại và kiến trúc, không đại diện toàn bộ xã hội Lê sơ.",
      },
    ],
  },
];
