import type { Socket } from "socket.io";
import { isEqual } from "lodash";
import { CardEvent } from "../common/enums";
import { Card } from "../data/models/card";
import { SocketHandler } from "./socket.handler";
import { List } from "../data/models/list";

export class CardHandler extends SocketHandler {
  public handleConnection(socket: Socket): void {
    socket.on(CardEvent.CREATE, this.createCard.bind(this));
    socket.on(CardEvent.REORDER, this.reorderCards.bind(this));
    socket.on(CardEvent.DELETE, this.deleteCard.bind(this));
    socket.on(CardEvent.RENAME, this.renameCard.bind(this));
    socket.on(CardEvent.CHANGE_DESCRIPTION, this.changeDescription.bind(this));
    socket.on(CardEvent.COPY, this.copyCard.bind(this));
  }

  public createCard(listId: string, cardName: string): void {
    const newCard = new Card(cardName, "");
    const lists = this.db.getData();
    const updatedLists = lists.map((list) =>
      list.id === listId ? list.setCards(list.cards.concat(newCard)) : list
    );

    this.db.setData(updatedLists);
    this.updateLists();
  }

  public deleteCard(cardId: string): void {
    const lists = this.db.getData();

    const updatedLists = lists.map((list) => {
      const newList = new List(list.name);
      newList.id = list.id;
      newList.cards = list.cards.filter((card) => card.id !== cardId);

      return newList;
    });

    this.db.setData(updatedLists);
    this.updateLists();
  }

  private renameCard({
    cardId,
    newName,
  }: {
    cardId: string;
    newName: string;
  }): void {
    const lists = this.db.getData();

    lists.forEach((list) =>
      list.cards.find((card) => {
        if (card.id === cardId) {
          card.name = newName;
        }
      })
    );

    this.db.setData(lists);
    this.updateLists();
  }

  private changeDescription({
    cardId,
    newDescription,
  }: {
    cardId: string;
    newDescription: string;
  }): void {
    const lists = this.db.getData();

    lists.forEach((list) =>
      list.cards.find((card) => {
        if (card.id === cardId) {
          card.description = newDescription;
        }
      })
    );

    this.db.setData(lists);
    this.updateLists();
  }

  private copyCard(card: Card, listId: string) {
    const newCard = new Card(card.name, card.description);
    const lists = this.db.getData();
    const updatedLists = lists.map((list) =>
      list.id === listId ? list.setCards(list.cards.concat(newCard)) : list
    );

    this.db.setData(updatedLists);
    this.updateLists();
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
}
