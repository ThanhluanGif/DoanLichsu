import type { CurriculumTrack,Grade } from "@/lib/content/types";

export const curriculumProgrammeAsOf="2026-08-10T00:00:00.000Z";

export const curriculumOfficialSources={
  consolidatedHistory:"https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1483/vbhn-chuong-trinh-mon-lich-su.pdf",
  circular13:"https://vanban.chinhphu.vn/?docid=206343&pageid=27160",
  circular17:"https://vanban.chinhphu.vn/?docid=215347&pageid=27160",
} as const;

export type CurriculumRequirementSeed={
  id:string;grade:Grade;track:CurriculumTrack;topicVi:string;topicEn:string;
  slugVi:string;slugEn:string;officialProgramRef:string;
  periodStart:number|null;periodEnd:number|null;
  requiredOutcomesVi:string[];requiredOutcomesEn:string[];sortOrder:number;
};

function requirement(
  grade:Grade,track:CurriculumTrack,sortOrder:number,slug:string,
  topicVi:string,topicEn:string,requiredOutcomesVi:string[],requiredOutcomesEn:string[],
  periodStart:number|null=null,periodEnd:number|null=null,
):CurriculumRequirementSeed{
  const programme=grade<=9
    ?"Chương trình GDPT môn Lịch sử và Địa lí THCS, Thông tư 32/2018/TT-BGDĐT, cập nhật Thông tư 17/2025/TT-BGDĐT"
    :"Chương trình GDPT môn Lịch sử, Thông tư 32/2018/TT-BGDĐT, cập nhật Thông tư 13/2022/TT-BGDĐT và 17/2025/TT-BGDĐT";
  return{id:`g${grade}-${slug}`,grade,track,topicVi,topicEn,slugVi:slug,slugEn:slug,
    officialProgramRef:`${programme} — Lớp ${grade}: ${topicVi}`,
    periodStart,periodEnd,requiredOutcomesVi,requiredOutcomesEn,sortOrder};
}

const M="MANDATORY" as const;
const E="ELECTIVE" as const;

