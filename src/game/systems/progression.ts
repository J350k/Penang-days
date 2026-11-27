import { pickLang } from '../i18n';
import type {
  FoodItem,
  LanguageCode,
  OutfitItem,
  PlayerStats,
  QuestProgressState,
  TaskDisplayItem,
} from '../types';

export const MOTORCYCLE_PRICE_RM = 320;
export const CAR_PRICE_RM = 680;
export const MOTORCYCLE_SHOP_POS = { x: 64.0, z: 34.0 };
export const GAS_STATION_POS = { x: 54.0, z: -12.0 };

export const FOOD_CATALOG: FoodItem[] = [
  {
    id: 'char-kway-teow',
    nameZh: '炭火炒粿条',
    nameEn: 'Char Kway Teow',
    nameMs: 'Char Kway Teow Arang',
    priceRM: 9,
    hpRestore: 28,
    staminaRestore: 45,
    descZh: '槟城灵魂美食！炭火猛炒扁粿条配鲜虾、腊肠与豆芽，镬气十足。',
    descEn: 'Wok-charred flat rice noodles with prawns, egg, chives, and smoky Penang wok hei.',
    descMs: 'Kuey teow goreng arang berapi dengan udang segar, taugeh dan telur.',
    stallId: 'stall-ckt',
  },
  {
    id: 'cendol',
    nameZh: '槟城煎蕊',
    nameEn: 'Penang Cendol',
    nameMs: 'Cendol Pulau Pinang',
    priceRM: 6,
    hpRestore: 18,
    staminaRestore: 60,
    descZh: '椰浆、马六甲椰糖与斑斓绿粉条堆成冰山，酷暑散步的清凉救星。',
    descEn: 'Shaved ice drenched in rich coconut milk, gula melaka, and pandan jelly noodles.',
    descMs: 'Ais kisar dengan santan pekat, gula melaka dan cendol pandan wangi.',
    stallId: 'stall-cendol',
  },
  {
    id: 'peanut-soup',
    nameZh: '古早花生汤',
    nameEn: 'Sweet Peanut Soup',
    nameMs: 'Sup Kacang Manis',
    priceRM: 5,
    hpRestore: 22,
    staminaRestore: 38,
    descZh: '慢火熬至绵密入口即化的花生甜汤，配上一根香脆油条暖胃又舒心。',
    descEn: 'Silky slow-simmered roasted peanut dessert soup served warm with crispy youtiao.',
    descMs: 'Sup kacang tanah rebus perlahan yang lembut bersama cakoi rangup.',
    stallId: 'stall-peanut',
  },
  {
    id: 'white-curry-mee',
    nameZh: '槟城白咖喱面',
    nameEn: 'White Curry Mee',
    nameMs: 'Mi Kari Putih',
    priceRM: 10,
    hpRestore: 35,
    staminaRestore: 50,
    descZh: '雪白浓郁的椰香汤底，拌入秘制参峇辣酱与鲜蛤，香辣层次分明。',
    descEn: 'Creamy coconut broth noodles topped with cuttlefish, cockles, and fiery sambal paste.',
    descMs: 'Mi kuah santan putih berkrim dengan kerang, sotong dan sambal pedas.',
    stallId: 'stall-curry',
  },
  {
    id: 'kuih-nyonya',
    nameZh: '娘惹九层糕',
    nameEn: 'Nyonya Kuih Lapis',
    nameMs: 'Kuih Lapis Nyonya',
    priceRM: 6,
    hpRestore: 20,
    staminaRestore: 42,
    descZh: '斑斓与椰浆逐层蒸制的彩色娘惹糕点，软糯清甜，适合当茶点。',
    descEn: 'Steamed multi-layered pandan and coconut Nyonya cake with delicate springy texture.',
    descMs: 'Kuih kukus berlapis pandan dan santan yang lembut dan manis.',
    stallId: 'stall-cendol',
  },
  {
    id: 'teh-tarik',
    nameZh: '老街拉茶',
    nameEn: 'Kopitiam Teh Tarik',
    nameMs: 'Teh Tarik Kopitiam',
    priceRM: 4,
    hpRestore: 12,
    staminaRestore: 55,
    descZh: '茶香与炼乳在高空反复拉出绵密奶泡，是乔治市早晨的开始。',
    descEn: 'Frothed Malaysian pulled milk tea brewed strong at the corner kopitiam.',
    descMs: 'Teh susu tarik berbuih pekat yang menjadi kegemaran pagi George Town.',
    stallId: 'stall-curry',
  },
  {
    id: 'asam-laksa',
    nameZh: '亚参叻沙',
    nameEn: 'Penang Asam Laksa',
    nameMs: 'Asam Laksa Pulau Pinang',
    priceRM: 9,
    hpRestore: 30,
    staminaRestore: 52,
    descZh: '酸辣鲜香的鲭鱼罗望子汤头，搭配粗米粉、黄瓜丝、薄荷与虾膏。',
    descEn: 'Tangy tamarind mackerel broth with thick rice noodles, mint, pineapple, and prawn paste.',
    descMs: 'Kuah ikan asam jawa masam pedas bersama laksa, nanas dan daun pudina.',
    stallId: 'stall-gurney',
  },
  {
    id: 'hokkien-mee',
    nameZh: '槟城福建虾面',
    nameEn: 'Penang Hokkien Mee',
    nameMs: 'Mi Udang Hokkien',
    priceRM: 10,
    hpRestore: 34,
    staminaRestore: 48,
    descZh: '用虾壳与猪骨慢熬数小时的红亮高汤，鲜甜浓郁得令人回味无穷。',
    descEn: 'Deep prawn-shell and spice broth served with yellow noodles, shrimp, and crispy shallots.',
    descMs: 'Sup udang pekat berempah dengan mi kuning, udang dan bawang goreng.',
    stallId: 'stall-mainland',
  },
  {
    id: 'nasi-kandar',
    nameZh: '槟城扁担饭',
    nameEn: 'Penang Nasi Kandar',
    nameMs: 'Nasi Kandar Pulau Pinang',
    priceRM: 13,
    hpRestore: 45,
    staminaRestore: 60,
    descZh: '香喷喷蒸米饭淋上多种浓香咖喱汁，配炸鸡与秋葵，饱足感满分！',
    descEn: 'Steamed rice flooded with a rich blend of mixed curries, crispy chicken, and okra.',
    descMs: 'Nasi putih digaul kuah kari campur banjir bersama ayam goreng berempah.',
    stallId: 'stall-mainland',
  },
  {
    id: 'rojak',
    nameZh: '槟城水果罗惹',
    nameEn: 'Penang Rojak',
    nameMs: 'Rojak Buah Pulau Pinang',
    priceRM: 7,
    hpRestore: 20,
    staminaRestore: 44,
    descZh: '凤梨、莲雾、芒果与油条拌入浓稠黑虾膏辣酱，撒满烤花生碎！',
    descEn: 'Crisp tropical fruits and fried dough tossed in sweet-savory prawn paste and crushed peanuts.',
    descMs: 'Buah-buahan segar dan cakoi digaul kuah rojak pekat serta kacang tumbuk.',
    stallId: 'stall-gurney',
  },
  {
    id: 'popiah',
    nameZh: '薄饼卷 Popiah',
    nameEn: 'Penang Fresh Popiah',
    nameMs: 'Popiah Basah Pulau Pinang',
    priceRM: 6,
    hpRestore: 22,
    staminaRestore: 40,
    descZh: '手工薄润饼皮裹入沙葛丝、花生碎与蟹肉鲜汤汁，一口咬下爽脆清甜。',
    descEn: 'Thin crepe roll stuffed with braised turnip, crispy bits, egg, and sweet chili glaze.',
    descMs: 'Kulit popiah lembut berinti sengkuang manis, telur dan sos istimewa.',
    stallId: 'stall-gurney',
  },
  {
    id: 'wan-tan-mee',
    nameZh: '黑酱云吞面',
    nameEn: 'Dark Sauce Wan Tan Mee',
    nameMs: 'Mi Wantan Kicap Hitam',
    priceRM: 8,
    hpRestore: 28,
    staminaRestore: 46,
    descZh: '弹牙细面拌黑酱油与猪油香，搭配蜜汁叉烧和皮薄馅鲜的云吞。',
    descEn: 'Springy egg noodles tossed in glossy dark soy sauce with char siu and plump dumplings.',
    descMs: 'Mi telur kenyal bersalut kicap pekat bersama wantan dan hirisan ayam panggang.',
    stallId: 'stall-mainland',
  },
];

