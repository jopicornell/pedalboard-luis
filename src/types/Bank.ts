import {Button} from "./Button";

export interface Bank {
  name: string,
  buttons: Button[],
  channel: number
}
