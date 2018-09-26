export default class Tile extends PIXI.extras.AnimatedSprite {
    public tile: any;
    public tileSet: any;
    public horizontalFlip: boolean;
    public verticalFlip: boolean;
    public diagonalFlip: boolean;
    public animations: any[];

    constructor(tile: any, tileSet: any, horizontalFlip: boolean, verticalFlip: boolean, diagonalFlip: boolean) {
        const textures: any[] = [];

        if (tile.animations.length) {
            tile.animations.forEach((frame: any) => {
                textures.push(tileSet.textures[frame.tileId]);
            });
        } else {
            textures.push(tileSet.textures[tile.gid - tileSet.firstGid]);
        }

        super(textures);

        this.animations = tile.animations;

        this.textures = textures;
        this.tile = tile;
        this.tileSet = tileSet;
        this.horizontalFlip = horizontalFlip;
        this.verticalFlip = verticalFlip;
        this.diagonalFlip = diagonalFlip;

        Object.assign(this, tile);

        this.flip();
    }

    public flip() {
        if (this.horizontalFlip) {
            this.anchor.x = 1;
            this.scale.x = -1;
        }

        if (this.verticalFlip) {
            this.anchor.y = 1;
            this.scale.y = -1;
        }

        if (this.diagonalFlip) {
            if (this.horizontalFlip) {
                this.anchor.x = 0;
                this.scale.x = 1;
                this.anchor.y = 1;
                this.scale.y = 1;

                this.rotation = PIXI.DEG_TO_RAD * 90;
            }
            if (this.verticalFlip) {
                this.anchor.x = 1;
                this.scale.x = 1;
                this.anchor.y = 0;
                this.scale.y = 1;

                this.rotation = PIXI.DEG_TO_RAD * -90;
            }
        }
    }
}
