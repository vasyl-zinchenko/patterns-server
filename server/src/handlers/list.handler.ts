import type { Server, Socket } from "socket.io";
import { ListEvent } from "../common/enums";
import { List } from "../data/models/list";
import { SocketHandler } from "./socket.handler";
import { Publisher, FileLogger, ConsoleLogger } from "./subscriber.handler";
import { Database } from "../data/database";
import { ReorderService } from "../services/reorder.service";

export class ListHandler extends SocketHandler {
  publisher = new Publisher();
  fileLogger = new FileLogger();
  consoleLogger = new ConsoleLogger();

  constructor(io: Server, db: Database, reorderService: ReorderService) {
    super(io, db, reorderService);
    this.publisher.subscribe(this.fileLogger);
    this.publisher.subscribe(this.consoleLogger);
  }

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
    try {
      if (!name) {
        throw Error("Not found card name");
      }

      const lists = this.db.getData();
      const newList = new List(name);

      this.saveData(lists.concat(newList), `List created: ${name}`);
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private deleteList(name: string): void {
    try {
      const lists = this.db.getData();

      this.saveData(
        lists.filter((list) => list.name !== name),
        `List deleted: ${name}`
      );
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private renameList({
    listId,
    newName,
  }: {
    listId: string;
    newName: string;
  }): void {
    try {
      const lists = this.db.getData();
      const foundList = lists.find((list) => list.id === listId);
      const oldName = foundList.name;
      foundList.name = newName;

      this.saveData(lists, `List renamed: from "${oldName}" to "${newName}"`);
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private saveData(list: List[], message: string) {
    this.db.setData(list);
    this.updateLists();
    this.publisher.log({
      type: "info",
      message,
    });
  }

  private errorMessage(error) {
    this.publisher.log({ type: "error", message: error.message });
  }
}
