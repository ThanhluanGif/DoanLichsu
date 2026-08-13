export const grade9BatchAsOf = "2026-08-11T00:00:00.000Z";

export type Grade9SourceSeed = {
  id: string;
  title: string;
  publisher: string;
  year: number | null;
  url: string;
  sourceType: "PRIMARY_RECORD" | "ARCHIVE_CATALOG" | "MUSEUM_CATALOG" | "REFERENCE_WORK";
  qualityTier: "TIER_1_PRIMARY" | "TIER_2_INSTITUTIONAL";
  institution: string;
  identifier: string | null;
  verificationNote: string;
};

export type Grade9ClaimSeed = {
  id: string;
  claimType: "DATE" | "PLACE" | "OUTCOME" | "INTERPRETATION" | "CONTEXT";
  assessment: "CONFIRMED" | "DISPUTED";
  statementVi: string;
  statementEn: string;
  sourceId: string;
  locator: string;
  note: string;
};

type Grade9LocaleSeed = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  learningObjectives: string[];
  originalSummary: string;
  analysis: string;
  debates: Array<{ title: string; summary: string; claimIds: string[] }>;
};

export type Grade9LessonSeed = {
  id: string;
  requirementId: string;
  sourceIds: string[];
  currentUpdate: boolean;
  vi: Grade9LocaleSeed;
  en: Grade9LocaleSeed;
  claims: Grade9ClaimSeed[];
};

export const grade9Sources: Grade9SourceSeed[] = [
  {
    id: "source-g9-un-history",
    title: "History of the United Nations",
    publisher: "United Nations",
    year: 1945,
    url: "https://www.un.org/en/about-us/history-of-the-un",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "United Nations",
    identifier: "UN history — 1919 League and 1945 Charter",
    verificationNote: "Đã kiểm tra phần về Hội Quốc Liên sau Chiến tranh thế giới thứ nhất, Hội nghị San Francisco, Hiến chương và ngày Liên Hợp Quốc chính thức ra đời 24/10/1945.",
  },
  {
    id: "source-g9-ushmm-nazi",
    title: "The Nazi Party",
    publisher: "United States Holocaust Memorial Museum",
    year: 2025,
    url: "https://encyclopedia.ushmm.org/content/en/article/the-nazi-party-1",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "United States Holocaust Memorial Museum",
    identifier: "Holocaust Encyclopedia — last edited 21 July 2025",
    verificationNote: "Đã kiểm tra các phần về khủng hoảng 1929, Hitler được bổ nhiệm Thủ tướng năm 1933, nhà nước độc tài một đảng, chủ nghĩa bài Do Thái và giai đoạn cầm quyền 1933–1945.",
  },
  {
    id: "source-g9-iwm-1945",
    title: "1945: A Momentous Year",
    publisher: "Imperial War Museums",
    year: 2025,
    url: "https://www.iwm.org.uk/history/1945-a-momentous-year",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Imperial War Museums",
    identifier: "IWM history — 1945",
    verificationNote: "Đã kiểm tra bài tổng quan về kết thúc chiến tranh ở châu Âu và châu Á, giải phóng các trại tập trung, tổn thất dân thường và việc vũ khí hạt nhân được sử dụng lần đầu năm 1945.",
  },
  {
    id: "source-g9-vnmh-independence",
    title: "Cuộc đấu tranh giành độc lập của dân tộc Việt Nam (1858–1945)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: null,
    url: "https://baotanglichsu.vn/vi/Articles/4052/cuoc-djau-tranh-gianh-djoc-lap-cua-dan-toc-viet-nam-1858-1945",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-4052",
    verificationNote: "Đã kiểm tra niên biểu trưng bày về phong trào yêu nước, thành lập Đảng ngày 3/2/1930, các cao trào 1930–1931, 1936–1939, 1939–1945 và Tổng khởi nghĩa tháng Tám.",
  },
  {
    id: "source-g9-vnmh-press-1945",
    title: "Báo chí Cách mạng trong giai đoạn tổng khởi nghĩa tháng Tám năm 1945",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2020,
    url: "https://baotanglichsu.vn/VI/Articles/3097/75583/bao-chi-cach-mang-trong-giai-djoan-tong-khoi-nghia-thang-tam-nam-1945.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-3097-75583",
    verificationNote: "Đã kiểm tra vai trò thông tin, tuyên truyền và tổ chức của báo chí cách mạng trong giai đoạn chuẩn bị và tiến hành Tổng khởi nghĩa tháng Tám 1945.",
  },
  {
    id: "source-g9-vnmh-august",
    title: "Những bài học thành công của Cách mạng tháng Tám 1945",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2020,
    url: "https://baotanglichsu.vn/vi/Articles/3096/62033/nhung-bai-hoc-thanh-cong-cua-cach-mang-thang-tam-1945.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-3096-62033",
    verificationNote: "Đã kiểm tra trình tự thời cơ, chuẩn bị lực lượng, khởi nghĩa tháng Tám 1945 và việc nước Việt Nam Dân chủ Cộng hòa được tuyên bố ngày 2/9/1945.",
  },
  {
    id: "source-g9-uk-cold-war",
    title: "Cold War on File",
    publisher: "The National Archives",
    year: null,
    url: "https://www.nationalarchives.gov.uk/education/resources/cold-war-on-file/",
    sourceType: "ARCHIVE_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "The National Archives, United Kingdom",
    identifier: "Education resource — Cold War 1945–1991",
    verificationNote: "Đã kiểm tra phạm vi 1945–1991 và các hồ sơ về đối đầu Mỹ–Liên Xô, đe dọa hạt nhân, Bức màn sắt, Berlin, khủng hoảng Cuba và chiến tranh ủy nhiệm.",
  },
  {
    id: "source-g9-un-decolonization",
    title: "Decolonization",
    publisher: "United Nations",
    year: 2025,
    url: "https://www.un.org/en/global-issues/decolonization/",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "United Nations",
    identifier: "UN global issue — decolonization",
    verificationNote: "Đã kiểm tra con số khoảng 750 triệu người sống trong lãnh thổ phụ thuộc năm 1945, làn sóng giành độc lập và Tuyên ngôn trao trả độc lập năm 1960.",
  },
  {
    id: "source-g9-state-ussr",
    title: "The Collapse of the Soviet Union",
    publisher: "Office of the Historian, U.S. Department of State",
    year: null,
    url: "https://history.state.gov/milestones/1989-1992/collapse-soviet-union",
    sourceType: "ARCHIVE_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "U.S. Department of State",
    identifier: "Milestones 1989–1992 — retired historical page",
    verificationNote: "Đã kiểm tra mốc Bức tường Berlin tháng 11/1989, biến đổi Đông Âu, đảo chính bất thành tháng 8/1991, CIS và cờ Liên Xô hạ ngày 25/12/1991; trang đã ngừng duy trì nên chỉ dùng cho sự kiện lịch sử cố định.",
  },
  {
    id: "source-g9-vnmh-france-war",
    title: "Cuộc kháng chiến chống thực dân Pháp (1946–1954)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: null,
    url: "https://baotanglichsu.vn/vi/Articles/4055/cuoc-khang-chien-chong-thuc-dan-phap-1946-1954",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-4055",
    verificationNote: "Đã kiểm tra phạm vi toàn quốc kháng chiến 1946–1954, Việt Bắc 1947, Biên giới 1950 và Điện Biên Phủ tháng 5/1954.",
  },
  {
    id: "source-g9-vnmh-hcm-campaign",
    title: "Chiến dịch Hồ Chí Minh lịch sử (26/4–30/4/1975)",
    publisher: "Bảo tàng Lịch sử Quốc gia",
    year: 2013,
    url: "https://baotanglichsu.vn/vi/Articles/3097/14153/chien-dich-ho-chi-minh-lich-su-26-4-30-4-1975.html",
    sourceType: "MUSEUM_CATALOG",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bảo tàng Lịch sử Quốc gia",
    identifier: "VNMH-3097-14153",
    verificationNote: "Đã kiểm tra kế hoạch, năm hướng tiến công, thời gian 26–30/4/1975 và kết thúc chiến dịch; bài học đặt chiến dịch trong cả tiến trình chiến tranh và thống nhất.",
  },
  {
    id: "source-g9-government-doi-moi",
    title: "Mười tám năm Đổi mới (1986–2003)",
    publisher: "Cổng Thông tin điện tử Chính phủ",
    year: 2010,
    url: "https://chinhphu.vn/giai-doan-1986-2003-muoi-tam-nam-su-nghiep-doi-moi/muoi-tam-nam-doi-moi-1986-2003-2957",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Chính phủ Việt Nam",
    identifier: "Chính phủ — giai đoạn 1986–2003",
    verificationNote: "Đã kiểm tra Đại hội VI diễn ra 15–18/12/1986, việc nhìn nhận sai lầm, đề ra đường lối đổi mới toàn diện và chuyển đổi tư duy kinh tế.",
  },
  {
    id: "source-g9-mofa-cambodia",
    title: "Thông tin cơ bản về Campuchia và quan hệ với Việt Nam",
    publisher: "Bộ Ngoại giao Việt Nam",
    year: 2006,
    url: "https://mofa.gov.vn/tin-chi-tiet/chi-tiet/thong-tin-co-ban-ve-cam-pu-chia-va-quan-he-voi-viet-nam-589.html",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bộ Ngoại giao Việt Nam",
    identifier: "MOFA-589",
    verificationNote: "Đã kiểm tra các mốc biên giới Tây Nam, ngày 7/1/1979, giai đoạn quân tình nguyện Việt Nam tại Campuchia 1979–1989 và Hiệp định Paris 23/10/1991.",
  },
  {
    id: "source-g9-un-sdg-2026",
    title: "Progress towards the Sustainable Development Goals: Report of the Secretary-General 2026",
    publisher: "United Nations",
    year: 2026,
    url: "https://unstats.un.org/sdgs/files/report/2026/secretary-general-sdg-report-2026--EN.pdf",
    sourceType: "PRIMARY_RECORD",
    qualityTier: "TIER_1_PRIMARY",
    institution: "United Nations Statistics Division",
    identifier: "E/2026/73",
    verificationNote: "Đã kiểm tra báo cáo E/2026/73 về tiến độ từ khi Chương trình nghị sự 2030 được thông qua năm 2015; số liệu và đánh giá chỉ được dùng với mốc báo cáo 2026, không suy diễn thành dự báo.",
  },
  {
    id: "source-g9-itu-2025",
    title: "Measuring digital development: Facts and Figures 2025",
    publisher: "International Telecommunication Union",
    year: 2025,
    url: "https://www.itu.int/itu-d/reports/statistics/facts-figures-2025/",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "International Telecommunication Union",
    identifier: "ITU Facts and Figures 2025",
    verificationNote: "Đã kiểm tra ấn bản ngày 17/11/2025: khoảng 6 tỉ người dùng Internet trong năm 2025 và 2,2 tỉ người còn ngoại tuyến; đây là ước tính thống kê của ITU, không phải kiểm đếm tuyệt đối.",
  },
  {
    id: "source-g9-wmo-2025",
    title: "State of the Global Climate 2025",
    publisher: "World Meteorological Organization",
    year: 2026,
    url: "https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "World Meteorological Organization",
    identifier: "WMO publication — 23 March 2026",
    verificationNote: "Đã kiểm tra ấn bản ngày 23/3/2026: 2015–2025 là 11 năm nóng nhất từng ghi nhận và các cực đoan khí hậu gây thiệt hại lớn; dùng như dữ liệu quan sát đến 2025.",
  },
  {
    id: "source-g9-who-covid",
    title: "Coronavirus disease (COVID-19) pandemic",
    publisher: "World Health Organization",
    year: 2023,
    url: "https://www.who.int/europe/emergencies/situations/covid-19",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "World Health Organization",
    identifier: "WHO Europe COVID-19 overview",
    verificationNote: "Đã kiểm tra mốc PHEIC ngày 30/1/2020, WHO mô tả COVID-19 là đại dịch ngày 11/3/2020 và chấm dứt tình trạng PHEIC ngày 5/5/2023.",
  },
  {
    id: "source-g9-mofa-us",
    title: "Quan hệ Việt Nam – Hoa Kỳ",
    publisher: "Bộ Ngoại giao Việt Nam",
    year: 2004,
    url: "https://mofa.gov.vn/tin-chi-tiet/chi-tiet/quan-he-viet-nam-hoa-ky-170.html",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "Bộ Ngoại giao Việt Nam",
    identifier: "MOFA-170",
    verificationNote: "Đã kiểm tra việc hai nước thiết lập quan hệ ngoại giao ngày 12/7/1995 và các mốc trao đổi đại sứ, thương mại, khoa học, giáo dục, y tế trong thập niên sau đó.",
  },
  {
    id: "source-g9-asean-50",
    title: "ASEAN 50: A Historic Milestone",
    publisher: "ASEAN Secretariat",
    year: 2017,
    url: "https://asean.org/wp-content/uploads/2012/05/ASEAN50_Master_Publication.pdf",
    sourceType: "PRIMARY_RECORD",
    qualityTier: "TIER_1_PRIMARY",
    institution: "ASEAN Secretariat",
    identifier: "ASEAN50 Master Publication",
    verificationNote: "Đã kiểm tra niên biểu chính thức ghi Việt Nam gia nhập ASEAN ngày 28/7/1995; chỉ liên kết tài liệu, không nhập PDF hay hình ảnh vào hệ thống.",
  },
  {
    id: "source-g9-wto-vietnam",
    title: "Viet Nam and the WTO — Member information",
    publisher: "World Trade Organization",
    year: 2007,
    url: "https://www.wto.org/english/thewto_e/countries_e/vietnam_e.htm",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "World Trade Organization",
    identifier: "WTO member profile — Viet Nam",
    verificationNote: "Đã kiểm tra hồ sơ thành viên xác nhận Việt Nam là thành viên WTO từ ngày 11/1/2007.",
  },
  {
    id: "source-g9-world-bank-vietnam-2026",
    title: "Viet Nam — Country Overview",
    publisher: "World Bank Group",
    year: 2026,
    url: "https://www.worldbank.org/ext/en/country/vietnam",
    sourceType: "REFERENCE_WORK",
    qualityTier: "TIER_2_INSTITUTIONAL",
    institution: "World Bank Group",
    identifier: "Country overview — updated through July 2026",
    verificationNote: "Truy cập 11/8/2026; đã kiểm tra dữ liệu quan sát 1990–2025 về y tế, giáo dục, hạ tầng và phát triển cùng thách thức già hóa, tự động hóa, thương mại, khí hậu. Mọi số 2026–2027 được trang gọi là forecast đều phải ghi rõ là dự báo.",
  },
  {
    id: "source-g9-gso-2026",
    title: "Báo cáo tình hình kinh tế – xã hội Quý II và sáu tháng đầu năm 2026",
    publisher: "Cơ quan Thống kê Quốc gia",
    year: 2026,
    url: "https://www.gso.gov.vn/bao-cao-tinh-hinh-kinh-te-xa-hoi-hang-thang/",
    sourceType: "PRIMARY_RECORD",
    qualityTier: "TIER_1_PRIMARY",
    institution: "Cơ quan Thống kê Quốc gia Việt Nam",
    identifier: "Kỳ tham chiếu 6/2026 — đăng 03/07/2026",
    verificationNote: "Truy cập 11/8/2026; đã kiểm tra danh mục báo cáo ghi ngày đăng 03/7/2026 và kỳ tham chiếu tháng 6/2026. Bài chỉ dùng để xác định mốc cập nhật, không biến số liệu ngắn hạn thành xu thế chắc chắn.",
  },
];