export const OUTFIT_CATALOG: OutfitItem[] = [
  {
    id: 'linen-teal',
    nameZh: '青瓷亚麻套',
    nameEn: 'Heritage Teal Linen',
    nameMs: 'Linen Hijau Warisan',
    priceRM: 0,
    shirtHex: 0xf4ece1,
    vestHex: 0x6baa8e,
    pantsHex: 0x3b4d5e,
  },
  {
    id: 'nyonya-coral',
    nameZh: '娘惹珊瑚衫',
    nameEn: 'Nyonya Coral Shirt',
    nameMs: 'Baju Koral Nyonya',
    priceRM: 65,
    shirtHex: 0xfff5ec,
    vestHex: 0xe8a598,
    pantsHex: 0x5a3e36,
  },
  {
    id: 'batik-gold',
    nameZh: '峇迪金棕装',
    nameEn: 'Batik Gold Polo',
    nameMs: 'Polo Batik Emas',
    priceRM: 85,
    shirtHex: 0xfaf0d7,
    vestHex: 0xd9a03b,
    pantsHex: 0x2f4550,
  },
  {
    id: 'kopitiam-cream',
    nameZh: '老街海风套',
    nameEn: 'Esplanade Breeze',
    nameMs: 'Gaya Bayu Esplanade',
    priceRM: 75,
    shirtHex: 0xffffff,
    vestHex: 0xbfd8e8,
    pantsHex: 0x456990,
  },
];

