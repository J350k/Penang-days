import { pickLang } from '../i18n';
import type { DialogueNode, LanguageCode, NpcDefinition, QuestProgressState } from '../types';

export const NAMED_NPCS: NpcDefinition[] = [
  {
    id: 'ah-kow',
    nameZh: 'Ah Kow 叔叔',
    nameEn: 'Uncle Ah Kow',
    nameMs: 'Uncle Ah Kow',
    roleZh: '炒粿条摊主',
    roleEn: 'Char Kway Teow Hawker',
    roleMs: 'Penjaja Char Kway Teow',
    shirtHex: 0xf4ece1,
    pantsHex: 0x3b4d5e,
    hairHex: 0x9c9c9c,
    hatHex: 0xc8553d,
    schedule: [
      { startHour: 6, endHour: 9, x: -4, z: -38, yaw: 0, activityZh: '在巴刹挑鲜虾', activityEn: 'At Morning Market', activityMs: 'Di Pasar Pagi' },
      { startHour: 9, endHour: 20, x: 12.0, z: 4.5, yaw: 0, activityZh: '在炒粿条摊位忙碌', activityEn: 'Cooking at Stall', activityMs: 'Memasak di Gerai' },
      { startHour: 20, endHour: 6, x: 9.2, z: 1.2, yaw: 0, activityZh: '收摊在家休息', activityEn: 'Resting at Home', activityMs: 'Berehat di Rumah' },
    ],
  },
  {
    id: 'kak-ros',
    nameZh: 'Kak Ros',
    nameEn: 'Kak Ros',
    nameMs: 'Kak Ros',
    roleZh: '娘惹糕与煎蕊摊主',
    roleEn: 'Kuih & Cendol Seller',
    roleMs: 'Penjual Kuih & Cendol',
    shirtHex: 0x70a996,
    pantsHex: 0x453831,
    hairHex: 0x2b221e,
    hatHex: 0xf3d98b,
    schedule: [
      { startHour: 6, endHour: 9.5, x: 8, z: -38, yaw: 0, activityZh: '在巴刹买椰浆', activityEn: 'Buying Coconut Milk', activityMs: 'Membeli Santan' },
      { startHour: 9.5, endHour: 19.5, x: 22.0, z: 15.0, yaw: Math.PI, activityZh: '卖煎蕊与娘惹糕', activityEn: 'Selling Kuih & Cendol', activityMs: 'Menjual Kuih & Cendol' },
      { startHour: 19.5, endHour: 6, x: 17.0, z: 16.5, yaw: Math.PI, activityZh: '在南巷歇息', activityEn: 'Resting Nearby', activityMs: 'Berehat Berdekatan' },
    ],
  },
  {
    id: 'pak-samad',
    nameZh: 'Pak Samad',
    nameEn: 'Pak Samad',
    nameMs: 'Pak Samad',
    roleZh: '老城三轮车夫',
    roleEn: 'Trishaw Rider',
    roleMs: 'Pengayuh Beca Warisan',
    shirtHex: 0x5c9ead,
    pantsHex: 0x2f4550,
    hairHex: 0x7e7a74,
    hatHex: 0xd9c5a0,
    schedule: [
      { startHour: 6, endHour: 10, x: -12, z: -37, yaw: 0, activityZh: '在早市等客人', activityEn: 'Waiting at Market', activityMs: 'Menunggu di Pasar' },
      { startHour: 10, endHour: 19, x: -5.5, z: 13.8, yaw: 0, activityZh: '在打铜仔街载客', activityEn: 'Waiting on Armenian St', activityMs: 'Di Lebuh Armenian' },
      { startHour: 19, endHour: 6, x: 4.5, z: 68.5, yaw: 0, activityZh: '在海边吹海风', activityEn: 'Breezing by the Pier', activityMs: 'Mengambil Angin di Jeti' },
    ],
  },
  {
    id: 'mei',
    nameZh: 'Mei',
    nameEn: 'Mei',
    nameMs: 'Mei',
    roleZh: '壁画街艺术家',
    roleEn: 'Mural Artist',
    roleMs: 'Pelukis Mural',
    shirtHex: 0xe68c67,
    pantsHex: 0x3b4d5e,
    hairHex: 0x1e1917,
    hatHex: 0x2f5f4e,
    schedule: [
      { startHour: 6, endHour: 9, x: -18, z: -38, yaw: 0, activityZh: '逛早市找灵感', activityEn: 'At Market St', activityMs: 'Di Jalan Pasar' },
      { startHour: 9, endHour: 18.5, x: -26.5, z: -12.5, yaw: -Math.PI / 2, activityZh: '在壁画街画墙绘', activityEn: 'Painting at Mural Lane', activityMs: 'Melukis di Lorong Mural' },
      { startHour: 18.5, endHour: 6, x: -18, z: 3.5, yaw: 0, activityZh: '散步回家', activityEn: 'Evening Stroll', activityMs: 'Bersiar Petang' },
    ],
  },
  {
    id: 'auntie-lim',
    nameZh: 'Auntie Lim',
    nameEn: 'Auntie Lim',
    nameMs: 'Auntie Lim',
    roleZh: '老街咖啡店老板娘',
    roleEn: 'Kopitiam Owner',
    roleMs: 'Pemilik Kopitiam',
    shirtHex: 0xd9735b,
    pantsHex: 0x2b2118,
    hairHex: 0x5c534c,
    schedule: [
      { startHour: 5.5, endHour: 9.5, x: 16, z: -37, yaw: 0, activityZh: '在巴刹采买', activityEn: 'Market Shopping', activityMs: 'Membeli-belah di Pasar' },
      { startHour: 9.5, endHour: 21, x: 22.5, z: -6.5, yaw: Math.PI / 2, activityZh: '照看咖啡店与白咖喱面', activityEn: 'Running Kopitiam', activityMs: 'Menjaga Kopitiam' },
      { startHour: 21, endHour: 5.5, x: 18.0, z: 1.5, yaw: 0, activityZh: '打烊休息', activityEn: 'Resting', activityMs: 'Berehat' },
    ],
  },
  {
    id: 'raj',
    nameZh: 'Raj',
    nameEn: 'Raj',
    nameMs: 'Raj',
    roleZh: '飞毛腿外卖员',
    roleEn: 'Food Delivery Rider',
    roleMs: 'Penghantar Makanan',
    shirtHex: 0x456990,
    pantsHex: 0x26292e,
    hairHex: 0x1b1715,
    hatHex: 0xd94b3d,
    schedule: [
      { startHour: 6, endHour: 9.5, x: 20, z: -38, yaw: 0, activityZh: '在巴刹取早餐单', activityEn: 'Morning Pickups', activityMs: 'Ambil Pesanan Pagi' },
      { startHour: 9.5, endHour: 20.5, x: 24.5, z: 11.5, yaw: 0, activityZh: '在椰脚街路口待命', activityEn: 'Ready for Deliveries', activityMs: 'Sedia Menghantar' },
      { startHour: 20.5, endHour: 6, x: 52.0, z: -6.0, yaw: 0, activityZh: '在加油站歇脚', activityEn: 'At Petrol Station', activityMs: 'Di Stesen Minyak' },
    ],
  },
  {
    id: 'siew-lan',
    nameZh: 'Siew Lan',
    nameEn: 'Siew Lan',
    nameMs: 'Siew Lan',
    roleZh: '乔治市导游',
    roleEn: 'Heritage Tour Guide',
    roleMs: 'Pemandu Pelancong Warisan',
    shirtHex: 0xf3d98b,
    pantsHex: 0x4b7f78,
    hairHex: 0x29211d,
    hatHex: 0xfaf3e6,
    schedule: [
      { startHour: 6, endHour: 9, x: -8, z: -38, yaw: 0, activityZh: '早市吃早餐', activityEn: 'Breakfast at Market', activityMs: 'Sarapan di Pasar' },
      { startHour: 9, endHour: 18, x: -8.0, z: 13.5, yaw: Math.PI, activityZh: '在打铜仔街导览', activityEn: 'Guiding on Armenian St', activityMs: 'Memandu di Lebuh Armenian' },
      { startHour: 18, endHour: 6, x: 10.0, z: 74.0, yaw: 0, activityZh: '在海边码头乘凉', activityEn: 'At Esplanade Pier', activityMs: 'Di Jeti Esplanade' },
    ],
  },
  {
    id: 'tiger',
    nameZh: '流浪猫 Tiger',
    nameEn: 'Tiger the Cat',
    nameMs: 'Kucing Tiger',
    roleZh: '乔治市橘猫',
    roleEn: 'Neighborhood Cat',
    roleMs: 'Kucing Jalanan',
    shirtHex: 0xe68e3c,
    pantsHex: 0xfaf3e6,
    hairHex: 0xc96c23,
    isCat: true,
    schedule: [
      { startHour: 6, endHour: 12, x: -58.0, z: 26.5, yaw: 0, activityZh: '在小公园晒太阳', activityEn: 'Sunbathing in Park', activityMs: 'Berjemur di Taman' },
      { startHour: 12, endHour: 19, x: -55.0, z: 24.0, yaw: 1.2, activityZh: '在凉亭旁打盹', activityEn: 'Napping by Gazebo', activityMs: 'Tidur di Pondok' },
      { startHour: 19, endHour: 6, x: 8.5, z: 79.0, yaw: 0, activityZh: '在海边码头等小鱼', activityEn: 'Waiting at Pier', activityMs: 'Menunggu di Jeti' },
    ],
  },
];

