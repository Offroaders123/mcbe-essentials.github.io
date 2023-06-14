import { Channel } from "bridge-iframe-api";
import * as JSZip from "jszip";

declare global {
  var bridge: {
    connected: boolean;
    openedFile: string;
    openedPath: string;
  };
  var iapi: Channel;
  var JSZip: JSZip;

  interface HTMLElementTagNameMap {
    "mcitem": MinecraftItem;
  }

  interface String {
    replaceAt(index: number, replacement: string): string;
  }

  interface Window {
    mobileCheck(): boolean;
    newError: typeof newError;
    opera: {
      toString(): "[object Opera]";
    };
  }
}