const grade9AdditionalLessons: Grade9LessonSeed[] = [
  {
    id: "lesson-g9-vietnam-1918-1945",
    requirementId: "g9-vietnam-1918-1945",
    sourceIds: ["source-g9-vnmh-independence", "source-g9-vnmh-press-1945", "source-g9-vnmh-august"],
    currentUpdate: false,
    vi: {
      title: "Việt Nam 1918–1945: nhiều dòng vận động và Cách mạng tháng Tám",
      slug: "viet-nam-1918-1945-nhieu-dong-van-dong-va-cach-mang-thang-tam",
      summary: "Những biến đổi thuộc địa, nhiều khuynh hướng cứu nước và điều kiện chiến tranh đã hội tụ trong Cách mạng tháng Tám và Tuyên ngôn Độc lập năm 1945.",
      body: "Sau Chiến tranh thế giới thứ nhất, chính quyền thuộc địa tăng khai thác, thuế khóa và hạ tầng phục vụ kinh tế thuộc địa. Đô thị, đồn điền, mỏ và các nhóm xã hội mới phát triển không đều. Năm 1919, Nguyễn Ái Quốc gửi bản yêu sách tới Hội nghị Versailles; trong thập niên 1920, hoạt động công nhân, báo chí, giáo dục và các tổ chức dân tộc diễn ra theo nhiều khuynh hướng. Việt Nam Quốc dân đảng, các nhóm cải cách và tổ chức cộng sản khác nhau về lực lượng, phương pháp và mô hình tương lai; không nên kể tất cả như một tuyến tổ chức duy nhất. Đảng Cộng sản Việt Nam được thành lập ngày 3/2/1930 trong bối cảnh khủng hoảng kinh tế thuộc địa và sự phát triển của phong trào công nhân, yêu nước. Cao trào 1930–1931, vận động dân chủ 1936–1939 và chuyển hướng giải phóng dân tộc 1939–1945 diễn ra dưới những điều kiện quốc tế khác nhau. Từ năm 1940, Nhật hiện diện quân sự ở Đông Dương trong khi bộ máy thuộc địa Pháp vẫn hoạt động; Nhật đảo chính Pháp ngày 9/3/1945. Chiến tranh, trưng thu và quản lý yếu kém góp phần vào nạn đói 1944–1945, cho thấy lịch sử chính trị luôn gắn với đời sống và tổn thất của dân thường. Việt Minh xây dựng mặt trận, căn cứ và lực lượng chính trị–vũ trang; báo chí bí mật giúp truyền thông tin và lời kêu gọi. Khi Nhật đầu hàng Đồng minh tháng 8/1945 và bộ máy cai trị khủng hoảng, thời cơ xuất hiện nhưng thắng lợi còn phụ thuộc vào chuẩn bị và khả năng huy động tại từng địa phương. Tổng khởi nghĩa giành chính quyền trong tháng Tám, với các mốc Hà Nội 19/8, Huế 23/8 và Sài Gòn 25/8. Ngày 2/9/1945 tại Hà Nội, nước Việt Nam Dân chủ Cộng hòa được tuyên bố thành lập. Cách mạng tháng Tám là kết quả của cả bối cảnh quốc tế, quá trình tổ chức lâu dài và hành động của đông đảo quần chúng, không thể quy về một khoảnh khắc tự phát.",
      learningObjectives: ["Phân biệt các khuynh hướng dân tộc, dân chủ, công nhân và cộng sản trong giai đoạn 1919–1930.", "So sánh điều kiện của các cao trào 1930–1931, 1936–1939 và 1939–1945.", "Giải thích quan hệ giữa chiến tranh, chuẩn bị lực lượng, thời cơ và Tổng khởi nghĩa tháng Tám 1945."],
      originalSummary: "Từ năm 1919, nhiều con đường cứu nước cùng vận động trong xã hội thuộc địa; tổ chức lâu dài và khủng hoảng chiến tranh tạo điều kiện cho Tổng khởi nghĩa tháng Tám và nhà nước độc lập ngày 2/9/1945.",
      analysis: "Một câu chuyện chỉ có một tổ chức sẽ che khuất tranh luận về dân tộc, dân chủ, cải cách và cách mạng trong xã hội Việt Nam. Ngược lại, chỉ nói ‘thời cơ Nhật đầu hàng’ sẽ hạ thấp nhiều năm xây dựng mạng lưới và huy động. Phân tích cân bằng phải đặt vai trò chủ động của người Việt bên cạnh cấu trúc thuộc địa và chiến tranh, đồng thời không bỏ qua nạn đói, đàn áp và chi phí mà dân thường gánh chịu.",
      debates: [{title: "Cách mạng tháng Tám là kết quả của thời cơ hay chuẩn bị lâu dài?", summary: "Sự đầu hàng của Nhật tạo cửa sổ thời cơ đặc biệt, nhưng lực lượng chính trị, mặt trận, truyền thông và khả năng tổ chức tích lũy trước đó quyết định việc thời cơ có thể chuyển thành hành động hay không.", claimIds: ["claim-g9-vietnam-1918-party", "claim-g9-vietnam-1918-august"]}],
    },
    en: {
      title: "Vietnam, 1918–1945: multiple movements and the August Revolution",
      slug: "vietnam-1918-1945-multiple-movements-and-the-august-revolution",
      summary: "Colonial change, competing paths to national liberation, and wartime conditions converged in the August Revolution and the 1945 declaration of independence.",
      body: "After the First World War, colonial authorities expanded extraction, taxation, and infrastructure geared towards a colonial economy. Cities, plantations, mines, and new social groups grew unevenly. In 1919 Nguyen Ai Quoc submitted claims at Versailles; during the 1920s, labour activism, journalism, education, and nationalist organisations followed several paths. The Vietnamese Nationalist Party, reformist circles, and communist organisations differed in social base, method, and imagined future. They should not be collapsed into one continuous organisation. The Communist Party of Vietnam was founded on 3 February 1930 amid colonial economic crisis and expanding worker and patriotic activity. The 1930–1931 movement, democratic mobilisation in 1936–1939, and the national-liberation turn of 1939–1945 operated under different international conditions. Japanese forces entered Indochina from 1940 while the French colonial apparatus continued, until Japan overthrew it on 9 March 1945. War, requisition, and administrative failure contributed to the famine of 1944–1945, reminding us that political history must include civilian livelihood and loss. The Viet Minh built a front, bases, and political and armed networks; clandestine newspapers carried information and calls to action. Japan's surrender in August 1945 and the crisis of government created an opening, yet prior preparation and local mobilisation shaped the outcome. Power was seized during August, including Hanoi on 19 August, Hue on 23 August, and Saigon on 25 August. On 2 September 1945 in Hanoi, the Democratic Republic of Vietnam was proclaimed. The August Revolution joined an international rupture to sustained organisation and mass participation; it was neither an automatic gift of circumstances nor a purely spontaneous moment.",
      learningObjectives: ["Distinguish nationalist, democratic, labour, and communist currents between 1919 and 1930.", "Compare mobilisation in 1930–1931, 1936–1939, and 1939–1945.", "Explain how war, preparation, opportunity, and mobilisation combined in August 1945."],
      originalSummary: "From 1919, several routes to liberation developed in colonial society; long organisation and wartime breakdown enabled the August uprising and an independent state proclaimed on 2 September 1945.",
      analysis: "A narrative centred on only one organisation hides arguments over nationalism, democracy, reform, and revolution. A narrative centred only on Japan's surrender, however, erases years of network-building and mobilisation. Balanced explanation keeps Vietnamese agency beside colonial and wartime structures and includes famine, repression, and the burdens borne by civilians rather than treating political victory as cost-free.",
      debates: [{title: "Was the August Revolution made by opportunity or long preparation?", summary: "Japan's surrender created an exceptional opening, but accumulated political networks, front organisation, communication, and local capacity determined whether that opening could become action.", claimIds: ["claim-g9-vietnam-1918-party", "claim-g9-vietnam-1918-august"]}],
    },
    claims: [
      {id: "claim-g9-vietnam-1918-party", claimType: "DATE", assessment: "CONFIRMED", statementVi: "Đảng Cộng sản Việt Nam được thành lập ngày 3/2/1930, trước các cao trào 1930–1931, 1936–1939 và 1939–1945.", statementEn: "The Communist Party of Vietnam was founded on 3 February 1930, before the movements of 1930–1931, 1936–1939, and 1939–1945.", sourceId: "source-g9-vnmh-independence", locator: "Phần trưng bày 1930–1945 — mốc 3/2/1930 và ba cao trào cách mạng", note: "Claim chỉ ghi trình tự niên đại mà nguồn trưng bày nêu; phần đánh giá lực lượng nằm ở phân tích."},
      {id: "claim-g9-vietnam-1918-august", claimType: "OUTCOME", assessment: "CONFIRMED", statementVi: "Tổng khởi nghĩa tháng Tám năm 1945 giành chính quyền và dẫn tới việc tuyên bố thành lập nước Việt Nam Dân chủ Cộng hòa ngày 2/9/1945.", statementEn: "The August 1945 general uprising seized power and led to the proclamation of the Democratic Republic of Vietnam on 2 September 1945.", sourceId: "source-g9-vnmh-august", locator: "Các phần về Tổng khởi nghĩa tháng Tám và lễ Độc lập ngày 2/9/1945", note: "Claim khóa kết quả và mốc tuyên bố nhà nước; không dùng nguồn này để chứng minh mọi nguyên nhân của cách mạng."},
    ],
  },
  {
    id: "lesson-g9-world-1945-1991",
    requirementId: "g9-world-1945-1991",
    sourceIds: ["source-g9-uk-cold-war", "source-g9-un-decolonization", "source-g9-state-ussr"],
    currentUpdate: false,
    vi: {
      title: "Thế giới 1945–1991: Chiến tranh lạnh, giải phóng dân tộc và biến đổi xã hội",
      slug: "the-gioi-1945-1991-chien-tranh-lanh-giai-phong-dan-toc-va-bien-doi-xa-hoi",
      summary: "Đối đầu Mỹ–Liên Xô định hình an ninh toàn cầu, nhưng phi thực dân hóa, các quốc gia mới và phong trào xã hội cũng là chủ thể của giai đoạn 1945–1991.",
      body: "Năm 1945, Liên Hợp Quốc ra đời trong khi quan hệ giữa các đồng minh thời chiến nhanh chóng chuyển sang cạnh tranh. Mỹ và Liên Xô xây dựng liên minh, mô hình kinh tế–chính trị và kho vũ khí hạt nhân đối nghịch. Từ Bức màn sắt, phong tỏa Berlin đến NATO và khối Warszawa, Chiến tranh lạnh vừa là đối đầu quyền lực vừa là cạnh tranh ý thức hệ. Khủng hoảng tên lửa Cuba năm 1962 cho thấy răn đe hạt nhân có thể ngăn chiến tranh trực tiếp nhưng cũng đưa thế giới tới sát thảm họa. Chiến tranh lạnh không chỉ diễn ra giữa Washington và Moskva. Các cuộc chiến ở Triều Tiên, Việt Nam, Afghanistan, châu Phi và Mỹ Latinh có động lực địa phương, dù các cường quốc viện trợ và can thiệp. Khoảng 750 triệu người vẫn sống trong các lãnh thổ phụ thuộc năm 1945. Làn sóng độc lập ở châu Á và châu Phi, Hội nghị Bandung và Tuyên ngôn phi thực dân hóa của Liên Hợp Quốc năm 1960 cho thấy các dân tộc thuộc địa là chủ thể lịch sử. Quốc gia mới phải giải quyết biên giới, phát triển, bất bình đẳng và sự lệ thuộc kinh tế sau độc lập. Giai đoạn này còn chứng kiến Tuyên ngôn Quốc tế Nhân quyền năm 1948, tăng trưởng hậu chiến, cách mạng khoa học–kỹ thuật, phong trào dân quyền, nữ quyền và phản chiến. Thành tựu không phân bố đều, và cạnh tranh vũ trang tiêu tốn nguồn lực lớn. Năm 1989, Bức tường Berlin sụp đổ trong làn sóng biến đổi ở Đông Âu. Khủng hoảng kinh tế, cải tổ chính trị và xung đột quyền lực bên trong Liên Xô góp phần dẫn tới việc liên bang tan rã năm 1991. Mốc này kết thúc trật tự hai cực cũ nhưng không chấm dứt chiến tranh, bất bình đẳng hay tranh luận về con đường phát triển.",
      learningObjectives: ["Giải thích cấu trúc hai cực, chạy đua hạt nhân và các điểm khủng hoảng của Chiến tranh lạnh.", "Đánh giá phi thực dân hóa từ vai trò chủ động của các dân tộc.", "Liên hệ biến đổi xã hội, khoa học và kinh tế với khủng hoảng Đông Âu và Liên Xô năm 1989–1991."],
      originalSummary: "Từ 1945 đến 1991, cạnh tranh Mỹ–Liên Xô phủ bóng an ninh thế giới nhưng không thay thế vai trò của giải phóng dân tộc, quốc gia mới, phong trào xã hội và những lựa chọn phát triển đa dạng.",
      analysis: "Khái niệm ‘hai cực’ hữu ích để đọc cấu trúc quyền lực nhưng sẽ gây sai lệch nếu mọi cuộc xung đột bị coi là sản phẩm từ bên ngoài. Các xã hội thuộc địa và hậu thuộc địa có mục tiêu, chia rẽ và chiến lược riêng. Tương tự, Liên Xô tan rã không thể giải thích chỉ bằng áp lực Mỹ; cải tổ, kinh tế, dân tộc và đấu tranh thể chế bên trong đều quan trọng. Phân tích cần tách kết thúc một cấu trúc quốc tế khỏi tuyên bố rằng lịch sử hay xung đột đã kết thúc.",
      debates: [{title: "Có nên gọi toàn bộ giai đoạn 1945–1991 là thời đại hai cực?", summary: "Khung hai cực giải thích liên minh và răn đe, nhưng phi thực dân hóa và lựa chọn của các quốc gia ngoài hai khối cho thấy quyền lực quốc tế luôn phức tạp hơn hai trung tâm.", claimIds: ["claim-g9-world-1945-cold-war", "claim-g9-world-1945-decolonization"]}],
    },
    en: {
      title: "The world, 1945–1991: Cold War, decolonisation, and social change",
      slug: "world-1945-1991-cold-war-decolonisation-and-social-change",
      summary: "US–Soviet rivalry shaped global security, but decolonisation, new states, and social movements were also historical agents between 1945 and 1991.",
      body: "The United Nations began in 1945 just as relations among wartime allies turned towards rivalry. The United States and Soviet Union built opposing alliances, political-economic systems, and nuclear arsenals. From the Iron Curtain and Berlin blockade to NATO and the Warsaw Pact, the Cold War combined power competition with ideological conflict. The Cuban Missile Crisis of 1962 showed how deterrence might restrain direct war while bringing the world close to catastrophe. The Cold War was never only a contest between Washington and Moscow. Wars in Korea, Vietnam, Afghanistan, Africa, and Latin America had local causes and actors even when great powers armed or intervened. About 750 million people still lived in dependent territories in 1945. Asian and African independence movements, Bandung, and the United Nations' 1960 decolonisation declaration demonstrate the agency of colonised peoples. New states then confronted borders, development, inequality, and continuing economic dependence. The period also encompassed the 1948 Universal Declaration of Human Rights, postwar growth, scientific and technological transformation, and civil-rights, women's, and anti-war movements. Gains were uneven, while military competition consumed immense resources. In 1989 the Berlin Wall fell amid transformations across Eastern Europe. Economic crisis, political reform, nationality disputes, and institutional struggle inside the Soviet Union contributed to its dissolution in 1991. That event ended the old bipolar structure, but it did not end war, inequality, or arguments about development.",
      learningObjectives: ["Explain bipolar alliances, nuclear competition, and major Cold War crises.", "Assess decolonisation through the agency of colonised peoples.", "Connect social, scientific, and economic change to the crises of Eastern Europe and the Soviet Union in 1989–1991."],
      originalSummary: "Between 1945 and 1991, US–Soviet competition overshadowed global security without replacing the agency of liberation movements, new states, social movements, and diverse development choices.",
      analysis: "Bipolarity is useful for mapping alliances and deterrence, but it distorts history if every conflict is treated as externally manufactured. Colonial and postcolonial societies had goals, divisions, and strategies of their own. Likewise, Soviet dissolution cannot be reduced to pressure from the United States: reform, economic conditions, nationality, and institutional conflict within the union mattered. Ending one international structure was not the end of history or conflict.",
      debates: [{title: "Should 1945–1991 be understood simply as a bipolar age?", summary: "The bipolar frame explains alliances and deterrence, yet decolonisation and choices outside the two blocs reveal more than two sources of agency.", claimIds: ["claim-g9-world-1945-cold-war", "claim-g9-world-1945-decolonization"]}],
    },
    claims: [
      {id: "claim-g9-world-1945-cold-war", claimType: "CONTEXT", assessment: "CONFIRMED", statementVi: "Nguồn của The National Archives xác định Chiến tranh lạnh kéo dài từ năm 1945 đến năm 1991 và tập trung vào đối đầu Mỹ–Liên Xô dưới đe dọa hạt nhân.", statementEn: "The National Archives resource dates the Cold War from 1945 to 1991 and centres it on US–Soviet confrontation under the threat of nuclear war.", sourceId: "source-g9-uk-cold-war", locator: "Resource introduction — ‘The Cold War (1945–1991)’ and US/USSR nuclear confrontation", note: "Claim chỉ nêu phạm vi và cấu trúc giới thiệu của bộ hồ sơ, không gán mọi chiến tranh địa phương cho hai cường quốc."},
      {id: "claim-g9-world-1945-decolonization", claimType: "OUTCOME", assessment: "CONFIRMED", statementVi: "Khoảng 750 triệu người sống trong các lãnh thổ phụ thuộc năm 1945; năm 1960, Đại hội đồng Liên Hợp Quốc thông qua Tuyên ngôn về trao trả độc lập cho các nước và dân tộc thuộc địa.", statementEn: "About 750 million people lived in dependent territories in 1945; in 1960 the UN General Assembly adopted the Declaration on the Granting of Independence to Colonial Countries and Peoples.", sourceId: "source-g9-un-decolonization", locator: "Opening overview and section on General Assembly resolution 1514 (XV), 14 December 1960", note: "Claim giữ đúng hai dữ kiện của trang Liên Hợp Quốc; diễn giải hậu thuộc địa nằm ở phân tích."},
    ],
  },
  {
    id: "lesson-g9-vietnam-1945-1991",
    requirementId: "g9-vietnam-1945-1991",
    sourceIds: ["source-g9-vnmh-france-war", "source-g9-vnmh-hcm-campaign", "source-g9-government-doi-moi", "source-g9-mofa-cambodia"],
    currentUpdate: false,
    vi: {
      title: "Việt Nam 1945–1991: kháng chiến, thống nhất, bảo vệ và Đổi mới",
      slug: "viet-nam-1945-1991-khang-chien-thong-nhat-bao-ve-va-doi-moi",
      summary: "Từ bảo vệ nền độc lập mới đến chiến tranh, thống nhất pháp lý, bảo vệ biên giới, tái thiết và Đổi mới, giai đoạn này không kết thúc ở tháng 4/1975.",
      body: "Sau ngày 2/9/1945, nhà nước mới phải đối diện nạn đói, mù chữ, khó khăn tài chính và nhiều lực lượng nước ngoài. Đàm phán không ngăn được chiến tranh toàn quốc bùng nổ tháng 12/1946. Cuộc kháng chiến 1946–1954 kết hợp chiến trường, hậu phương và ngoại giao, qua Việt Bắc 1947, Biên giới 1950 và Điện Biên Phủ tháng 5/1954. Hiệp định Genève năm 1954 đình chỉ chiến sự và tạm thời chia khu vực tập kết; nó không phải là một sự thống nhất đất nước đã hoàn tất. Từ 1954, miền Bắc xây dựng xã hội mới và hỗ trợ đấu tranh thống nhất, trong khi miền Nam trải qua chính thể Việt Nam Cộng hòa, xung đột chính trị và chiến tranh ngày càng quốc tế hóa. Chiến tranh gây thương vong lớn, phá hủy hạ tầng, di dời dân cư và để lại bom mìn, chất độc hóa học cùng chia cắt gia đình. Hiệp định Paris năm 1973 đặt ra việc chấm dứt chiến tranh và rút quân Mỹ, nhưng giao tranh tiếp tục. Chiến dịch Hồ Chí Minh kết thúc ngày 30/4/1975; đến năm 1976, Quốc hội khóa VI hoàn tất thống nhất về mặt nhà nước và quyết định tên nước Cộng hòa xã hội chủ nghĩa Việt Nam. Sau chiến tranh, Việt Nam vừa tái thiết vừa đối diện khó khăn của cơ chế tập trung bao cấp, cấm vận và xung đột biên giới. Chiến tranh bảo vệ biên giới Tây Nam năm 1978–1979 gắn với việc cùng lực lượng Campuchia đánh đổ chế độ diệt chủng Khmer Đỏ; chiến tranh biên giới phía Bắc bùng nổ tháng 2/1979 và căng thẳng kéo dài. Quân tình nguyện Việt Nam ở Campuchia rút hết năm 1989; tiến trình hòa bình dẫn tới Hiệp định Paris về Campuchia năm 1991. Trong nước, Đại hội VI tháng 12/1986 khởi xướng Đổi mới toàn diện, trước hết đổi mới tư duy kinh tế. Đến năm 1991, những thay đổi về sản xuất và đối ngoại đã mở một chặng hội nhập mới nhưng các vấn đề hậu chiến, đời sống và thể chế vẫn cần thời gian dài giải quyết.",
      learningObjectives: ["Phân tích các chặng 1945–1954, 1954–1975 và cái giá xã hội của chiến tranh.", "Phân biệt kết thúc chiến dịch năm 1975 với thống nhất nhà nước năm 1976.", "Giải thích bảo vệ biên giới, Campuchia, khủng hoảng hậu chiến và bước ngoặt Đổi mới 1986–1991."],
      originalSummary: "Độc lập phải được bảo vệ qua hai cuộc chiến dài; sau 1975, thống nhất nhà nước, tái thiết, bảo vệ biên giới và Đổi mới tiếp tục định hình Việt Nam tới năm 1991.",
      analysis: "Một niên biểu chỉ gồm chiến thắng quân sự không giải thích được đời sống dân thường, ngoại giao, hậu phương, thống nhất pháp lý hay khủng hoảng kinh tế. Cũng cần phân biệt mục tiêu tự vệ ở biên giới Tây Nam với quá trình hiện diện kéo dài tại Campuchia và tranh luận quốc tế quanh quá trình đó. Đổi mới năm 1986 là bước ngoặt nhưng không tạo kết quả tức thời; đây là tiến trình điều chỉnh thể chế và chính sách trong bối cảnh trong nước lẫn quốc tế biến động.",
      debates: [{title: "Năm 1975 đã hoàn tất mọi nhiệm vụ hậu chiến chưa?", summary: "1975 kết thúc một cuộc chiến và mở đường thống nhất, nhưng thống nhất nhà nước năm 1976, tái thiết, biên giới, Campuchia và cải cách kinh tế tiếp tục là những chặng riêng cần được giải thích.", claimIds: ["claim-g9-vietnam-1945-resistance", "claim-g9-vietnam-1945-doi-moi"]}],
    },
    en: {
      title: "Vietnam, 1945–1991: resistance, reunification, defence, and Đổi mới",
      slug: "vietnam-1945-1991-resistance-reunification-defence-and-doi-moi",
      summary: "From defending a new state through war, legal reunification, border defence, reconstruction, and reform, this history did not stop in April 1975.",
      body: "After 2 September 1945, the new state faced famine, illiteracy, financial weakness, and foreign forces. Negotiation did not prevent nationwide war beginning in December 1946. Resistance from 1946 to 1954 joined battlefront, home front, and diplomacy through Viet Bac in 1947, the Border Campaign in 1950, and Dien Bien Phu in May 1954. The Geneva agreements ended hostilities and created temporary regrouping zones; they were not completed national reunification. From 1954, the North built a new social order and supported the struggle for reunification, while the South experienced the Republic of Vietnam, political conflict, and an increasingly internationalised war. War caused immense death, destruction, displacement, unexploded ordnance, chemical harm, and divided families. The 1973 Paris agreement provided for ending the war and US withdrawal, but combat continued. The Ho Chi Minh Campaign ended on 30 April 1975; in 1976 the Sixth National Assembly completed state reunification and named the country the Socialist Republic of Vietnam. Postwar Vietnam combined reconstruction with the difficulties of central planning, embargo, and border conflict. Defence of the southwestern border in 1978–1979 was connected to fighting alongside Cambodian forces against the Khmer Rouge genocide; war on the northern border began in February 1979 and tensions continued. Vietnamese volunteer forces fully withdrew from Cambodia in 1989, and the peace process produced the 1991 Paris agreements on Cambodia. At home, the Sixth Party Congress in December 1986 initiated comprehensive Đổi mới, beginning with new economic thinking. By 1991, changes in production and foreign relations had opened another stage, while war legacies, livelihoods, and institutional reform still required long-term work.",
      learningObjectives: ["Analyse 1945–1954 and 1954–1975 together with the social costs of war.", "Distinguish the 1975 military conclusion from state reunification in 1976.", "Explain border defence, Cambodia, postwar crisis, and the reform turning point of 1986–1991."],
      originalSummary: "Independence was defended through two long wars; after 1975, state reunification, reconstruction, border defence, and Đổi mới continued to shape Vietnam through 1991.",
      analysis: "A chronology of military victories alone cannot explain civilian life, diplomacy, the home front, legal reunification, or economic crisis. Analysis should also distinguish the defensive objective on the southwestern border from the prolonged presence in Cambodia and international disputes around it. Đổi mới in 1986 was a turning point rather than an instant outcome: it began an institutional and policy process amid rapidly changing domestic and international conditions.",
      debates: [{title: "Did 1975 complete every postwar task?", summary: "It ended a war and enabled reunification, but the 1976 state settlement, reconstruction, borders, Cambodia, and economic reform were distinct subsequent developments.", claimIds: ["claim-g9-vietnam-1945-resistance", "claim-g9-vietnam-1945-doi-moi"]}],
    },
    claims: [
      {id: "claim-g9-vietnam-1945-resistance", claimType: "OUTCOME", assessment: "CONFIRMED", statementVi: "Cuộc kháng chiến toàn quốc chống thực dân Pháp diễn ra từ năm 1946 đến năm 1954 và kết thúc bằng chiến thắng Điện Biên Phủ tháng 5/1954.", statementEn: "The nationwide resistance war against French colonial rule lasted from 1946 to 1954 and culminated in the Dien Bien Phu victory in May 1954.", sourceId: "source-g9-vnmh-france-war", locator: "Giới thiệu trưng bày — kháng chiến 9 năm 1946–1954 và Điện Biên Phủ tháng 5/1954", note: "Claim chỉ khóa phạm vi và kết điểm do trưng bày nêu; Hiệp định Genève được phân tích ở cấp bài."},
      {id: "claim-g9-vietnam-1945-doi-moi", claimType: "DATE", assessment: "CONFIRMED", statementVi: "Đại hội VI diễn ra từ ngày 15 đến 18/12/1986 và đề ra đường lối Đổi mới toàn diện, trong đó đổi mới tư duy kinh tế là bước khởi đầu quan trọng.", statementEn: "The Sixth Party Congress met from 15 to 18 December 1986 and set out comprehensive Đổi mới, with renewed economic thinking as an important starting point.", sourceId: "source-g9-government-doi-moi", locator: "Phần ‘Đại hội đại biểu toàn quốc lần thứ VI Đảng Cộng sản Việt Nam (12-1986)’", note: "Claim khóa ngày và nội dung bước ngoặt theo hồ sơ Chính phủ; kết quả dài hạn không được gán hết cho một hội nghị."},
    ],
  },
  {
    id: "lesson-g9-world-since-1991",
    requirementId: "g9-world-since-1991",
    sourceIds: ["source-g9-un-sdg-2026", "source-g9-itu-2025", "source-g9-wmo-2025", "source-g9-who-covid"],
    currentUpdate: true,
    vi: {
      title: "Thế giới 1991–2026: kết nối sâu hơn, rủi ro chung lớn hơn",
      slug: "the-gioi-1991-2026-ket-noi-sau-hon-rui-ro-chung-lon-hon",
      summary: "Cập nhật đến 11/08/2026: toàn cầu hóa và số hóa mở rộng cơ hội nhưng đi cùng bất bình đẳng, khủng hoảng, đại dịch, khí hậu và tranh luận về quản trị AI.",
      body: "Sau khi Liên Xô tan rã năm 1991, không còn cấu trúc hai cực cũ nhưng không có một trật tự duy nhất được chấp nhận. Thương mại, chuỗi cung ứng, tài chính và di chuyển xuyên biên giới phát triển; Internet làm thay đổi lao động, truyền thông và tri thức. Các xung đột ở Balkan, Trung Đông, châu Phi và nơi khác cho thấy hậu Chiến tranh lạnh không đồng nghĩa với hòa bình. Vụ tấn công khủng bố ngày 11/9/2001 và các cuộc chiến sau đó định hình an ninh quốc tế, trong khi khủng hoảng tài chính 2008 phơi bày mức độ lây lan của rủi ro trong hệ thống kinh tế kết nối. Năm 2015, các quốc gia thông qua Chương trình nghị sự 2030 và Thỏa thuận Paris về khí hậu, biến phát triển bền vững thành một khung hợp tác chung nhưng không xóa được khác biệt về nguồn lực và trách nhiệm. Năm 2020, WHO mô tả COVID-19 là đại dịch; khủng hoảng y tế lan sang giáo dục, việc làm, di cư và chuỗi cung ứng. Chuyển đổi số tăng tốc, song chênh lệch tiếp cận vẫn lớn. ITU ước tính khoảng 6 tỉ người trực tuyến năm 2025 và 2,2 tỉ người còn ngoại tuyến; đây là ước tính thống kê, không phải kiểm đếm tuyệt đối. Trí tuệ nhân tạo tạo công cụ mới cho nghiên cứu và sản xuất nhưng cũng đặt vấn đề về thiên lệch, việc làm, quyền riêng tư, thông tin sai và tập trung quyền lực. Dữ liệu quan sát đến năm 2025 trong báo cáo WMO công bố năm 2026 cho thấy 2015–2025 là 11 năm nóng nhất từng ghi nhận. Báo cáo SDG 2026 đánh giá tiến độ đạt mục tiêu kể từ 2015, chứ không bảo đảm kết quả năm 2030. Vì vậy, tính đến ngày 11/08/2026, có thể xác nhận xu thế kết nối và rủi ro chung; mọi nhận định về tương lai sau ngày này chỉ là kịch bản hoặc dự báo, không phải dữ kiện đã xảy ra.",
      learningObjectives: ["Phân tích toàn cầu hóa qua thương mại, tài chính, di cư và truyền thông từ năm 1991.", "Liên hệ các mốc 2001, 2008, 2015 và 2020 với biến đổi an ninh và phát triển.", "Phân biệt dữ liệu quan sát, ước tính thống kê và dự báo khi đọc nguồn cập nhật đến 11/08/2026."],
      originalSummary: "Thế giới sau 1991 kết nối sâu hơn nhưng không đồng nhất; công nghệ, dịch bệnh và khí hậu cho thấy lợi ích và rủi ro xuyên biên giới được phân phối rất không đều.",
      analysis: "Các thuật ngữ ‘đơn cực’ và ‘đa cực’ là khung phân tích có tranh luận, không phải một dữ kiện duy nhất. Toàn cầu hóa vừa tạo tăng trưởng và trao đổi vừa làm cú sốc lan nhanh hơn. Dữ liệu ITU là ước tính cho năm 2025; dữ liệu khí hậu WMO quan sát tới 2025; báo cáo SDG 2026 đo tiến độ, còn mục tiêu 2030 là mục tiêu tương lai. Bài không biến các mục tiêu hoặc kịch bản thành kết quả đã xảy ra.",
      debates: [{title: "Công nghệ số làm thế giới bình đẳng hơn hay phân tầng sâu hơn?", summary: "Kết nối mở rộng tiếp cận tri thức, nhưng hạ tầng, giá cả, kỹ năng, dữ liệu và quyền kiểm soát nền tảng tạo ra những khoảng cách mới; cả hai xu hướng cùng tồn tại.", claimIds: ["claim-g9-world-current-covid", "claim-g9-world-current-digital"]}],
    },
    en: {
      title: "The world, 1991–2026: deeper connection, greater shared risk",
      slug: "world-1991-2026-deeper-connection-and-greater-shared-risk",
      summary: "Updated through 11 August 2026: globalisation and digitalisation expanded opportunity while inequality, crisis, pandemic, climate change, and AI governance became shared challenges.",
      body: "After the Soviet Union dissolved in 1991, the old bipolar structure disappeared without producing one universally accepted order. Trade, supply chains, finance, and cross-border movement expanded; the Internet transformed work, communication, and knowledge. Conflicts in the Balkans, Middle East, Africa, and elsewhere showed that the post-Cold War era was not an age of automatic peace. The terrorist attacks of 11 September 2001 and subsequent wars reshaped international security, while the 2008 financial crisis exposed how risk travels through an interconnected economy. In 2015 states adopted the 2030 Agenda and the Paris climate agreement, creating shared frameworks without eliminating unequal resources or responsibilities. In 2020 WHO characterised COVID-19 as a pandemic; the health emergency disrupted education, employment, migration, and supply chains. Digitalisation accelerated, yet access remained unequal. ITU estimated about six billion people online in 2025 and 2.2 billion offline; these are statistical estimates, not a literal census. Artificial intelligence created tools for research and production while raising questions about bias, jobs, privacy, misinformation, and concentrated power. Observations through 2025 in WMO's 2026 report identify 2015–2025 as the eleven warmest years on record. The 2026 SDG report measures progress since 2015; it does not guarantee outcomes in 2030. As of 11 August 2026, deeper connection and shared risks can be documented, while claims about later years remain scenarios or forecasts rather than events that have happened.",
      learningObjectives: ["Analyse globalisation through trade, finance, migration, and communication since 1991.", "Connect 2001, 2008, 2015, and 2020 to changing security and development.", "Distinguish observations, statistical estimates, and forecasts in sources current to 11 August 2026."],
      originalSummary: "The post-1991 world became more connected without becoming uniform; technology, pandemic, and climate reveal benefits and cross-border risks distributed very unevenly.",
      analysis: "‘Unipolar’ and ‘multipolar’ are contested analytical frames, not a single settled fact. Globalisation supports exchange and growth while allowing shocks to spread faster. ITU values are 2025 estimates, WMO observations run through 2025, and the 2026 SDG report assesses progress; the 2030 Goals remain future targets. This lesson does not recast goals, projections, or scenarios as completed events.",
      debates: [{title: "Does digital technology equalise the world or deepen stratification?", summary: "Connectivity expands access to knowledge, but infrastructure, cost, skills, data, and platform control create new gaps; both developments coexist.", claimIds: ["claim-g9-world-current-covid", "claim-g9-world-current-digital"]}],
    },
    claims: [
      {id: "claim-g9-world-current-covid", claimType: "DATE", assessment: "CONFIRMED", statementVi: "WHO tuyên bố tình trạng khẩn cấp y tế công cộng quốc tế ngày 30/1/2020, mô tả COVID-19 là đại dịch ngày 11/3/2020 và chấm dứt tình trạng PHEIC ngày 5/5/2023.", statementEn: "WHO declared a public health emergency of international concern on 30 January 2020, characterised COVID-19 as a pandemic on 11 March 2020, and ended the PHEIC on 5 May 2023.", sourceId: "source-g9-who-covid", locator: "Overview — PHEIC, pandemic characterisation, and 5 May 2023 emergency-status paragraphs", note: "Claim phân biệt kết thúc tình trạng PHEIC với tuyên bố rằng bệnh đã biến mất."},
      {id: "claim-g9-world-current-digital", claimType: "CONTEXT", assessment: "CONFIRMED", statementVi: "ITU ước tính năm 2025 có khoảng 6 tỉ người sử dụng Internet và 2,2 tỉ người vẫn ngoại tuyến.", statementEn: "ITU estimated that about six billion people used the Internet in 2025 while 2.2 billion remained offline.", sourceId: "source-g9-itu-2025", locator: "Facts and Figures 2025 overview and press release dated 17 November 2025", note: "Claim gắn nhãn đây là ước tính năm 2025 và không kéo số liệu sang 2026."},
    ],
  },
  {
    id: "lesson-g9-vietnam-since-1991",
    requirementId: "g9-vietnam-since-1991",
    sourceIds: ["source-g9-mofa-us", "source-g9-asean-50", "source-g9-wto-vietnam", "source-g9-world-bank-vietnam-2026", "source-g9-gso-2026"],
    currentUpdate: true,
    vi: {
      title: "Việt Nam 1991–2026: hội nhập, phát triển và những bài toán mới",
      slug: "viet-nam-1991-2026-hoi-nhap-phat-trien-va-nhung-bai-toan-moi",
      summary: "Cập nhật đến 11/08/2026: Việt Nam mở rộng quan hệ, hội nhập ASEAN và WTO, cải thiện nhiều mặt đời sống nhưng vẫn đối diện năng suất, già hóa, khí hậu và bất bình đẳng cơ hội.",
      body: "Từ năm 1991, Việt Nam bước vào giai đoạn mở rộng quan hệ đối ngoại trong bối cảnh trật tự thế giới và khu vực thay đổi. Bình thường hóa quan hệ với Trung Quốc năm 1991, thiết lập quan hệ ngoại giao với Hoa Kỳ ngày 12/7/1995 và gia nhập ASEAN ngày 28/7/1995 mở rộng không gian hợp tác. Hội nhập không chỉ là tham gia tổ chức: nó đòi hỏi điều chỉnh luật lệ, năng lực doanh nghiệp, ngoại giao đa phương và bảo vệ lợi ích quốc gia trong quan hệ phụ thuộc lẫn nhau. Việt Nam trở thành thành viên WTO ngày 11/1/2007, tham gia nhiều hiệp định thương mại và hoạt động quốc tế, qua đó tiếp cận thị trường, vốn và công nghệ nhưng cũng chịu cạnh tranh và biến động từ bên ngoài. Đổi mới và hội nhập góp phần chuyển Việt Nam từ một nước nghèo thành nền kinh tế thu nhập trung bình. Dữ liệu World Bank quan sát đến các năm 2023–2025 cho thấy cải thiện về tuổi thọ, bảo hiểm y tế, giáo dục và điện khí hóa; những chỉ số này có năm tham chiếu khác nhau và không được gọi chung là ‘số liệu 2026’. Thành tựu cũng không tự động phân bổ đều giữa vùng, giới, nhóm thu nhập hay lao động chính thức và phi chính thức. Đô thị hóa, di cư, Internet và kinh tế số thay đổi cách học, làm việc và kết nối cộng đồng. Tính đến ngày 11/08/2026, nguồn World Bank cập nhật tháng 7/2026 nêu các thách thức gồm già hóa dân số, thay đổi thương mại, tự động hóa và rủi ro khí hậu. Trang cũng đưa dự báo tăng trưởng 2026–2027; đó là ước tính hướng tới tương lai, không phải kết quả đã quan sát. Danh mục của Cơ quan Thống kê Quốc gia ghi báo cáo quý II và sáu tháng đầu năm 2026 đăng ngày 03/7/2026, kỳ tham chiếu tháng 6/2026; dữ liệu ngắn hạn không đủ để khẳng định xu thế dài hạn. Bài học vì thế kết hợp niềm tự hào về thành tựu với năng lực đọc nguồn, nhận diện giới hạn và tham gia giải quyết các bài toán phát triển bao trùm, xanh và tự chủ.",
      learningObjectives: ["Trình bày các mốc đối ngoại và hội nhập 1991, ASEAN 1995, quan hệ Việt–Mỹ 1995 và WTO 2007.", "Đánh giá thành tựu phát triển bằng chỉ số có năm tham chiếu cụ thể.", "Phân biệt số liệu quan sát, kỳ báo cáo ngắn hạn và dự báo khi cập nhật đến 11/08/2026."],
      originalSummary: "Hội nhập sau 1991 mở rộng cơ hội phát triển và vị thế của Việt Nam, đồng thời làm năng lực thể chế, năng suất, công bằng xã hội và sức chống chịu khí hậu trở nên cấp thiết hơn.",
      analysis: "Không nên kể hội nhập như một chuỗi lễ kết nạp hoặc xem mọi tăng trưởng là kết quả của một mốc duy nhất. Cải cách trong nước, lao động, đầu tư, thị trường quốc tế và ổn định xã hội tương tác. Các con số y tế 2023, giáo dục 2024 và tăng trưởng 2025 là dữ liệu quan sát theo từng năm; con số 2026–2027 trên World Bank là forecast. Việc công khai kỳ tham chiếu giúp học sinh không nhầm ‘trang cập nhật năm 2026’ với ‘mọi dữ liệu đều thuộc năm 2026’.",
      debates: [{title: "Hội nhập sâu có làm giảm tự chủ không?", summary: "Hội nhập tạo thị trường, nguồn lực và luật chơi chung nhưng cũng tăng độ nhạy với cú sốc bên ngoài; tự chủ không phải tách biệt mà là năng lực lựa chọn, đa dạng hóa và thực thi chính sách.", claimIds: ["claim-g9-vietnam-current-asean", "claim-g9-vietnam-current-wto"]}],
    },
    en: {
      title: "Vietnam, 1991–2026: integration, development, and new challenges",
      slug: "vietnam-1991-2026-integration-development-and-new-challenges",
      summary: "Updated through 11 August 2026: Vietnam expanded relations and joined ASEAN and the WTO, improving many aspects of life while facing productivity, ageing, climate, and unequal opportunity.",
      body: "From 1991, Vietnam expanded foreign relations as regional and global structures changed. Normalisation with China in 1991, diplomatic relations with the United States on 12 July 1995, and entry into ASEAN on 28 July 1995 widened cooperation. Integration means more than membership ceremonies: it requires legal adjustment, capable firms, multilateral diplomacy, and protection of national interests under interdependence. Vietnam became a WTO member on 11 January 2007 and joined further trade agreements and international activities, gaining access to markets, capital, and technology while also facing competition and external shocks. Đổi mới and integration helped move Vietnam from poverty to middle-income status. World Bank observations for different years through 2023–2025 document improvements in life expectancy, health insurance, schooling, and electrification; these indicators have separate reference years and are not all ‘2026 data’. Progress is not distributed automatically or equally across regions, genders, income groups, or formal and informal workers. Urbanisation, migration, the Internet, and a digital economy changed learning, work, and community. As of 11 August 2026, the World Bank country page updated through July 2026 identifies ageing, trade shifts, automation, and climate risk as challenges. Its figures for growth in 2026–2027 are forecast estimates, not observed outcomes. Vietnam's statistics agency listed its second-quarter and first-half 2026 report on 3 July 2026 with June 2026 as the reference period; short-run data alone cannot establish a long-term trend. The lesson therefore joins pride in achievement to source literacy, recognition of limits, and participation in building inclusive, green, and resilient development.",
      learningObjectives: ["Outline the milestones of 1991, ASEAN and US relations in 1995, and WTO membership in 2007.", "Assess development achievements using indicators with explicit reference years.", "Distinguish observations, short reporting periods, and forecasts in an update current to 11 August 2026."],
      originalSummary: "Post-1991 integration expanded Vietnam's development opportunities and standing while making institutional capacity, productivity, social inclusion, and climate resilience more urgent.",
      analysis: "Integration should not be reduced to accession ceremonies, nor should all growth be credited to one milestone. Domestic reform, labour, investment, international markets, and social stability interact. Health values from 2023, education values from 2024, and 2025 growth are observations tied to those years; World Bank values for 2026–2027 are forecasts. Publishing each reference period prevents a page updated in 2026 from being misread as though every datum described 2026.",
      debates: [{title: "Does deeper integration reduce autonomy?", summary: "Integration brings markets, resources, and shared rules while increasing exposure to external shocks; autonomy is the capacity to choose, diversify, and implement policy rather than isolation.", claimIds: ["claim-g9-vietnam-current-asean", "claim-g9-vietnam-current-wto"]}],
    },
    claims: [
      {id: "claim-g9-vietnam-current-asean", claimType: "DATE", assessment: "CONFIRMED", statementVi: "Việt Nam gia nhập ASEAN ngày 28/7/1995 và trở thành thành viên thứ bảy của tổ chức.", statementEn: "Vietnam joined ASEAN on 28 July 1995 as the organisation's seventh member.", sourceId: "source-g9-asean-50", locator: "ASEAN 50 historical timeline — membership expansion entry for Viet Nam, 28 July 1995", note: "Claim chỉ khóa ngày và thứ tự thành viên theo ấn phẩm chính thức ASEAN."},
      {id: "claim-g9-vietnam-current-wto", claimType: "DATE", assessment: "CONFIRMED", statementVi: "Việt Nam là thành viên của Tổ chức Thương mại Thế giới từ ngày 11/1/2007.", statementEn: "Vietnam has been a member of the World Trade Organization since 11 January 2007.", sourceId: "source-g9-wto-vietnam", locator: "Member information opening paragraph — ‘member of the WTO since 11 January 2007’", note: "Claim bám đúng hồ sơ thành viên WTO; ảnh hưởng kinh tế được phân tích ở cấp bài."},
    ],
  },
];