export interface QuestDefinition {
  id: string;
  isMain: boolean;
  titleZh: string;
  titleEn: string;
  titleMs: string;
  descZh: string;
  descEn: string;
  descMs: string;
  rewardRM: number;
  rewardXP: number;
  defaultTarget: { x: number; z: number };
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'main-1-ahkow',
    isMain: true,
    titleZh: '1. 走出家门，认识邻居 Ah Kow',
    titleEn: '1. Step Outside & Meet Uncle Ah Kow',
    titleMs: '1. Kenali Jiran Uncle Ah Kow',
    descZh: '走出五脚基沿打铜仔街向东走，去炒粿条摊位和 Ah Kow 叔叔打个招呼。',
    descEn: 'Walk out of your shophouse onto Armenian St and greet Uncle Ah Kow at his stall.',
    descMs: 'Keluar ke Lebuh Armenian dan sapa Uncle Ah Kow di gerai beliau.',
    rewardRM: 40,
    rewardXP: 50,
    defaultTarget: { x: 12, z: 3.5 },
  },
  {
    id: 'main-2-ingredients',
    isMain: true,
    titleZh: '2. 帮 Ah Kow 买食材',
    titleEn: '2. Buy Fresh Ingredients for Ah Kow',
    titleMs: '2. Beli Bahan Segar untuk Ah Kow',
    descZh: '前往椰脚街口的 Auntie Lim 咖啡店采购鲜虾与韭菜，再带回给 Ah Kow。',
    descEn: 'Head to Auntie Lim’s Kopitiam for fresh prawns & chives, then return to Ah Kow.',
    descMs: 'Pergi ke Kopitiam Auntie Lim untuk ambil udang & kucai, kemudian pulang.',
    rewardRM: 65,
    rewardXP: 75,
    defaultTarget: { x: 21, z: -6.5 },
  },
  {
    id: 'main-3-kakros',
    isMain: true,
    titleZh: '3. 给 Kak Ros 送外卖',
    titleEn: '3. Deliver Lunch to Kak Ros',
    titleMs: '3. Hantar Makanan kepada Kak Ros',
    descZh: '把 Ah Kow 炒好的热腾腾粿条送到南巷转角的 Kak Ros 煎蕊摊。',
    descEn: 'Bring Ah Kow’s hot Char Kway Teow parcel to Kak Ros at her Cendol stall.',
    descMs: 'Bawa bungkusan Char Kway Teow ke gerai Cendol Kak Ros.',
    rewardRM: 75,
    rewardXP: 90,
    defaultTarget: { x: 22, z: 16.5 },
  },
  {
    id: 'main-4-mei',
    isMain: true,
    titleZh: '4. 找到壁画街的 Mei',
    titleEn: '4. Meet Mural Artist Mei',
    titleMs: '4. Temui Pelukis Mural Mei',
    descZh: '前往西侧的壁画街（Lorong Cinta），找正在创作彩色壁画的画家 Mei 聊聊。',
    descEn: 'Visit Mural Lane on the west side and speak with mural artist Mei.',
    descMs: 'Lawati Lorong Mural di barat dan berborak dengan pelukis Mei.',
    rewardRM: 80,
    rewardXP: 100,
    defaultTarget: { x: -25, z: -12 },
  },
  {
    id: 'main-5-scooter',
    isMain: true,
    titleZh: '5. 买第一辆摩托车',
    titleEn: '5. Buy Your First Scooter',
    titleMs: '5. Beli Skuter Pertama Anda',
    descZh: '前往东侧光大商圈的明珠车行，购买属于你的第一辆代步摩托（RM 320）。',
    descEn: 'Visit Pearl Motors near Komtar Boulevard to purchase your first scooter (RM 320).',
    descMs: 'Kunjungi Pearl Motors dekat Komtar untuk membeli skuter pertama (RM 320).',
    rewardRM: 100,
    rewardXP: 140,
    defaultTarget: { ...MOTORCYCLE_SHOP_POS },
  },
  {
    id: 'main-6-passport',
    isMain: true,
    titleZh: '6. 完成美食护照 5 道菜',
    titleEn: '6. Complete 5 Dishes in Food Passport',
    titleMs: '6. Lengkapkan 5 Hidangan Pasport',
    descZh: '在乔治市各处摊位品尝至少 5 种不同的槟城美食，填满你的美食护照！',
    descEn: 'Taste 5 different Penang delicacies across town to fill your Food Passport.',
    descMs: 'Cuba sekurang-kurangnya 5 hidangan Pulau Pinang untuk Pasport Makanan anda!',
    rewardRM: 180,
    rewardXP: 220,
    defaultTarget: { x: -12, z: 15.8 },
  },
  {
    id: 'side-1-tiger',
    isMain: false,
    titleZh: '支线：找回猫咪 Tiger',
    titleEn: 'Side: Find Stray Cat Tiger',
    titleMs: 'Sampingan: Cari Kucing Tiger',
    descZh: '先和导游 Siew Lan 聊聊，再去小公园或海边码头寻找走丢的橘猫 Tiger。',
    descEn: 'Talk to Siew Lan or search Heritage Park & Esplanade Pier for Tiger the ginger cat.',
    descMs: 'Berbual dengan Siew Lan dan cari kucing oren Tiger di Taman Warisan.',
    rewardRM: 60,
    rewardXP: 80,
    defaultTarget: { x: -58, z: 27 },
  },
  {
    id: 'side-2-delivery',
    isMain: false,
    titleZh: '支线：Raj 限时外卖配送',
    titleEn: 'Side: Raj’s Timed Food Delivery',
    titleMs: 'Sampingan: Penghantaran Pantas Raj',
    descZh: '找外卖员 Raj 接单，在倒计时结束前把热食送到乔治市指定地点！',
    descEn: 'Accept a delivery order from Raj and drop it off before the timer runs out.',
    descMs: 'Terima pesanan dari Raj dan hantar sebelum masa tamat!',
    rewardRM: 85,
    rewardXP: 95,
    defaultTarget: { x: 4, z: 42 },
  },
  {
    id: 'side-3-photo',
    isMain: false,
    titleZh: '支线：槟城壁画与码头拍照打卡',
    titleEn: 'Side: Heritage Photo Check-In',
    titleMs: 'Sampingan: Foto Warisan',
    descZh: '前往壁画街或海边码头拍照点按下互动键打卡，再向 Siew Lan 分享照片。',
    descEn: 'Interact at Mural Lane or Esplanade Pier photo spot, then check in with Siew Lan.',
    descMs: 'Ambil gambar di Lorong Mural atau Jeti, kemudian tunjuk kepada Siew Lan.',
    rewardRM: 55,
    rewardXP: 70,
    defaultTarget: { x: -28, z: -20 },
  },
  {
    id: 'side-4-trishaw',
    isMain: false,
    titleZh: '支线：帮 Pak Samad 三轮车送客',
    titleEn: 'Side: Help Pak Samad Guide Tourists',
    titleMs: 'Sampingan: Beca Pak Samad',
    descZh: '与三轮车夫 Pak Samad 对话，帮他前往海边码头接引观光客并回报。',
    descEn: 'Speak with trishaw rider Pak Samad and scout Esplanade Pier for his passengers.',
    descMs: 'Berbual dengan Pak Samad dan periksa pelancong di Jeti Esplanade.',
    rewardRM: 70,
    rewardXP: 85,
    defaultTarget: { x: 10, z: 76 },
  },
];

