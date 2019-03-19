import { Store } from "redux";

import { backgroundColor } from "../constants";
import TiledMap from "../tiledmap/TiledMap";
import TileLayer from "../tiledmap/TileLayer";
import GameCommunication from "./communication";
import GameController from "./game-controller";
import { MarkerMessage } from "./game-types";
import { MarkerMap } from "./marker-map";
import { GameResourceManager, GameResources } from "./resource-manager";
import store from "./state/store";
import statements from "./statements";
import TurtleController from "./turtle-controller";

const debugPanel = document.getElementById("debug-output");

const TURTLE_HOST_NAME = "`ws://magicrobot3.flka.space:81/";

export default class MainGame {
  private communication: GameCommunication;
  private resourceManager: GameResourceManager;

  private app: PIXI.Application;

  private map?: TiledMap;
  private currentActiveElementsWiggle: number = 0;
  private currentActiveElementsStep: number = 0.3;

  private bunny?: PIXI.Sprite;
  private rectangle?: PIXI.Graphics;
  private turtle?: PIXI.Graphics;
  private points: PIXI.Graphics[] = [];

  private store: Store;

  private turtleController: TurtleController;
  private gameController: GameController;

  constructor() {
    this.store = store;

    this.communication = new GameCommunication(store);
    this.communication.onMarkerMessage.add(this.onMarkerMessage.bind(this));

    this.resourceManager = new GameResourceManager(statements);
    this.resourceManager.onReady.add(this.onResourcesReady.bind(this));

    this.app = new PIXI.Application(window.innerHeight, window.innerHeight, {
      backgroundColor
    });
    this.app.renderer.view.style.position = "absolute";
    this.app.renderer.view.style.display = "block";
    this.app.renderer.autoResize = true;
    this.app.renderer.resize(1920, 1080);
    this.app.ticker.add(this.onTick.bind(this));
    /*window.addEventListener("resize", () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
         });
         window.setTimeout(() => app.renderer.resize(window.innerWidth, window.innerHeight), 1000);*/

    this.turtleController = new TurtleController(this.store, TURTLE_HOST_NAME);
    this.gameController = new GameController(this.store);
  }

  public start() {
    document.body.appendChild(this.app.view);

    this.resourceManager.load();

    this.turtleController.connect();
    this.gameController.start();
  }

  private onResourcesReady({ map, spriteSheet, resources }: GameResources) {
    this.map = map;
    this.app.stage.addChild(this.map);

    for (const id in statements) {
      if (statements.hasOwnProperty(id)) {
        statements[id].sprite.anchor.set(0.5);

        const tileSprite = new PIXI.Sprite(
          resources[`statement_${id}`].texture
        );
        /*tileSprite.anchor.set(0, 0.5);
                tileSprite.position.x = -1;
                tileSprite.scale.x = 0.025;
                tileSprite.scale.y = 0.025;*/
        // tileSprite.position.x = -10;
        statements[id].sprite.addChild(tileSprite);
        this.app.stage.addChild(statements[id].sprite);
      }
    }

    this.bunny = new PIXI.Sprite(resources.bunny.texture);
    this.bunny.anchor.set(0.5);
    this.app.stage.addChild(this.bunny);

    this.rectangle = new PIXI.Graphics();
    this.rectangle.lineStyle(4, 0xff3300, 1);
    this.rectangle.beginFill(0x66ccff);
    this.rectangle.drawRect(0, 0, 800, 800);
    this.rectangle.endFill();
    this.rectangle.x = 0;
    this.rectangle.y = 0;
    // this.app.stage.addChild(this.rectangle);

    this.turtle = new PIXI.Graphics();
    this.turtle.lineStyle(4, 0xff3300, 1);
    this.turtle.beginFill(0x66ccff);
    this.turtle.drawRect(0, 0, 150, 150);
    this.turtle.endFill();
    this.turtle.x = 0;
    this.turtle.y = 0;
    this.app.stage.addChild(this.turtle);

    for (let i = 0; i < 4; i++) {
      this.points.push(new PIXI.Graphics());
      this.points[i].lineStyle(4, 0xff3300, 1);
      this.points[i].beginFill(0x66ccff);
      this.points[i].drawCircle(0, 0, 10);
      this.points[i].endFill();
      this.app.stage.addChild(this.points[i]);
    }

    this.communication.start();
  }

  private onMarkerMessage(message: MarkerMessage) {
    this.app.stage.removeChildren();
    for (const data of message) {
      const { id, corners, position, rotation } = data;

      if (id === MarkerMap.TurtleMarker) {
        if (this.bunny) {
          this.app.stage.addChild(this.bunny);
          this.bunny.position.x = position[0];
          this.bunny.position.y = position[1];
          this.bunny.rotation = rotation + Math.PI / 2;
        }
        if (this.bunny) {
          for (let i = 0; i < 4; i++) {
            this.points[i].x = corners[i][0];
            this.points[i].y = corners[i][1];
            this.app.stage.addChild(this.points[i]);
          }
        }
      } else if (id === 0) {
        if (this.map) {
          this.app.stage.addChild(this.map);
        }
      }
    }
  }

  private onTick(delta: number) {
    // bunny.rotation += 0.1 * delta;

    if (this.map) {
      (this.map.layers[2] as TileLayer).tiles.forEach(tile => {
        tile.y += this.currentActiveElementsWiggle * 0.1;
        /* if (tile.scale) {
                    tile.anchor.x = 0.5;
                    tile.scale.x = (this.currentActiveElementsWiggle + 10) / 20;
                } */
      });
    }

    this.currentActiveElementsWiggle += this.currentActiveElementsStep;
    if (
      this.currentActiveElementsWiggle >= 10 &&
      this.currentActiveElementsStep > 0
    ) {
      this.currentActiveElementsStep = -0.3;
    } else if (
      this.currentActiveElementsWiggle <= -10 &&
      this.currentActiveElementsStep < 0
    ) {
      this.currentActiveElementsStep = 0.3;
    }
  }
}