export const grade9Lessons: Grade9LessonSeed[] = [
  {
    id: "lesson-g9-world-1918-1945",
    requirementId: "g9-world-1918-1945",
    sourceIds: ["source-g9-un-history", "source-g9-ushmm-nazi", "source-g9-iwm-1945"],
    currentUpdate: false,
    vi: {
      title: "Thế giới 1918–1945: khủng hoảng, phát xít và chiến tranh toàn cầu",
      slug: "the-gioi-1918-1945-khung-hoang-phat-xit-va-chien-tranh-toan-cau",
      summary: "Từ trật tự hậu chiến mong manh đến Đại khủng hoảng, chủ nghĩa phát xít, Holocaust và Chiến tranh thế giới thứ hai, giai đoạn này cho thấy hòa bình không thể chỉ dựa vào hiệp ước.",
      body: "Năm 1918, Chiến tranh thế giới thứ nhất kết thúc nhưng hòa bình không đồng nghĩa với ổn định. Hòa ước Versailles năm 1919 vẽ lại biên giới, đặt nghĩa vụ nặng lên Đức và tạo ra Hội Quốc Liên. Cách mạng Nga và sự hình thành Liên Xô mở ra một mô hình chính trị–kinh tế mới, trong khi các đế quốc vẫn duy trì thuộc địa. Hội Quốc Liên đặt ra cơ chế hợp tác nhưng thiếu sự tham gia và khả năng cưỡng chế cần thiết; mâu thuẫn về dân tộc, thuộc địa, bồi thường và an ninh vì thế không được giải quyết dứt điểm. Khủng hoảng kinh tế khởi phát năm 1929 làm thất nghiệp, nghèo đói và bất an chính trị lan rộng. Ở Đức, Quốc xã khai thác khủng hoảng, chủ nghĩa dân tộc cực đoan và bài Do Thái; Hitler được bổ nhiệm Thủ tướng năm 1933 rồi phá bỏ các thiết chế dân chủ để dựng chế độ độc tài một đảng. Phát xít Ý và quân phiệt Nhật theo đuổi bành trướng bằng vũ lực. Chiến tranh bùng nổ ở châu Âu năm 1939 nhưng đã có xâm lược trước đó ở châu Á và châu Phi, nên phải nhìn cuộc chiến như một quá trình toàn cầu. Từ 1939 đến 1945, chiến tranh huy động công nghiệp, khoa học và xã hội ở quy mô chưa từng có. Dân thường chịu ném bom, đói, di dời và lao động cưỡng bức. Holocaust là cuộc đàn áp và sát hại có hệ thống do Đức Quốc xã cùng đồng phạm thực hiện, không thể gộp thành tổn thất chiến tranh thông thường. Năm 1945, Đức và Nhật đầu hàng; các trại tập trung được giải phóng và bom nguyên tử lần đầu được sử dụng trong chiến tranh. Liên Hợp Quốc ra đời ngày 24/10/1945 từ nỗ lực xây dựng cơ chế an ninh tập thể mới. Kết thúc chiến tranh đồng thời mở ra xét xử tội ác, phi thực dân hóa và một trật tự quốc tế mới đầy căng thẳng.",
      learningObjectives: ["Giải thích vì sao trật tự sau năm 1918 và Hội Quốc Liên không ngăn được khủng hoảng mới.", "Phân tích quan hệ giữa Đại khủng hoảng, phát xít, bành trướng và chiến tranh.", "Đánh giá chiến tranh 1939–1945 qua trải nghiệm dân thường, Holocaust và thiết chế quốc tế sau chiến tranh."],
      originalSummary: "Hòa bình sau 1918 thiếu nền tảng bao trùm; khủng hoảng kinh tế và chính trị giúp các chế độ bành trướng phát triển, dẫn tới chiến tranh toàn cầu và nỗ lực kiến tạo Liên Hợp Quốc năm 1945.",
      analysis: "Không nên giải thích chiến tranh bằng một nguyên nhân duy nhất hoặc xem năm 1939 là điểm khởi đầu giống nhau ở mọi khu vực. Versailles, khủng hoảng kinh tế, chủ nghĩa đế quốc, phân biệt chủng tộc, quyết định của các chính phủ và thất bại của an ninh tập thể tương tác với nhau. Cách tiếp cận này cũng tránh biến Holocaust thành hệ quả ngẫu nhiên: đó là chính sách có tư tưởng, bộ máy và lựa chọn của con người. Bài học về thiết chế quốc tế cần đi cùng giới hạn quyền lực và trách nhiệm của thành viên.",
      debates: [{title: "Hội Quốc Liên thất bại vì thiết kế hay vì lựa chọn của các quốc gia?", summary: "Thiết kế thiếu công cụ cưỡng chế là một giới hạn, nhưng thái độ không tham gia, thỏa hiệp và ưu tiên lợi ích riêng của các nhà nước cũng làm an ninh tập thể suy yếu.", claimIds: ["claim-g9-world-1918-un", "claim-g9-world-1918-nazi"]}],
    },
    en: {
      title: "The world, 1918–1945: crisis, fascism, and global war",
      slug: "world-1918-1945-crisis-fascism-and-global-war",
      summary: "From a fragile postwar settlement through depression, fascism, the Holocaust, and the Second World War, the period shows why treaties alone could not sustain peace.",
      body: "The First World War ended in 1918, but the absence of fighting did not produce a stable peace. The 1919 Versailles settlement redrew borders, imposed heavy obligations on Germany, and established the League of Nations. The Russian Revolution and the formation of the Soviet Union introduced another political-economic model while imperial powers retained colonies. The League offered machinery for cooperation yet lacked broad participation and dependable enforcement; disputes over nationality, empire, reparations, and security remained unresolved. Economic collapse beginning in 1929 spread unemployment, poverty, and political fear. In Germany the Nazi movement exploited depression, extreme nationalism, and antisemitism. Hitler became chancellor in 1933 and dismantled democratic institutions to construct a one-party dictatorship. Fascist Italy and militarist Japan pursued expansion by force. War began in Europe in 1939, but invasions had already transformed parts of Asia and Africa, so the conflict must be studied as a global process. Between 1939 and 1945, governments mobilised industry, science, and whole societies on an unprecedented scale. Civilians experienced bombing, hunger, displacement, and forced labour. The Holocaust was the systematic persecution and murder organised by Nazi Germany and its collaborators, not an interchangeable category of wartime loss. In 1945 Germany and Japan surrendered, concentration camps were liberated, and atomic weapons were used in war for the first time. The United Nations came into existence on 24 October 1945 as another attempt at collective security. The end of war also opened questions of criminal accountability, decolonisation, and a new but deeply divided order.",
      learningObjectives: ["Explain why the post-1918 settlement and League of Nations did not prevent renewed crisis.", "Analyse connections among the Great Depression, fascism, expansion, and war.", "Assess the 1939–1945 conflict through civilian experience, the Holocaust, and postwar institutions."],
      originalSummary: "The post-1918 peace lacked an inclusive foundation; economic and political crisis enabled expansionist regimes, global war, and a renewed attempt at collective security through the United Nations in 1945.",
      analysis: "No single cause explains the war, and 1939 was not an identical starting point in every region. Versailles, economic collapse, imperialism, racial ideology, government choices, and failures of collective security interacted. This lens also prevents the Holocaust from appearing accidental: it depended on an ideology, institutions, and human decisions. Studying international organisations requires attention both to their rules and to whether member states supply political will and power.",
      debates: [{title: "Did the League fail because of its design or because of state choices?", summary: "Weak enforcement was a structural limit, but non-participation, appeasement, and governments placing narrow interests above collective commitments also weakened the system.", claimIds: ["claim-g9-world-1918-un", "claim-g9-world-1918-nazi"]}],
    },
    claims: [
      {id: "claim-g9-world-1918-un", claimType: "DATE", assessment: "CONFIRMED", statementVi: "Hiến chương Liên Hợp Quốc được ký ngày 26/6/1945 và tổ chức chính thức ra đời ngày 24/10/1945.", statementEn: "The United Nations Charter was signed on 26 June 1945, and the organisation officially came into existence on 24 October 1945.", sourceId: "source-g9-un-history", locator: "Sections ‘The Charter is signed’ and ‘The UN officially comes into existence’", note: "Claim chỉ khóa hai mốc thành lập do trang lịch sử chính thức của Liên Hợp Quốc nêu."},
      {id: "claim-g9-world-1918-nazi", claimType: "CONTEXT", assessment: "CONFIRMED", statementVi: "Đảng Quốc xã cai trị Đức như một chế độ độc tài toàn trị một đảng từ năm 1933 đến năm 1945 và dùng quyền lực để đàn áp người Do Thái.", statementEn: "The Nazi Party ruled Germany as a one-party totalitarian dictatorship from 1933 to 1945 and used its power to persecute Jews.", sourceId: "source-g9-ushmm-nazi", locator: "Key Facts, item 3, and Introduction; last edited 21 July 2025", note: "Claim bám đúng hồ sơ bảo tàng, không mở rộng sang toàn bộ nguyên nhân Holocaust."},
    ],
  },
  ...grade9AdditionalLessons,
];