// Part F: 22 Achievements
export interface AchievementDef {
  id: string;
  titleZh: string;
  titleEn: string;
  titleMs: string;
  descZh: string;
  descEn: string;
  descMs: string;
  rewardRM: number;
  rewardXP: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  { id: 'ach-first-quest', titleZh: '初来乍到', titleEn: 'Fresh Off the Boat', titleMs: 'Pendatang Baru', descZh: '完成第 1 个任务', descEn: 'Complete your first quest', descMs: 'Selesaikan misi pertama', rewardRM: 25, rewardXP: 30 },
  { id: 'ach-main-done', titleZh: '乔治市之友', titleEn: 'Pride of George Town', titleMs: 'Sahabat George Town', descZh: '完成全部 6 个主线任务', descEn: 'Complete all 6 main quests', descMs: 'Selesaikan 6 misi utama', rewardRM: 150, rewardXP: 180 },
  { id: 'ach-side-all', titleZh: '热心街坊', titleEn: 'Helpful Neighbor', titleMs: 'Jiran Prihatin', descZh: '完成全部 4 个支线任务', descEn: 'Complete all 4 side quests', descMs: 'Selesaikan 4 misi sampingan', rewardRM: 100, rewardXP: 120 },
  { id: 'ach-food-1', titleZh: '开胃第一口', titleEn: 'First Bite', titleMs: 'Suapan Pertama', descZh: '品尝第 1 道槟城美食', descEn: 'Taste 1 Penang dish', descMs: 'Rasa 1 hidangan Pulau Pinang', rewardRM: 15, rewardXP: 20 },
  { id: 'ach-food-5', titleZh: '老饕入门', titleEn: 'Street Food Explorer', titleMs: 'Peneroka Makanan', descZh: '收集 5 种美食护照图鉴', descEn: 'Taste 5 unique dishes', descMs: 'Rasa 5 hidangan berbeza', rewardRM: 45, rewardXP: 60 },
  { id: 'ach-food-12', titleZh: '槟城美食大满贯', titleEn: 'Penang Gourmet Master', titleMs: 'Master Kulinari Penang', descZh: '品尝全部 12 道槟城美食', descEn: 'Taste all 12 Penang dishes', descMs: 'Rasa kesemua 12 hidangan', rewardRM: 200, rewardXP: 260 },
  { id: 'ach-scooter', titleZh: '风驰小摩托', titleEn: 'Kapchai Cruiser', titleMs: 'Penunggang Kapchai', descZh: '购入第一辆摩托车', descEn: 'Purchase a scooter', descMs: 'Beli skuter pertama', rewardRM: 30, rewardXP: 40 },
  { id: 'ach-car', titleZh: '四轮新生活', titleEn: 'City Driver', titleMs: 'Pemandu Bandar', descZh: '在明珠车行购买轿车', descEn: 'Buy a sedan car at Pearl Motors', descMs: 'Beli kereta di Pearl Motors', rewardRM: 80, rewardXP: 100 },
  { id: 'ach-trishaw', titleZh: '古早三轮车夫', titleEn: 'Heritage Pedaler', titleMs: 'Pengayuh Beca', descZh: '体验驾驶槟城三轮车', descEn: 'Ride the George Town trishaw', descMs: 'Cuba kayuh beca warisan', rewardRM: 30, rewardXP: 40 },
  { id: 'ach-ferry', titleZh: '跨海渡轮客', titleEn: 'Cross-Channel Voyager', titleMs: 'Pelayar Feri', descZh: '乘渡轮往返岛屿与北海对岸', descEn: 'Take the Pearl Ferry across channel', descMs: 'Naiki feri ke seberang', rewardRM: 40, rewardXP: 50 },
  { id: 'ach-hill', titleZh: '升旗山登顶', titleEn: 'Penang Hill Summiter', titleMs: 'Puncak Bukit Bendera', descZh: '乘缆车登上 升旗山观景台', descEn: 'Reach Penang Hill Summit', descMs: 'Tiba di puncak Bukit Bendera', rewardRM: 50, rewardXP: 70 },
  { id: 'ach-temple', titleZh: '禅寺祈福', titleEn: 'Temple Blessing', titleMs: 'Doa Kuil Kek Lok', descZh: '在极乐禅寺祈福获得好运', descEn: 'Receive a blessing at Kek Lok Temple', descMs: 'Terima berkat di Kuil Kek Lok', rewardRM: 35, rewardXP: 45 },
  { id: 'ach-landmarks-5', titleZh: '漫步探索者', titleEn: 'Island Sightseer', titleMs: 'Pelancong Pulau', descZh: '发现 5 个槟城地标', descEn: 'Discover 5 Penang landmarks', descMs: 'Teroka 5 mercu tanda', rewardRM: 50, rewardXP: 65 },
  { id: 'ach-landmarks-all', titleZh: '槟城通地图王', titleEn: 'All-Island Navigator', titleMs: 'Pengembara Lengkap', descZh: '发现全部 9 个地标区域', descEn: 'Discover all 9 landmark regions', descMs: 'Teroka semua 9 kawasan', rewardRM: 150, rewardXP: 200 },
  { id: 'ach-photo-1', titleZh: '快门初响', titleEn: 'First Snapshot', titleMs: 'Foto Pertama', descZh: '使用拍照模式拍下 1 张照片', descEn: 'Take 1 photo in Photo Mode', descMs: 'Ambil 1 foto dalam Mod Foto', rewardRM: 25, rewardXP: 30 },
  { id: 'ach-photo-5', titleZh: '老城摄影师', titleEn: 'Heritage Photographer', titleMs: 'Jurugambar Warisan', descZh: '累计拍摄 5 张风景照片', descEn: 'Capture 5 photos', descMs: 'Ambil 5 keping foto', rewardRM: 60, rewardXP: 80 },
  { id: 'ach-decor-3', titleZh: '温馨小家', titleEn: 'Cozy Shophouse', titleMs: 'Rumah Selesa', descZh: '在店屋摆放至少 3 件家具', descEn: 'Place 3 furniture items at home', descMs: 'Letak 3 perabot di rumah', rewardRM: 45, rewardXP: 60 },
  { id: 'ach-decor-score', titleZh: '娘惹设计大师', titleEn: 'Peranakan Designer', titleMs: 'Pereka Hiasan', descZh: '家庭装潢评分达到 100+', descEn: 'Reach Home Decor Score 100+', descMs: 'Skor Hiasan Rumah 100+', rewardRM: 120, rewardXP: 140 },
  { id: 'ach-fashion', titleZh: '百变街头达人', titleEn: 'George Town Stylist', titleMs: 'Penggaya Jalanan', descZh: '拥有至少 2 套以上服饰', descEn: 'Own 2+ outfits', descMs: 'Miliki 2+ pakaian', rewardRM: 30, rewardXP: 40 },
  { id: 'ach-minigame-ckt', titleZh: '镬气炒手', titleEn: 'Wok Master', titleMs: 'Jaguh Kuali', descZh: '在炒粿条节奏小游戏中获胜', descEn: 'Win the Wok Rhythm minigame', descMs: 'Menang permainan mini Kuali', rewardRM: 50, rewardXP: 60 },
  { id: 'ach-minigame-jetski', titleZh: '乘风破浪', titleEn: 'Ferringhi Wave Rider', titleMs: 'Penunggang Ombak', descZh: '完成峇都丁宜摩托艇竞速', descEn: 'Win the Jet Ski Wave Slalom', descMs: 'Menang perlumbaan Jet Ski', rewardRM: 60, rewardXP: 75 },
  { id: 'ach-rich', titleZh: '小富翁储蓄罐', titleEn: 'Penang Saver (RM 1,000)', titleMs: 'Jutawan Kecil (RM 1,000)', descZh: '持有现金达到 RM 1,000', descEn: 'Hold RM 1,000+ cash', descMs: 'Simpan RM 1,000 ke atas', rewardRM: 50, rewardXP: 100 },
];

