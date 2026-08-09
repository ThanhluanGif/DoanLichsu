import type { Locale } from "@/lib/content/types";

function portraitAlt(vi:string,en:string){return{vi,en} as const;}

const featuredArtwork={
  "artifact-bach-dang-stakes":{
    src:"/images/featured/bach-dang-stakes.webp",
    alt:{vi:"Minh họa cọc gỗ Bạch Đằng trong lớp trầm tích ven sông",en:"Illustration of a Bạch Đằng wooden stake in river sediment"},
  },
  "artifact-dien-bien-flag":{
    src:"/images/featured/dien-bien-victory-flag.webp",
    alt:{vi:"Minh họa lá cờ Quyết chiến Quyết thắng trong không gian trưng bày",en:"Illustration of the Determined to Fight, Determined to Win flag in a museum display"},
  },
  "event-august-revolution":{
    src:"/images/featured/august-revolution.webp",
    alt:{vi:"Minh họa cuộc tập hợp quần chúng tại Hà Nội trong Cách mạng tháng Tám năm 1945",en:"Illustration of a public gathering in Hanoi during the August Revolution of 1945"},
  },
  "event-bach-dang-1288":{
    src:"/images/featured/bach-dang-1288.webp",
    alt:{vi:"Minh họa thủy triều rút và trận địa cọc trong trận Bạch Đằng năm 1288",en:"Illustration of the falling tide and stake field at the Battle of Bạch Đằng in 1288"},
  },
  "event-bach-dang-938":{
    src:"/images/featured/bach-dang-938.webp",
    alt:{vi:"Minh họa thuyền tiến vào trận địa cọc trên sông Bạch Đằng năm 938",en:"Illustration of boats entering the stake field on the Bạch Đằng River in 938"},
  },
  "event-dien-bien-phu":{
    src:"/images/featured/dien-bien-phu.webp",
    alt:{vi:"Minh họa chiến hào, trận địa và tuyến hậu cần trong thung lũng Điện Biên năm 1954",en:"Illustration of trenches, positions and supply routes in the Điện Biên valley in 1954"},
  },
  "person-trung-sisters":{
    src:"/images/people/trung-sisters-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Hai Bà Trưng giữa hoa văn trống đồng và đồng bằng sông","Interpretive bas-relief illustration of the Trưng Sisters amid bronze-drum motifs and a river plain"),
  },
  "person-ngo-quyen":{
    src:"/images/people/ngo-quyen-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Ngô Quyền bên thành lũy, thuyền và bãi cọc Bạch Đằng","Interpretive bas-relief illustration of Ngô Quyền with a citadel, boats, and the Bạch Đằng stake field"),
  },
  "person-tran-hung-dao":{
    src:"/images/people/tran-hung-dao-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Trần Hưng Đạo trước thủy quân và trận địa Bạch Đằng","Interpretive bas-relief illustration of Trần Hưng Đạo before river forces and the Bạch Đằng defences"),
  },
  "person-le-loi":{
    src:"/images/people/le-loi-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Lê Lợi giữa tre, núi rừng Lam Sơn và cổng thành","Interpretive bas-relief illustration of Lê Lợi amid bamboo, the Lam Sơn highlands, and a citadel gate"),
  },
  "person-quang-trung":{
    src:"/images/people/quang-trung-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Quang Trung với hoa đào, đường hành quân và cổng thành","Interpretive bas-relief illustration of Quang Trung with peach blossom, a marching route, and a citadel gate"),
  },
  "person-truong-dinh":{
    src:"/images/people/truong-dinh-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Trương Định giữa vùng sông nước và làng Gò Công","Interpretive bas-relief illustration of Trương Định amid waterways and a village landscape around Gò Công"),
  },
  "person-phan-dinh-phung":{
    src:"/images/people/phan-dinh-phung-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Phan Đình Phùng giữa núi rừng miền Trung và trạm gác","Interpretive bas-relief illustration of Phan Đình Phùng amid central Vietnamese mountains and watch posts"),
  },
  "person-ho-chi-minh":{
    src:"/images/people/ho-chi-minh-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Hồ Chí Minh bên nhà làm việc, tre và phong cảnh đất nước","Interpretive bas-relief illustration of Hồ Chí Minh beside a modest workspace, bamboo, and a national landscape"),
  },
  "person-vo-nguyen-giap":{
    src:"/images/people/vo-nguyen-giap-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Võ Nguyên Giáp trước địa hình Điện Biên và bản đồ chiến dịch","Interpretive bas-relief illustration of Võ Nguyên Giáp before the Điện Biên terrain and a campaign map"),
  },
  "person-nguyen-thi-dinh":{
    src:"/images/people/nguyen-thi-dinh-relief-v1.webp",
    alt:portraitAlt("Minh họa diễn giải dạng phù điêu về Nguyễn Thị Định giữa dừa, sông nước và đường làng Nam Bộ","Interpretive bas-relief illustration of Nguyễn Thị Định amid coconut groves, waterways, and southern village paths"),
  },
} as const;

export function contentArtwork(id:string,locale:Locale){const artwork=featuredArtwork[id as keyof typeof featuredArtwork];return artwork?{src:artwork.src,alt:artwork.alt[locale]}:null;}
