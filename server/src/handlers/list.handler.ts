import type { Socket } from "socket.io";
import * as fs from "fs";
import { ListEvent } from "../common/enums";
import { List } from "../data/models/list";
import { SocketHandler } from "./socket.handler";

export class ListHandler extends SocketHandler {
  public handleConnection(socket: Socket): void {
    socket.on(ListEvent.CREATE, this.createList.bind(this));
    socket.on(ListEvent.GET, this.getLists.bind(this));
    socket.on(ListEvent.REORDER, this.reorderLists.bind(this));
    socket.on(ListEvent.DELETE, this.deleteList.bind(this));
    socket.on(ListEvent.RENAME, this.renameList.bind(this));
  }

  private getLists(callback: (cards: List[]) => void): void {
    callback(this.db.getData());
  }

  private reorderLists(sourceIndex: number, destinationIndex: number): void {
    const lists = this.db.getData();
    const reorderedLists = this.reorderService.reorder(
      lists,
      sourceIndex,
      destinationIndex
    );
    this.db.setData(reorderedLists);

    this.updateLists();
  }

  private createList(name: string): void {
    const lists = this.db.getData();
    const newList = new List(name);
    this.db.setData(lists.concat(newList));
    this.updateLists();
  }

  private deleteList(name: string): void {
    const lists = this.db.getData();
    this.db.setData(lists.filter((list) => list.name !== name));
    this.updateLists();
  }

  private renameList({
    listId,
    newName,
  }: {
    listId: string;
    newName: string;
  }): void {
    const lists = this.db.getData();
    const foundList = lists.find((list) => list.id === listId);
    foundList.name = newName;
    console.log(lists);

    this.db.setData(lists);
    this.updateLists();
  }
}