export interface DailyChallengeDef {
  id: string;
  titleZh: string;
  titleEn: string;
  titleMs: string;
  target: number;
  rewardRM: number;
  rewardXP: number;
  metric: 'eat' | 'chat' | 'photo' | 'minigame' | 'bus';
}

const DAILY_CHALLENGE_POOL: DailyChallengeDef[] = [
  { id: 'dc-eat-2', metric: 'eat', target: 2, titleZh: '今日尝鲜：品尝 2 次街头美食', titleEn: 'Daily Bite: Eat 2 street dishes', titleMs: 'Harian: Makan 2 hidangan', rewardRM: 40, rewardXP: 45 },
  { id: 'dc-chat-2', metric: 'chat', target: 2, titleZh: '邻里寒暄：与 2 位居民交谈', titleEn: 'Friendly Chat: Talk to 2 locals', titleMs: 'Harian: Sapa 2 jiran', rewardRM: 35, rewardXP: 40 },
  { id: 'dc-photo-1', metric: 'photo', target: 1, titleZh: '今日留念：拍摄 1 张老城照片', titleEn: 'Daily Snap: Take 1 photo', titleMs: 'Harian: Ambil 1 foto', rewardRM: 40, rewardXP: 45 },
  { id: 'dc-minigame-1', metric: 'minigame', target: 1, titleZh: '轻松挑战：游玩并赢下 1 次小游戏', titleEn: 'Daily Fun: Win 1 minigame', titleMs: 'Harian: Menang 1 permainan mini', rewardRM: 55, rewardXP: 60 },
  { id: 'dc-bus-1', metric: 'bus', target: 1, titleZh: '绿色出行：搭乘 1 次槟城巴士或渡轮', titleEn: 'Daily Transit: Ride bus or ferry', titleMs: 'Harian: Naiki bas atau feri', rewardRM: 35, rewardXP: 40 },
];