export function getScheduledSlotForHour(npc: NpcDefinition, hour: number) {
  for (const slot of npc.schedule) {
    if (slot.startHour < slot.endHour) {
      if (hour >= slot.startHour && hour < slot.endHour) return slot;
    } else {
      if (hour >= slot.startHour || hour < slot.endHour) return slot;
    }
  }
  return npc.schedule[0];
}

export function buildNpcDialogue(
  npcId: string,
  quests: QuestProgressState,
  foodCount: number,
  motorcycleOwned: boolean,
  _lang: LanguageCode
): DialogueNode {
  const npc = NAMED_NPCS.find((n) => n.id === npcId) ?? NAMED_NPCS[0];
  const speakerZh = npc.nameZh;
  const speakerEn = npc.nameEn;
  const speakerMs = npc.nameMs ?? npc.nameEn;

  if (npcId === 'ah-kow') {
    if (!quests.completedIds.includes('main-1-ahkow')) {
      return {
        id: 'ahkow-m1',
        speakerZh,
        speakerEn,
        speakerMs,
        textZh: '哎哟，新搬来的邻居啊！欢迎来到打铜仔街！我刚开档，能帮我去街角 Auntie Lim 那买点鲜虾和韭菜吗？',
        textEn: 'Eh, new neighbor! Welcome to Armenian Street! Could you grab fresh prawns and chives from Auntie Lim for me?',
        textMs: 'Eh, jiran baru! Selamat datang ke Lebuh Armenian! Boleh tolong ambil udang dan kucai dari Auntie Lim?',
        choices: [
          {
            labelZh: '没问题，我这就去！（完成任务1 / 接取任务2）',
            labelEn: 'Sure thing! (Complete Q1 / Accept Q2)',
            labelMs: 'Baik! (Selesai Misi 1 / Terima Misi 2)',
            action: 'complete_quest',
            questId: 'main-1-ahkow',
          },
          {
            labelZh: '来玩炒粿条锅气小游戏！',
            labelEn: 'Play Wok Rhythm Minigame!',
            labelMs: 'Main Permainan Mini Kuali!',
            action: 'open_minigame',
            minigameId: 'ckt-rhythm',
          },
          {
            labelZh: '先来一盘炭火炒粿条！',
            labelEn: 'Buy Char Kway Teow first!',
            labelMs: 'Beli Char Kway Teow!',
            action: 'open_shop',
            shopId: 'stall-ckt',
          },
          { labelZh: '待会儿再来找你', labelEn: 'Talk later', labelMs: 'Jumpa lagi', action: 'close' },
        ],
      };
    }
    if (!quests.completedIds.includes('main-2-ingredients') && quests.flags['bought_ingredients']) {
      return {
        id: 'ahkow-m2-done',
        speakerZh,
        speakerEn,
        speakerMs,
        textZh: '太谢谢你了，虾好新鲜！顺便帮我把这份打包好的炒粿条送给南巷的 Kak Ros 吧？',
        textEn: 'Wah, super fresh prawns! Could you also pass this packed Char Kway Teow to Kak Ros at her Cendol stall?',
        textMs: 'Wah, segarnya udang! Boleh tolong hantar bungkusan ini kepada Kak Ros di gerai Cendolnya?',
        choices: [
          {
            labelZh: '交给我送给 Kak Ros！（完成任务2 / 接取任务3）',
            labelEn: 'I’ll deliver it to Kak Ros! (Complete Q2 / Accept Q3)',
            labelMs: 'Saya hantar ke Kak Ros! (Selesai Misi 2)',
            action: 'complete_quest',
            questId: 'main-2-ingredients',
          },
          { labelZh: '看看炒粿条摊位', labelEn: 'Browse CKT Stall', labelMs: 'Lihat Gerai', action: 'open_shop', shopId: 'stall-ckt' },
        ],
      };
    }
    return {
      id: 'ahkow-idle',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh: '今天锅气很旺！要不要尝尝刚出锅的炒粿条，或者跟我比一比炒锅节奏？',
      textEn: 'Wok hei is strong today! Want a hot plate of Char Kway Teow or try the Wok Rhythm challenge?',
      textMs: 'Api kuali cukup kuat hari ini! Mahu makan Char Kway Teow atau cuba permainan kuali?',
      choices: [
        { labelZh: '买份美食尝尝', labelEn: 'Buy Food', labelMs: 'Beli Makanan', action: 'open_shop', shopId: 'stall-ckt' },
        { labelZh: '炒粿条节奏小游戏（赚外快！）', labelEn: 'Play Wok Rhythm Minigame', labelMs: 'Main Permainan Kuali', action: 'open_minigame', minigameId: 'ckt-rhythm' },
        { labelZh: '跟 Ah Kow 叔叔闲聊（好感+5）', labelEn: 'Chat (+5 Affinity)', labelMs: 'Berbual (+5 Mesra)', action: 'chat_affinity', affinityDelta: 5 },
        { labelZh: '再见', labelEn: 'Goodbye', labelMs: 'Selamat tinggal', action: 'close' },
      ],
    };
  }

  if (npcId === 'auntie-lim') {
    const needIng =
      !quests.completedIds.includes('main-2-ingredients') &&
      quests.acceptedIds.includes('main-2-ingredients') &&
      !quests.flags['bought_ingredients'];

    return {
      id: 'lim-main',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh: needIng
        ? 'Ah Kow 叫你来拿鲜虾和韭菜对吧？我早就打包好了，快拿回去给他！顺便来碗白咖喱面？'
        : '早安呀！刚拉好的拉茶跟白咖喱面都热着呢，坐下来吃点东西吧！',
      textEn: needIng
        ? 'Ah Kow sent you for fresh prawns and chives? Already packed! Want some White Curry Mee too?'
        : 'Morning! Fresh Teh Tarik and White Curry Mee are steaming hot!',
      textMs: needIng
        ? 'Ah Kow suruh ambil udang dan kucai ya? Sudah siap! Mahu Mi Kari Putih juga?'
        : 'Selamat pagi! Teh Tarik dan Mi Kari Putih panas sudah siap!',
      choices: [
        ...(needIng
          ? [
              {
                labelZh: '拿好食材（回去找 Ah Kow）',
                labelEn: 'Take Ingredients (Return to Ah Kow)',
                labelMs: 'Ambil Bahan (Pulang ke Ah Kow)',
                action: 'accept_quest' as const,
                questId: 'flag:bought_ingredients',
              },
            ]
          : []),
        { labelZh: '点单白咖喱面 / 拉茶', labelEn: 'Order Curry Mee / Teh Tarik', labelMs: 'Pesan Mi Kari / Teh Tarik', action: 'open_shop', shopId: 'stall-curry' },
        { labelZh: '闲聊一下（好感+5）', labelEn: 'Chat (+5 Affinity)', labelMs: 'Berbual (+5 Mesra)', action: 'chat_affinity', affinityDelta: 5 },
        { labelZh: '先走了', labelEn: 'Leave', labelMs: 'Pergi dulu', action: 'close' },
      ],
    };
  }

  if (npcId === 'kak-ros') {
    const canDeliver =
      !quests.completedIds.includes('main-3-kakros') &&
      quests.acceptedIds.includes('main-3-kakros');
    return {
      id: 'ros-main',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh: canDeliver
        ? '哇，还是热乎乎的炒粿条！太感谢你啦，听说壁画街的画家 Mei 今天也在画新画，可以去看看她！'
        : '天气热的时候来碗椰糖煎蕊和娘惹九层糕，最舒服不过啦！',
      textEn: canDeliver
        ? 'Still piping hot! Terima kasih! Heard mural artist Mei is painting on Mural Lane—go say hi!'
        : 'Nothing beats icy Gula Melaka Cendol and Nyonya Kuih on a warm Penang day!',
      textMs: canDeliver
        ? 'Wah, masih panas! Terima kasih! Pelukis Mei ada di Lorong Mural hari ini!'
        : 'Panas begini sedap pekena Cendol Gula Melaka dan Kuih Lapis Nyonya!',
      choices: [
        ...(canDeliver
          ? [
              {
                labelZh: '把炒粿条交给 Kak Ros（完成任务3 / 接取任务4）',
                labelEn: 'Hand Over Food (Complete Q3 / Accept Q4)',
                labelMs: 'Serah Makanan (Selesai Misi 3)',
                action: 'complete_quest' as const,
                questId: 'main-3-kakros',
              },
            ]
          : []),
        { labelZh: '买煎蕊 / 娘惹糕', labelEn: 'Buy Cendol / Kuih', labelMs: 'Beli Cendol / Kuih', action: 'open_shop', shopId: 'stall-cendol' },
        { labelZh: '闲聊（好感+5）', labelEn: 'Chat (+5 Affinity)', labelMs: 'Berbual (+5 Mesra)', action: 'chat_affinity', affinityDelta: 5 },
        { labelZh: '再见', labelEn: 'Goodbye', labelMs: 'Jumpa lagi', action: 'close' },
      ],
    };
  }

  if (npcId === 'mei') {
    const canMeet =
      !quests.completedIds.includes('main-4-mei') &&
      quests.acceptedIds.includes('main-4-mei');
    return {
      id: 'mei-main',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh: canMeet
        ? '哈喽！你就是刚搬来打铜仔街的新朋友吧？乔治市很大，去光大明珠车行买辆代步摩托吧，顺便帮我拼好这幅壁画配色！'
        : '我在壁画墙上画了单车姐弟和橘猫！来试试我的「壁画配色拼图」小游戏吗？',
      textEn: canMeet
        ? 'Hey there, new neighbor! Visit Pearl Motors near Komtar Plaza for a scooter—or help me match colors on this mural!'
        : 'Check out the murals I painted! Want to play my Mural Color-Match Puzzle?',
      textMs: canMeet
        ? 'Hai jiran baru! Kunjungi Pearl Motors di Komtar untuk skuter atau cuba teka warna mural saya!'
        : 'Tengok mural yang saya lukis! Mahu main teka warna mural?',
      choices: [
        ...(canMeet
          ? [
              {
                labelZh: '认识 Mei（完成任务4 / 接取任务5）',
                labelEn: 'Meet Mei (Complete Q4 / Accept Q5)',
                labelMs: 'Kenali Mei (Selesai Misi 4)',
                action: 'complete_quest' as const,
                questId: 'main-4-mei',
              },
            ]
          : []),
        {
          labelZh: '游玩「壁画配色拼图」小游戏',
          labelEn: 'Play Mural Color-Match Puzzle',
          labelMs: 'Main Teka Warna Mural',
          action: 'open_minigame',
          minigameId: 'mural-puzzle',
        },
        { labelZh: '赞美壁画（好感+8）', labelEn: 'Praise Murals (+8 Affinity)', labelMs: 'Puji Mural (+8 Mesra)', action: 'chat_affinity', affinityDelta: 8 },
        { labelZh: '回见', labelEn: 'Bye', labelMs: 'Jumpa lagi', action: 'close' },
      ],
    };
  }

  if (npcId === 'raj') {
    const timedActive = quests.timedDelivery?.active;
    return {
      id: 'raj-main',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh: timedActive
        ? `外卖正派送中！目标在 ${quests.timedDelivery?.targetName}，还剩 ${Math.ceil(quests.timedDelivery?.remainingSec ?? 0)} 秒！`
        : '兄弟，订单太多我忙不过来！帮我跑一单限时外卖，报酬 RM 85 怎么样？',
      textEn: timedActive
        ? `Delivery in progress to ${quests.timedDelivery?.targetName}!`
        : 'Bro, orders are piling up! Want to take a timed delivery run for RM 85?',
      textMs: timedActive
        ? `Penghantaran ke ${quests.timedDelivery?.targetName} sedang berjalan!`
        : 'Bro, pesanan terlalu banyak! Mahu buat penghantaran pantas untuk RM 85?',
      choices: [
        ...(!timedActive
          ? [
              {
                labelZh: '接下限时外卖任务！',
                labelEn: 'Accept Timed Delivery!',
                labelMs: 'Terima Penghantaran Pantas!',
                action: 'accept_quest' as const,
                questId: 'side-2-delivery',
              },
            ]
          : []),
        { labelZh: '聊聊骑车心得（好感+5）', labelEn: 'Chat (+5 Affinity)', labelMs: 'Berbual (+5 Mesra)', action: 'chat_affinity', affinityDelta: 5 },
        { labelZh: '先忙别的', labelEn: 'Later', labelMs: 'Nanti dulu', action: 'close' },
      ],
    };
  }

  if (npcId === 'siew-lan') {
    const tigerFound = Boolean(quests.flags['found_tiger']);
    const tigerDone = quests.completedIds.includes('side-1-tiger');
    const photoTaken = Boolean(quests.flags['took_photo']);
    const photoDone = quests.completedIds.includes('side-3-photo');

    return {
      id: 'siewlan-main',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh:
        '欢迎来到乔治市世界文化遗产区！最近橘猫 Tiger 跑去西边小公园晒太阳了，也可以用拍照模式打卡壁画街、升旗山与关仔角！',
      textEn:
        'Welcome to George Town UNESCO Heritage Zone! Tiger wandered to Heritage Park—and try snapping photos across town!',
      textMs:
        'Selamat datang ke Tapak Warisan George Town! Tiger berada di Taman Warisan—jangan lupa ambil foto!',
      choices: [
        ...(tigerFound && !tigerDone
          ? [
              {
                labelZh: '告诉她已经找到 Tiger（完成寻猫支线）',
                labelEn: 'Report Tiger Found (Complete Side 1)',
                labelMs: 'Lapor Tiger Dijumpai (Selesai)',
                action: 'complete_quest' as const,
                questId: 'side-1-tiger',
              },
            ]
          : !tigerDone
          ? [
              {
                labelZh: '接取支线：寻找橘猫 Tiger',
                labelEn: 'Accept Side: Find Tiger',
                labelMs: 'Terima Misi: Cari Tiger',
                action: 'accept_quest' as const,
                questId: 'side-1-tiger',
              },
            ]
          : []),
        ...(photoTaken && !photoDone
          ? [
              {
                labelZh: '分享打卡照片（完成拍照支线）',
                labelEn: 'Share Photo (Complete Side 3)',
                labelMs: 'Kongsi Foto (Selesai)',
                action: 'complete_quest' as const,
                questId: 'side-3-photo',
              },
            ]
          : !photoDone
          ? [
              {
                labelZh: '接取支线：壁画街/码头拍照打卡',
                labelEn: 'Accept Side: Photo Check-In',
                labelMs: 'Terima Misi: Foto Warisan',
                action: 'accept_quest' as const,
                questId: 'side-3-photo',
              },
            ]
          : []),
        { labelZh: '谢谢导游介绍（好感+5）', labelEn: 'Thank You (+5 Affinity)', labelMs: 'Terima Kasih (+5 Mesra)', action: 'chat_affinity', affinityDelta: 5 },
        { labelZh: '再见', labelEn: 'Bye', labelMs: 'Jumpa lagi', action: 'close' },
      ],
    };
  }

  if (npcId === 'pak-samad') {
    const scouted = Boolean(quests.flags['scouted_pier']);
    const trishawDone = quests.completedIds.includes('side-4-trishaw');
    return {
      id: 'samad-main',
      speakerZh,
      speakerEn,
      speakerMs,
      textZh: scouted && !trishawDone
        ? '太好了！海边码头的游客正在等三轮车，这笔酬劳归你！你随时也可以去旁边的三轮车体验踩车铃！'
        : '我在乔治市踩了三十年三轮车啦！旁边的三轮车欢迎你试踩，也能帮我去码头看看有没有等车的游客吗？',
      textEn: scouted && !trishawDone
        ? 'Bagus! Tourists are waiting at Esplanade Pier. Here is your reward! Feel free to ride my trishaw anytime!'
        : 'I have pedaled trishaws here for 30 years! Try my trishaw anytime, or scout Esplanade Pier for tourists!',
      textMs: scouted && !trishawDone
        ? 'Bagus! Pelancong menunggu di Jeti Esplanade. Ini ganjaran anda! Boleh cuba kayuh beca saya!'
        : 'Sudah 30 tahun saya mengayuh beca! Cubalah beca saya atau periksa pelancong di Jeti!',
      choices: [
        ...(scouted && !trishawDone
          ? [
              {
                labelZh: '完成三轮车送客支线',
                labelEn: 'Complete Trishaw Side Quest',
                labelMs: 'Selesai Misi Beca',
                action: 'complete_quest' as const,
                questId: 'side-4-trishaw',
              },
            ]
          : !trishawDone
          ? [
              {
                labelZh: '接取支线：三轮车接引游客',
                labelEn: 'Accept Side: Trishaw Guide',
                labelMs: 'Terima Misi: Beca',
                action: 'accept_quest' as const,
                questId: 'side-4-trishaw',
              },
            ]
          : []),
        { labelZh: '听老故事（好感+5）', labelEn: 'Listen (+5 Affinity)', labelMs: 'Dengar Cerita (+5 Mesra)', action: 'chat_affinity', affinityDelta: 5 },
        { labelZh: '回见', labelEn: 'Goodbye', labelMs: 'Jumpa lagi', action: 'close' },
      ],
    };
  }

  // Stray cat Tiger
  const passportReady = foodCount >= 5 && !quests.completedIds.includes('main-6-passport');
  return {
    id: 'tiger-main',
    speakerZh,
    speakerEn,
    speakerMs,
    textZh: passportReady
      ? '喵呜～（Tiger 闻到了你身上满满的 5 种槟城美食香味，开心地蹭了蹭你的裤脚！）'
      : motorcycleOwned
      ? '喵～（橘猫 Tiger 眯着眼睛打了个哈欠，看起来很喜欢这里暖洋洋的微风。）'
      : '喵呜！（一只胖乎乎的橘猫蹲在草地上，好像在等你摸摸它的头。）',
    textEn: 'Meow~ (Tiger purrs happily and rubs against your ankles.)',
    textMs: 'Meow~ (Tiger mendengkur gembira dan menggesel kaki anda.)',
    choices: [
      {
        labelZh: '摸摸 Tiger 的头（标记已找到 + 好感+10）',
        labelEn: 'Pet Tiger (Mark Found +10 Affinity)',
        labelMs: 'Belai Tiger (+10 Mesra)',
        action: 'accept_quest',
        questId: 'flag:found_tiger',
        affinityDelta: 10,
      },
      { labelZh: '挥手告别', labelEn: 'Wave Goodbye', labelMs: 'Lambai', action: 'close' },
    ],
  };
}

export function getNpcDisplayInfo(npcId: string, lang: LanguageCode) {
  const npc = NAMED_NPCS.find((n) => n.id === npcId) ?? NAMED_NPCS[0];
  return {
    name: pickLang(lang, npc.nameZh, npc.nameEn, npc.nameMs),
    role: pickLang(lang, npc.roleZh, npc.roleEn, npc.roleMs),
  };
}
