import { List } from "../data/models/list";
import { ReorderService } from "./reorder.service";
import {
  Publisher,
  FileLogger,
  ConsoleLogger,
} from "../handlers/subscriber.handler";

export class ProxyReorderService {
  reorderService: ReorderService;
  publisher = new Publisher();
  fileLogger = new FileLogger();
  consoleLogger = new ConsoleLogger();

  constructor(reorderService: ReorderService) {
    this.reorderService = reorderService;
    this.publisher.subscribe(this.fileLogger);
    this.publisher.subscribe(this.consoleLogger);
  }

  public reorder<T>(items: T[], startIndex: number, endIndex: number): T[] {
    try {
      console.log("test");

      this.publisher.log({
        type: "info",
        message: `Lists are going to be reordered`,
      });
      return this.reorderService.reorder(items, startIndex, endIndex);
    } catch (error) {
      this.publisher.log({ type: "error", message: error.message });
    }
  }

  public reorderCards({
    lists,
    sourceIndex,
    destinationIndex,
    sourceListId,
    destinationListId,
  }: {
    lists: List[];
    sourceIndex: number;
    destinationIndex: number;
    sourceListId: string;
    destinationListId: string;
  }): List[] {
    try {
      this.publisher.log({
        type: "info",
        message: `Cards are going to be reordered`,
      });
      return this.reorderService.reorderCards({
        lists,
        sourceIndex,
        destinationIndex,
        sourceListId,
        destinationListId,
      });
    } catch (error) {
      this.publisher.log({ type: "error", message: error.message });
    }
  }

  public remove<T>(items: T[], index: number): T[] {
    return this.reorderService.remove(items, index);
  }

  public insert<T>(items: T[], index: number, value: T): T[] {
    return this.reorderService.insert(items, index, value);
  }
}