export function getDailyChallenges(dayCount: number): DailyChallengeDef[] {
  const start = ((dayCount - 1) * 2) % DAILY_CHALLENGE_POOL.length;
  return [
    DAILY_CHALLENGE_POOL[start % DAILY_CHALLENGE_POOL.length],
    DAILY_CHALLENGE_POOL[(start + 1) % DAILY_CHALLENGE_POOL.length],
    DAILY_CHALLENGE_POOL[(start + 2) % DAILY_CHALLENGE_POOL.length],
  ];
}

export interface AchievementEvalContext {
  completedQuestCount: number;
  completedIds: string[];
  foodPassportCount: number;
  motorcycleOwned: boolean;
  carOwned: boolean;
  trishawRidden: boolean;
  ferryRidden: boolean;
  hillVisited: boolean;
  templeBlessed: boolean;
  discoveredLandmarksCount: number;
  photosTakenCount: number;
  placedFurnitureCount: number;
  decorScore: number;
  ownedOutfitsCount: number;
  minigamesWon: Record<string, number>;
  moneyRM: number;
  unlockedIds: string[];
}

export function evaluateAchievements(ctx: AchievementEvalContext): AchievementDef[] {
  const checks: Record<string, boolean> = {
    'ach-first-quest': ctx.completedQuestCount >= 1,
    'ach-main-done':
      ['main-1-ahkow', 'main-2-ingredients', 'main-3-kakros', 'main-4-mei', 'main-5-scooter', 'main-6-passport'].every(
        (id) => ctx.completedIds.includes(id)
      ),
    'ach-side-all':
      ['side-1-tiger', 'side-2-delivery', 'side-3-photo', 'side-4-trishaw'].every((id) =>
        ctx.completedIds.includes(id)
      ),
    'ach-food-1': ctx.foodPassportCount >= 1,
    'ach-food-5': ctx.foodPassportCount >= 5,
    'ach-food-12': ctx.foodPassportCount >= 12,
    'ach-scooter': ctx.motorcycleOwned,
    'ach-car': ctx.carOwned,
    'ach-trishaw': ctx.trishawRidden,
    'ach-ferry': ctx.ferryRidden,
    'ach-hill': ctx.hillVisited,
    'ach-temple': ctx.templeBlessed,
    'ach-landmarks-5': ctx.discoveredLandmarksCount >= 5,
    'ach-landmarks-all': ctx.discoveredLandmarksCount >= 9,
    'ach-photo-1': ctx.photosTakenCount >= 1,
    'ach-photo-5': ctx.photosTakenCount >= 5,
    'ach-decor-3': ctx.placedFurnitureCount >= 3,
    'ach-decor-score': ctx.decorScore >= 100,
    'ach-fashion': ctx.ownedOutfitsCount >= 2,
    'ach-minigame-ckt': (ctx.minigamesWon['ckt-rhythm'] ?? 0) >= 1,
    'ach-minigame-jetski': (ctx.minigamesWon['jetski-slalom'] ?? 0) >= 1,
    'ach-rich': ctx.moneyRM >= 1000,
  };

  return ACHIEVEMENT_CATALOG.filter(
    (ach) => !ctx.unlockedIds.includes(ach.id) && checks[ach.id]
  );
}

