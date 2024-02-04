import fs from "fs";
import path from "path";

interface LogData {
  type: string;
  message: string;
}

interface Subscriber {
  update(log: LogData): void;
}

export class Logger {
  public saveLog(logData: LogData) {
    const date = new Date().toISOString().split("T").join(" ").replace("Z", "");
    fs.appendFile(
      path.join(__dirname, "../file/console/logging.txt"),
      `[${date}] ${logData.message}\n`,
      () => {
        return;
      }
    );
  }
}

export class Publisher {
  private subscribers: Subscriber[] = [];

  public subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }

  public unsubscribe(subscriber: Subscriber): void {
    this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  }

  public log(logData: LogData) {
    this.subscribers.forEach((subscriber) => subscriber.update(logData));
  }
}

export class FileLogger implements Subscriber {
  private logger = new Logger();
  public update(logData: LogData): void {
    if (logData.type === "info") {
      this.logger.saveLog(logData);
    }
  }
}

export class ConsoleLogger implements Subscriber {
  private logger = new Logger();
  public update(logData: LogData): void {
    if (logData.type === "error") {
      logData.message = `⚠️ Error: ${logData.message}`;
      this.logger.saveLog(logData);
      console.error(logData.message);
    }
  }
}
