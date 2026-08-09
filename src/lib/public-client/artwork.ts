import type { Locale } from "@/lib/content/types";

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
} as const;

export function contentArtwork(id:string,locale:Locale){const artwork=featuredArtwork[id as keyof typeof featuredArtwork];return artwork?{src:artwork.src,alt:artwork.alt[locale]}:null;}
