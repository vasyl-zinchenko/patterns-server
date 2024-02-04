import type { Server, Socket } from "socket.io";
import { CardEvent } from "../common/enums";
import { Card } from "../data/models/card";
import { SocketHandler } from "./socket.handler";
import { List } from "../data/models/list";
import { Publisher, FileLogger, ConsoleLogger } from "./subscriber.handler";
import { Database } from "../data/database";
import { ReorderService } from "../services/reorder.service";

export class CardHandler extends SocketHandler {
  publisher = new Publisher();
  fileLogger = new FileLogger();
  consoleLogger = new ConsoleLogger();

  constructor(io: Server, db: Database, reorderService: ReorderService) {
    super(io, db, reorderService);
    this.publisher.subscribe(this.fileLogger);
    this.publisher.subscribe(this.consoleLogger);
  }

  public handleConnection(socket: Socket): void {
    socket.on(CardEvent.CREATE, this.createCard.bind(this));
    socket.on(CardEvent.REORDER, this.reorderCards.bind(this));
    socket.on(CardEvent.DELETE, this.deleteCard.bind(this));
    socket.on(CardEvent.RENAME, this.renameCard.bind(this));
    socket.on(CardEvent.CHANGE_DESCRIPTION, this.changeDescription.bind(this));
    socket.on(CardEvent.COPY, this.copyCard.bind(this));
  }

  public createCard(listId: string, cardName: string): void {
    try {
      if (!cardName) {
        throw Error("Not found card name");
      }
      const newCard = new Card(cardName, "");
      const lists = this.db.getData();
      const updatedLists = lists.map((list) =>
        list.id === listId ? list.setCards(list.cards.concat(newCard)) : list
      );

      this.saveData(updatedLists, `Card created: ${cardName}`);
    } catch (error) {
      this.errorMessage(error);
    }
  }

  public deleteCard(cardId: string): void {
    try {
      const lists = this.db.getData();

      const updatedLists = lists.map((list) => {
        const newList = new List(list.name);
        newList.id = list.id;
        newList.cards = list.cards.filter((card) => card.id !== cardId);

        return newList;
      });

      this.saveData(updatedLists, `Card deleted: ${cardId}`);
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private renameCard({
    cardId,
    newName,
  }: {
    cardId: string;
    newName: string;
  }): void {
    try {
      const lists = this.db.getData();
      let oldName = "";

      lists.forEach((list) =>
        list.cards.find((card) => {
          if (card.id === cardId) {
            oldName = card.name;
            card.name = newName;
          }
        })
      );

      this.saveData(lists, `Card renamed: from "${oldName}" to "${newName}"`);
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private changeDescription({
    cardId,
    newDescription,
  }: {
    cardId: string;
    newDescription: string;
  }): void {
    try {
      const lists = this.db.getData();
      let oldDescription = "";

      lists.forEach((list) =>
        list.cards.find((card) => {
          if (card.id === cardId) {
            oldDescription = card.name;
            card.description = newDescription;
          }
        })
      );

      this.saveData(
        lists,
        `Card description changed: from "${oldDescription}" to "${newDescription}"`
      );
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private copyCard(card: Card, listId: string) {
    try {
      const prototypeCard = new Card(card.name, card.description);

      const newCard = prototypeCard.clone();

      const lists = this.db.getData();
      const updatedLists = lists.map((list) =>
        list.id === listId ? list.setCards(list.cards.concat(newCard)) : list
      );

      this.saveData(lists, `Card was copied`);
    } catch (error) {
      this.errorMessage(error);
    }
  }

  private reorderCards({
    sourceIndex,
    destinationIndex,
    sourceListId,
    destinationListId,
  }: {
    sourceIndex: number;
    destinationIndex: number;
    sourceListId: string;
    destinationListId: string;
  }): void {
    const lists = this.db.getData();
    const reordered = this.reorderService.reorderCards({
      lists,
      sourceIndex,
      destinationIndex,
      sourceListId,
      destinationListId,
    });
    this.db.setData(reordered);
    this.updateLists();
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
