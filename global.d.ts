import { Channel } from "bridge-iframe-api";

declare global {
  var bridge: {
    connected: boolean;
    openedFile: string;
    openedPath: string;
  };
  var iapi: Channel;
}