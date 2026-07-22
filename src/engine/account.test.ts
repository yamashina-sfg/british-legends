import{describe,expect,it}from'vitest';import{createGuestId}from'./account';
describe('guest account id',()=>{it('creates a stable display-safe id shape',()=>{expect(createGuestId(()=>.5)).toBe('BL-8000-8000-8000')})});
