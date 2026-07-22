import{describe,expect,it}from'vitest';import{advancePlayTime,AUTOSAVE_INTERVAL_MS}from'./autosave';import{createNewSave}from'./save';
describe('five minute autosave',()=>{it('records elapsed play time and save timestamp',()=>{const next=advancePlayTime(createNewSave(1),AUTOSAVE_INTERVAL_MS/1000,1234);expect(next.playTimeSec).toBe(300);expect(next.lastSavedAt).toBe(1234)})});
