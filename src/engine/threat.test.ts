import{describe,expect,it}from'vitest';import{threatBand}from'./threat';
const stats=(atk:number)=>({hp:1,mp:0,atk,def:0,spd:0});
describe('monster threat bands',()=>{it('uses the specification percentage thresholds',()=>{expect(threatBand(stats(120),stats(100))).toBe('purple');expect(threatBand(stats(110),stats(100))).toBe('red');expect(threatBand(stats(100),stats(100))).toBe('white');expect(threatBand(stats(80),stats(100))).toBe('green');expect(threatBand(stats(79),stats(100))).toBe('gray')})});
