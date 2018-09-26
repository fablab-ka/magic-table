import * as PIXI from 'pixi.js';

export default class TileSet {
    public baseTexture: PIXI.BaseTexture;
    public textures: PIXI.Texture[];
    public margin: number;
    public image: any;
    public tileWidth: number;
    public tileHeight: number;
    public spacing: number;

    constructor(tileSet: any) {
        Object.assign(this, tileSet);

        this.tileWidth = tileSet.tileWidth;
        this.tileHeight = tileSet.tileHeight;
        this.spacing = tileSet.spacing;

        this.margin = 0;

        this.baseTexture = PIXI.Texture.fromImage(
            'assets/' + tileSet.image.source,
            false,
            PIXI.SCALE_MODES.NEAREST,
        ) as any as PIXI.BaseTexture;
        this.textures = [];

        for (let y = this.margin; y < this.image.height; y += this.tileHeight + this.spacing) {
            for (let x = this.margin; x < this.image.width; x += this.tileWidth + this.spacing) {
                this.textures.push(
                    new PIXI.Texture(this.baseTexture, new PIXI.Rectangle(x, y, this.tileWidth, this.tileHeight)),
                );
            }
        }
    }
}
