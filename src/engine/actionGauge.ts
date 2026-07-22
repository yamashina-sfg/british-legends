export const ACTION_GAUGE_MAX=300;export const ACTION_GAUGE_BASE_PER_SEC=199;
export function actionGaugePerSecond(spd=0):number{return ACTION_GAUGE_BASE_PER_SEC+Math.max(0,spd)}
export function actionGaugeDurationMs(spd=0):number{return ACTION_GAUGE_MAX/actionGaugePerSecond(spd)*1000}
export function actionGaugePercent(elapsedMs:number,spd=0):number{return Math.max(0,Math.min(100,elapsedMs/actionGaugeDurationMs(spd)*100))}