export const curriculumRequirements:CurriculumRequirementSeed[]=[
  requirement(6,M,10,"why-study-history","Tại sao cần học Lịch sử?","Why study history?",
    ["Nhận biết lịch sử, tư liệu lịch sử và cách tính thời gian."],["Recognise history, historical sources, and historical time."]),
  requirement(6,M,20,"human-origins","Nguồn gốc loài người và xã hội nguyên thủy","Human origins and early society",
    ["Trình bày những nét chính về nguồn gốc, lao động và đời sống người nguyên thủy."],["Outline human origins, labour, and early social life."],-3000000,-4000),
  requirement(6,M,30,"ancient-civilisations","Các xã hội và nền văn minh cổ đại","Ancient societies and civilisations",
    ["Nhận biết thành tựu tiêu biểu của Ai Cập, Lưỡng Hà, Ấn Độ, Trung Hoa, Hy Lạp và La Mã."],["Identify representative achievements of major ancient civilisations."],-4000,476),
  requirement(6,M,40,"southeast-asia-to-tenth-century","Đông Nam Á từ những thế kỉ tiếp giáp Công nguyên đến thế kỉ X","Southeast Asia to the tenth century",
    ["Mô tả sự hình thành các vương quốc và giao lưu khu vực."],["Describe the formation of regional kingdoms and exchange."],1,1000),
  requirement(6,M,50,"van-lang-au-lac","Văn Lang – Âu Lạc","Văn Lang and Âu Lạc",
    ["Trình bày tổ chức, đời sống và di sản của các nhà nước đầu tiên trên đất Việt Nam."],["Outline the organisation, life, and legacy of early states in Vietnam."],-700,-179),
  requirement(6,M,60,"northern-rule-resistance","Thời Bắc thuộc và các cuộc đấu tranh giành độc lập","Northern rule and struggles for independence",
    ["Giải thích những chuyển biến và các cuộc đấu tranh tiêu biểu đến đầu thế kỉ X."],["Explain major changes and representative independence struggles to the early tenth century."],-179,938),
  requirement(6,M,70,"champa","Vương quốc Chăm-pa","The kingdom of Champa",
    ["Nhận biết quá trình hình thành, phát triển và di sản Chăm-pa."],["Recognise the formation, development, and heritage of Champa."],192,1832),
  requirement(6,M,80,"funan","Vương quốc Phù Nam","The kingdom of Funan",
    ["Nhận biết sự hình thành, thương mại và văn hóa Phù Nam."],["Recognise Funan's formation, trade, and culture."],1,700),

  requirement(7,M,10,"medieval-western-europe","Tây Âu từ thế kỉ V đến nửa đầu thế kỉ XVI","Western Europe from the fifth to early sixteenth century",
    ["Trình bày xã hội phong kiến, đô thị, Phục hưng và Cải cách tôn giáo."],["Outline feudal society, towns, the Renaissance, and Reformation."],476,1550),
  requirement(7,M,20,"medieval-china-india","Trung Quốc và Ấn Độ thời trung đại","Medieval China and India",
    ["Nhận biết tiến trình chính trị và thành tựu văn hóa tiêu biểu."],["Identify major political developments and cultural achievements."],600,1850),
  requirement(7,M,30,"southeast-asia-tenth-sixteenth","Đông Nam Á từ nửa sau thế kỉ X đến nửa đầu thế kỉ XVI","Southeast Asia from the late tenth to early sixteenth century",
    ["Trình bày sự phát triển của các vương quốc và văn hóa khu vực."],["Outline the development of regional kingdoms and cultures."],950,1550),
  requirement(7,M,40,"vietnam-tenth-thirteenth","Việt Nam từ đầu thế kỉ X đến đầu thế kỉ XIII","Vietnam from the tenth to early thirteenth century",
    ["Trình bày công cuộc xây dựng, bảo vệ quốc gia thời Ngô, Đinh, Tiền Lê và Lý."],["Outline state-building and defence under the Ngô, Đinh, Early Lê, and Lý."],938,1225),
  requirement(7,M,50,"vietnam-tran-ho","Việt Nam thời Trần và Hồ","Vietnam under the Trần and Hồ",
    ["Phân tích xây dựng đất nước và các cuộc kháng chiến chống Nguyên – Mông."],["Analyse state-building and resistance to Yuan-Mongol invasions."],1226,1407),
  requirement(7,M,60,"lam-son-later-le","Khởi nghĩa Lam Sơn và Đại Việt thời Lê sơ","Lam Sơn uprising and Đại Việt under the Later Lê",
    ["Trình bày khởi nghĩa Lam Sơn và những nét chính của Đại Việt thế kỉ XV."],["Outline the Lam Sơn uprising and Đại Việt in the fifteenth century."],1418,1527),

  requirement(8,M,10,"early-modern-revolutions","Các cuộc cách mạng tư sản thời cận đại","Early modern bourgeois revolutions",
    ["Nhận biết nguyên nhân, diễn biến chính và ý nghĩa của các cuộc cách mạng tiêu biểu."],["Identify causes, major developments, and significance of representative revolutions."],1566,1871),
  requirement(8,M,20,"industrial-revolution","Cách mạng công nghiệp","The Industrial Revolution",
    ["Trình bày thành tựu và tác động kinh tế, xã hội của công nghiệp hóa."],["Outline achievements and economic and social effects of industrialisation."],1750,1914),
  requirement(8,M,30,"southeast-asia-sixteenth-nineteenth","Đông Nam Á từ thế kỉ XVI đến thế kỉ XIX","Southeast Asia from the sixteenth to nineteenth century",
    ["Giải thích quá trình xâm nhập của chủ nghĩa thực dân và phản ứng khu vực."],["Explain colonial expansion and regional responses."],1500,1900),
  requirement(8,M,40,"vietnam-sixteenth-eighteenth","Việt Nam từ đầu thế kỉ XVI đến thế kỉ XVIII","Vietnam from the sixteenth to eighteenth century",
    ["Trình bày biến động chính trị, mở rộng lãnh thổ và phong trào Tây Sơn."],["Outline political change, territorial expansion, and the Tây Sơn movement."],1527,1802),
  requirement(8,M,50,"vietnam-nguyen-dynasty","Việt Nam nửa đầu thế kỉ XIX","Vietnam in the first half of the nineteenth century",
    ["Nhận biết tổ chức nhà Nguyễn và đời sống kinh tế, xã hội, văn hóa."],["Recognise Nguyễn administration and economic, social, and cultural life."],1802,1858),
  requirement(8,M,60,"vietnam-anti-colonial-1858-1884","Việt Nam chống thực dân Pháp xâm lược 1858–1884","Vietnamese resistance to French conquest, 1858–1884",
    ["Trình bày cuộc xâm lược và các phong trào kháng chiến tiêu biểu."],["Outline the conquest and representative resistance movements."],1858,1884),
  requirement(8,M,70,"vietnam-1885-1918","Việt Nam từ năm 1885 đến năm 1918","Vietnam from 1885 to 1918",
    ["Phân tích phong trào Cần Vương, Yên Thế và chuyển biến đầu thế kỉ XX."],["Analyse Cần Vương, Yên Thế, and early twentieth-century changes."],1885,1918),

  requirement(9,M,10,"world-1918-1945","Thế giới từ năm 1918 đến năm 1945","The world from 1918 to 1945",
    ["Trình bày trật tự thế giới, khủng hoảng và Chiến tranh thế giới thứ hai."],["Outline the world order, crises, and the Second World War."],1918,1945),
  requirement(9,M,20,"vietnam-1918-1945","Việt Nam từ năm 1918 đến năm 1945","Vietnam from 1918 to 1945",
    ["Phân tích phong trào dân tộc và Cách mạng tháng Tám năm 1945."],["Analyse national movements and the August Revolution of 1945."],1918,1945),
  requirement(9,M,30,"world-1945-1991","Thế giới từ năm 1945 đến năm 1991","The world from 1945 to 1991",
    ["Trình bày Chiến tranh lạnh, giải phóng dân tộc và biến đổi quốc tế."],["Outline the Cold War, decolonisation, and international change."],1945,1991),
  requirement(9,M,40,"vietnam-1945-1991","Việt Nam từ năm 1945 đến năm 1991","Vietnam from 1945 to 1991",
    ["Trình bày kháng chiến, thống nhất, bảo vệ Tổ quốc và bước đầu Đổi mới."],["Outline wars of independence, reunification, national defence, and early Đổi mới."],1945,1991),
  requirement(9,M,50,"world-since-1991","Thế giới từ năm 1991 đến nay","The world since 1991",
    ["Nhận biết xu thế phát triển, toàn cầu hóa và những thách thức mới."],["Recognise development trends, globalisation, and new challenges."],1991,2026),
  requirement(9,M,60,"vietnam-since-1991","Việt Nam từ năm 1991 đến nay","Vietnam since 1991",
    ["Trình bày thành tựu, thách thức và hội nhập của Việt Nam đến thời điểm cập nhật."],["Outline Vietnam's achievements, challenges, and integration to the stated as-of date."],1991,2026),

  requirement(10,M,10,"history-and-historiography","Lịch sử và Sử học","History and historiography",
    ["Phân biệt hiện thực lịch sử, nhận thức lịch sử và phương pháp sử học."],["Distinguish the historical past, historical knowledge, and historical methods."]),
  requirement(10,M,20,"roles-of-history","Vai trò của Sử học","The roles of history",
    ["Giải thích vai trò của sử học với di sản, phát triển và đời sống."],["Explain the roles of history in heritage, development, and public life."]),
  requirement(10,M,30,"ancient-medieval-world-civilisations","Một số nền văn minh thế giới thời cổ – trung đại","Selected ancient and medieval world civilisations",
    ["So sánh cơ sở hình thành và thành tựu tiêu biểu của các nền văn minh."],["Compare foundations and representative achievements of major civilisations."],-4000,1500),
  requirement(10,M,40,"industrial-revolutions-world-history","Các cuộc cách mạng công nghiệp trong lịch sử thế giới","Industrial revolutions in world history",
    ["Phân tích thành tựu và tác động của các cuộc cách mạng công nghiệp."],["Analyse achievements and impacts of successive industrial revolutions."],1750,2026),
  requirement(10,M,50,"southeast-asian-civilisation","Văn minh Đông Nam Á","Southeast Asian civilisation",
    ["Trình bày cơ sở, tiến trình và thành tựu của văn minh Đông Nam Á."],["Outline the foundations, development, and achievements of Southeast Asian civilisation."]),
  requirement(10,M,60,"civilisations-on-vietnamese-territory","Một số nền văn minh trên đất nước Việt Nam trước năm 1858","Selected civilisations on Vietnamese territory before 1858",
    ["Phân tích thành tựu và giá trị của Văn Lang – Âu Lạc, Chăm-pa, Phù Nam và Đại Việt."],["Analyse the achievements and value of major civilisations on Vietnamese territory."],-700,1858),
  requirement(10,M,70,"vietnamese-ethnic-communities","Cộng đồng các dân tộc Việt Nam","Vietnam's ethnic communities",
    ["Giải thích tính đa dạng, thống nhất và truyền thống đoàn kết cộng đồng."],["Explain diversity, unity, and traditions of solidarity among Vietnam's communities."]),
  requirement(10,E,110,"fields-of-historical-study","Các lĩnh vực của Sử học","Fields of historical study",
    ["Vận dụng cách tiếp cận của một số chuyên ngành sử học."],["Apply approaches from selected fields of historical study."]),
  requirement(10,E,120,"heritage-conservation","Bảo tồn và phát huy giá trị di sản văn hóa Việt Nam","Conserving and promoting Vietnamese cultural heritage",
    ["Đề xuất cách nhận diện, bảo tồn và phát huy di sản có trách nhiệm."],["Propose responsible ways to identify, conserve, and interpret heritage."]),
  requirement(10,E,130,"state-and-law-vietnam","Nhà nước và pháp luật Việt Nam trong lịch sử","State and law in Vietnamese history",
    ["Khái quát nhà nước, pháp luật và các bản Hiến pháp Việt Nam đến lần cập nhật 2025."],["Outline Vietnamese state, law, and constitutions through the 2025 update."]),

  requirement(11,M,10,"bourgeois-revolutions-capitalism","Cách mạng tư sản và sự phát triển của chủ nghĩa tư bản","Bourgeois revolutions and the development of capitalism",
    ["Phân tích mục tiêu, lực lượng, kết quả và sự phát triển của chủ nghĩa tư bản."],["Analyse aims, forces, outcomes, and the development of capitalism."],1566,2026),
  requirement(11,M,20,"socialism-since-1917","Chủ nghĩa xã hội từ năm 1917 đến nay","Socialism from 1917 to the present",
    ["Phân tích sự hình thành, phát triển, khủng hoảng và điều chỉnh của chủ nghĩa xã hội."],["Analyse the formation, development, crises, and adaptation of socialism."],1917,2026),
  requirement(11,M,30,"southeast-asian-independence","Quá trình giành độc lập của các quốc gia Đông Nam Á","Southeast Asian paths to independence",
    ["So sánh quá trình đấu tranh và xây dựng quốc gia độc lập ở Đông Nam Á."],["Compare struggles for independence and nation-building in Southeast Asia."],1800,1975),
  requirement(11,M,40,"vietnam-national-defence-before-1945","Chiến tranh bảo vệ Tổ quốc và giải phóng dân tộc trong lịch sử Việt Nam trước 1945","Vietnamese national defence and liberation before 1945",
    ["Giải thích vai trò, nguyên nhân thành bại và bài học của các cuộc chiến tranh tiêu biểu."],["Explain roles, causes of success or failure, and lessons of representative wars."],-214,1945),
  requirement(11,M,50,"major-vietnamese-reforms","Một số cuộc cải cách lớn trong lịch sử Việt Nam trước năm 1858","Major reforms in Vietnamese history before 1858",
    ["Phân tích bối cảnh, nội dung, kết quả và ý nghĩa của các cuộc cải cách tiêu biểu."],["Analyse context, content, outcomes, and significance of representative reforms."],900,1858),
  requirement(11,M,60,"east-sea-sovereignty","Lịch sử bảo vệ chủ quyền, các quyền và lợi ích hợp pháp của Việt Nam ở Biển Đông","History of Vietnam's sovereignty, rights, and lawful interests in the East Sea",
    ["Giải thích vị trí chiến lược và quá trình xác lập, thực thi chủ quyền biển đảo."],["Explain strategic importance and the historical exercise of maritime sovereignty."]),
  requirement(11,E,110,"traditional-vietnamese-arts","Lịch sử nghệ thuật truyền thống Việt Nam","History of traditional Vietnamese arts",
    ["Nhận diện tiến trình và giá trị của một số loại hình nghệ thuật truyền thống."],["Identify the development and value of selected traditional arts."]),
  requirement(11,E,120,"war-and-peace-twentieth-century","Chiến tranh và hòa bình trong thế kỉ XX","War and peace in the twentieth century",
    ["Phân tích nguyên nhân, hậu quả chiến tranh và các nỗ lực kiến tạo hòa bình."],["Analyse causes and consequences of war and efforts to build peace."],1900,2000),
  requirement(11,E,130,"notable-vietnamese-figures","Danh nhân trong lịch sử Việt Nam","Notable figures in Vietnamese history",
    ["Đánh giá đóng góp của nhân vật bằng nguồn và bối cảnh, tránh thần thoại hóa."],["Assess historical contributions using sources and context, avoiding mythologisation."]),

  requirement(12,M,10,"world-during-after-cold-war","Thế giới trong và sau Chiến tranh lạnh","The world during and after the Cold War",
    ["Phân tích trật tự thế giới, Chiến tranh lạnh và xu thế sau năm 1991."],["Analyse the world order, Cold War, and trends after 1991."],1945,2026),
  requirement(12,M,20,"asean-history","ASEAN: Những chặng đường lịch sử","ASEAN: historical milestones",
    ["Trình bày quá trình hình thành, phát triển và vai trò của ASEAN."],["Outline ASEAN's formation, development, and role."],1967,2026),
  requirement(12,M,30,"vietnam-1945-1975","Cách mạng, kháng chiến và bảo vệ Tổ quốc 1945–1975","Revolution, wars of independence, and national defence, 1945–1975",
    ["Phân tích các chặng đường chính từ Cách mạng tháng Tám đến thống nhất đất nước."],["Analyse major developments from the August Revolution to national reunification."],1945,1975),
  requirement(12,M,40,"vietnam-since-1975","Việt Nam từ năm 1975 đến nay và công cuộc Đổi mới","Vietnam since 1975 and the Đổi mới process",
    ["Phân tích thống nhất, bảo vệ Tổ quốc, Đổi mới và phát triển đến thời điểm cập nhật."],["Analyse reunification, national defence, Đổi mới, and development to the stated as-of date."],1975,2026),
  requirement(12,M,50,"vietnamese-foreign-relations","Lịch sử đối ngoại Việt Nam thời cận – hiện đại","Vietnamese foreign relations in modern history",
    ["Phân tích nguyên tắc, hoạt động và thành tựu đối ngoại tiêu biểu."],["Analyse major principles, activities, and achievements in foreign relations."],1858,2026),
  requirement(12,M,60,"ho-chi-minh","Hồ Chí Minh trong lịch sử Việt Nam","Hồ Chí Minh in Vietnamese history",
    ["Trình bày hành trình hoạt động và đánh giá vai trò lịch sử trên cơ sở nguồn."],["Outline Hồ Chí Minh's activities and assess his historical role from sources."],1890,1969),
  requirement(12,E,110,"belief-and-religion-vietnam","Lịch sử tín ngưỡng và tôn giáo ở Việt Nam","History of belief and religion in Vietnam",
    ["Nhận biết sự đa dạng và vai trò của tín ngưỡng, tôn giáo trong lịch sử."],["Recognise the diversity and historical roles of belief and religion."]),
  requirement(12,E,120,"japan-since-1945","Nhật Bản từ năm 1945 đến nay","Japan since 1945",
    ["Phân tích quá trình phục hồi, phát triển và vị thế của Nhật Bản."],["Analyse Japan's recovery, development, and international position."],1945,2026),
  requirement(12,E,130,"vietnam-international-integration","Quá trình hội nhập quốc tế của Việt Nam","Vietnam's international integration",
    ["Phân tích các giai đoạn, thành tựu, cơ hội và thách thức của hội nhập."],["Analyse stages, achievements, opportunities, and challenges of integration."],1986,2026),
];