export function updatePlayerStamina(
  stats: PlayerStats,
  isRunning: boolean,
  isMoving: boolean,
  dt: number
): PlayerStats {
  let stamina = stats.stamina;
  if (isRunning && isMoving) {
    stamina = Math.max(0, stamina - 20 * dt);
  } else {
    const regenRate = isMoving ? 8 : 18;
    stamina = Math.min(stats.maxStamina, stamina + regenRate * dt);
  }
  return { ...stats, stamina };
}

export function awardRewards(
  stats: PlayerStats,
  moneyRM: number,
  xp: number
): { stats: PlayerStats; leveledUp: boolean } {
  let nextLevel = stats.level;
  let nextXp = stats.xp + xp;
  let nextXpToNext = stats.xpToNext;
  let nextMaxStamina = stats.maxStamina;
  let nextMaxHp = stats.maxHp;
  let leveledUp = false;

  while (nextXp >= nextXpToNext) {
    nextXp -= nextXpToNext;
    nextLevel += 1;
    nextXpToNext = Math.round(nextXpToNext * 1.35);
    nextMaxStamina += 15;
    nextMaxHp += 10;
    leveledUp = true;
  }

  return {
    leveledUp,
    stats: {
      ...stats,
      level: nextLevel,
      xp: nextXp,
      xpToNext: nextXpToNext,
      maxStamina: nextMaxStamina,
      maxHp: nextMaxHp,
      hp: leveledUp ? nextMaxHp : stats.hp,
      stamina: leveledUp ? nextMaxStamina : stats.stamina,
      moneyRM: stats.moneyRM + moneyRM,
    },
  };
}

