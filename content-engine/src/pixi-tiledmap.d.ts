declare module 'tmx-parser' {
    export function parse(responseText: string, route: string, callback: (err: Error, map: any) => void): void
}
