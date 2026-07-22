export type CashShopCategory='currency'|'status'|'boost'|'pet'|'equipment'|'appearance'|'convenience';
export type CashGrant=
  |{kind:'gold';amount:number}|{kind:'status';amount:number}|{kind:'item';itemId:string;amount:number}
  |{kind:'pet';petId:string}|{kind:'equipment';equipmentId:string}|{kind:'head';style:number}
  |{kind:'entitlement';id:string}|{kind:'cash';diamonds:number};
export interface CashProduct {id:string;name:string;description:string;category:CashShopCategory;diamondCost?:number;cashYen?:number;purchaseLimit?:number;prerequisiteId?:string;grant:CashGrant}
const p=(product:CashProduct)=>product;
export const CASH_SHOP_PRODUCTS:CashProduct[]=[
  ...[[10,160],[55,800],[180,2400],[500,5000],[1200,9600],[3000,19200]].map(([diamonds,cashYen])=>p({id:`diamond_${diamonds}`,name:`ダイヤ ${diamonds}`,description:'現金決済商品（本番決済接続前）',category:'currency',cashYen,grant:{kind:'cash',diamonds}})),
  ...[[600000,10],[3600000,30],[36000000,100]].map(([amount,cost])=>p({id:`gold_${amount}`,name:`ゴールド ${amount.toLocaleString()}`,description:'冒険・鍛造に使える通貨',category:'currency',diamondCost:cost,grant:{kind:'gold',amount}})),
  ...[[1,5],[5,24],[10,45],[30,120],[50,180],[99,330]].map(([amount,cost])=>p({id:`status_${amount}`,name:`ステータスポイント +${amount}`,description:'選択中の先頭英雄へ付与',category:'status',diamondCost:cost,grant:{kind:'status',amount}})),
  ...([['exp_boost','経験値10倍'],['drop_boost','ドロップ10倍']] as const).flatMap(([itemId,name])=>[[1,20],[10,180],[99,1400]].map(([amount,cost])=>p({id:`${itemId}_${amount}`,name:`${name} 30分 ×${amount}`,description:'重ねて使うと残り時間を加算',category:'boost',diamondCost:cost,grant:{kind:'item',itemId,amount}}))),
  p({id:'premium_pet',name:'星詠みの白狐',description:'British Legends限定ペット',category:'pet',diamondCost:300,purchaseLimit:1,grant:{kind:'pet',petId:'star_fox'}}),
  ...[[1,3],[10,27],[99,210]].map(([amount,cost])=>p({id:`pet_food_xl_${amount}`,name:`特大ペットフード ×${amount}`,description:'ペット育成用アイテム',category:'pet',diamondCost:cost,grant:{kind:'item',itemId:'pet_food_xl',amount}})),
  p({id:'premium_weapon',name:'星典の剣',description:'British Legends限定装備',category:'equipment',diamondCost:300,purchaseLimit:1,grant:{kind:'equipment',equipmentId:'hero_sword'}}),
  ...Array.from({length:18},(_,i)=>p({id:`head_style_${i+5}`,name:`装飾ヘッド ${String(i+1).padStart(2,'0')}`,description:'外見変更で使用できる限定ヘッド',category:'appearance',diamondCost:40,purchaseLimit:1,grant:{kind:'head',style:i+5}})),
  p({id:'auto_fishing',name:'自動釣り',description:'釣りの自動実行機能を解放',category:'convenience',diamondCost:20,purchaseLimit:1,grant:{kind:'entitlement',id:'auto_fishing'}}),
  p({id:'auto_pickup',name:'自動取得',description:'戦闘報酬を自動回収',category:'convenience',diamondCost:10,purchaseLimit:1,grant:{kind:'entitlement',id:'auto_pickup'}}),
  p({id:'quick_slots_5',name:'クイックスロット5枠',description:'British Legends標準版に付属',category:'convenience',diamondCost:5,purchaseLimit:1,grant:{kind:'entitlement',id:'quick_slots_5'}}),
  p({id:'magic_slot_2',name:'魔法スロット 第2枠',description:'British Legends標準版に付属',category:'convenience',diamondCost:100,purchaseLimit:1,grant:{kind:'entitlement',id:'magic_slot_2'}}),
  p({id:'magic_slot_3',name:'魔法スロット 第3枠',description:'第2枠の解放が必要',category:'convenience',diamondCost:300,purchaseLimit:1,prerequisiteId:'magic_slot_2',grant:{kind:'entitlement',id:'magic_slot_3'}}),
];
export const CASH_CATEGORY_LABELS:Record<CashShopCategory,string>={currency:'通貨',status:'能力',boost:'ブースト',pet:'ペット',equipment:'装備',appearance:'外見',convenience:'便利'};
export const getCashProduct=(id:string)=>CASH_SHOP_PRODUCTS.find((x)=>x.id===id);