export function buildTaskDisplayList(
  progress: QuestProgressState,
  playerX: number,
  playerZ: number,
  lang: LanguageCode
): TaskDisplayItem[] {
  return QUEST_DEFINITIONS.map((q) => {
    const completed = progress.completedIds.includes(q.id);
    const accepted = q.isMain
      ? q.id === 'main-1-ahkow' || progress.acceptedIds.includes(q.id) || completed
      : progress.acceptedIds.includes(q.id) || completed;

    let tx = q.defaultTarget.x;
    let tz = q.defaultTarget.z;
    if (q.id === 'main-2-ingredients' && progress.flags['bought_ingredients']) {
      tx = 12;
      tz = 3.5;
    } else if (q.id === 'side-2-delivery' && progress.timedDelivery?.active) {
      tx = progress.timedDelivery.targetX;
      tz = progress.timedDelivery.targetZ;
    }

    const dist = Math.round(Math.hypot(tx - playerX, tz - playerZ));
    return {
      id: q.id,
      isMain: q.isMain,
      title: pickLang(lang, q.titleZh, q.titleEn, q.titleMs),
      description: pickLang(lang, q.descZh, q.descEn, q.descMs),
      completed,
      accepted,
      distanceMeters: completed ? null : dist,
      targetX: tx,
      targetZ: tz,
    };
  });
}