export const curriculumMappings:Array<{contentId:string;requirementId:string;asOf:string|null}>=[
  {contentId:"event-trung-sisters",requirementId:"g6-northern-rule-resistance",asOf:null},
  {contentId:"event-bach-dang-938",requirementId:"g6-northern-rule-resistance",asOf:null},
  {contentId:"event-ly-song",requirementId:"g7-vietnam-tenth-thirteenth",asOf:null},
  {contentId:"event-bach-dang-1288",requirementId:"g7-vietnam-tran-ho",asOf:null},
  {contentId:"event-lam-son",requirementId:"g7-lam-son-later-le",asOf:null},
  {contentId:"event-ngoc-hoi",requirementId:"g8-vietnam-sixteenth-eighteenth",asOf:null},
  {contentId:"event-da-nang-1858",requirementId:"g8-vietnam-anti-colonial-1858-1884",asOf:null},
  {contentId:"event-can-vuong",requirementId:"g8-vietnam-1885-1918",asOf:null},
  {contentId:"event-yen-the",requirementId:"g8-vietnam-1885-1918",asOf:null},
  {contentId:"event-august-revolution",requirementId:"g9-vietnam-1918-1945",asOf:null},
  {contentId:"event-dien-bien-phu",requirementId:"g9-vietnam-1945-1991",asOf:null},
  {contentId:"event-ho-chi-minh-campaign",requirementId:"g9-vietnam-1945-1991",asOf:null},
  {contentId:"event-northern-border",requirementId:"g9-vietnam-1945-1991",asOf:null},
  {contentId:"topic-preservation",requirementId:"g10-roles-of-history",asOf:null},
  {contentId:"artifact-bach-dang-stakes",requirementId:"g10-civilisations-on-vietnamese-territory",asOf:null},
  {contentId:"event-bach-dang-1288",requirementId:"g11-vietnam-national-defence-before-1945",asOf:null},
  {contentId:"person-tran-hung-dao",requirementId:"g11-notable-vietnamese-figures",asOf:null},
  {contentId:"event-dien-bien-phu",requirementId:"g12-vietnam-1945-1975",asOf:null},
  {contentId:"event-ho-chi-minh-campaign",requirementId:"g12-vietnam-1945-1975",asOf:null},
  {contentId:"event-southwest-border",requirementId:"g12-vietnam-since-1975",asOf:null},
  {contentId:"event-northern-border",requirementId:"g12-vietnam-since-1975",asOf:null},
  {contentId:"person-ho-chi-minh",requirementId:"g12-ho-chi-minh",asOf:null},
  {contentId:"topic-diplomacy",requirementId:"g12-vietnamese-foreign-relations",asOf:"2026-08-10T00:00:00.000Z"},
];
