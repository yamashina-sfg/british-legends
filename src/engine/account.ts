const GUEST_ID_KEY='british-legends:guest-id';
export function createGuestId(random=()=>Math.random()):string{
  return `BL-${Array.from({length:3},()=>Math.floor(random()*0x10000).toString(16).padStart(4,'0').toUpperCase()).join('-')}`;
}
export function guestAccountId():string{
  const existing=localStorage.getItem(GUEST_ID_KEY);if(existing)return existing;
  const id=createGuestId();localStorage.setItem(GUEST_ID_KEY,id);return id;
}
export function clearGuestAccountId():void{localStorage.removeItem(GUEST_ID_KEY)}
