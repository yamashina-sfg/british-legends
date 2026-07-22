export const APP_VERSION='1.4.0';
export const DATA_VERSION=14;
export interface RemoteVersion { appVersion:string; minimumAppVersion:string; dataVersion:number; message?:string }
export function compareVersions(left:string,right:string):number{const a=left.split('.').map(Number),b=right.split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d>0?1:-1;}return 0;}
export function requiresForcedUpdate(remote:RemoteVersion,current=APP_VERSION):boolean{return compareVersions(current,remote.minimumAppVersion)<0;}
