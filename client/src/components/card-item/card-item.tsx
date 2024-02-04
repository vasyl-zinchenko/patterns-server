import type { DraggableProvided } from "@hello-pangea/dnd";

import type { Card } from "../../common/types";
import { CopyButton } from "../primitives/copy-button";
import { DeleteButton } from "../primitives/delete-button";
import { Splitter } from "../primitives/styled/splitter";
import { Text } from "../primitives/text";
import { Title } from "../primitives/title";
import { Container } from "./styled/container";
import { Content } from "./styled/content";
import { Footer } from "./styled/footer";
import { CardEvent } from "../../common/enums";
import { socket } from "../../context/socket";

type Props = {
  card: Card;
  isDragging: boolean;
  provided: DraggableProvided;
  listId: string;
};

export const CardItem = ({ card, isDragging, provided, listId }: Props) => {
  const onDeleteButton = () => {
    socket.emit(CardEvent.DELETE, card.id);
  };

  const renameCard = (value: string) => {
    socket.emit(CardEvent.RENAME, { cardId: card.id, newName: value });
  };

  const changeDescription = (value: string) => {
    socket.emit(CardEvent.CHANGE_DESCRIPTION, {
      cardId: card.id,
      newDescription: value,
    });
  };

  const copyButton = () => {
    socket.emit(CardEvent.COPY, card, listId);
  };

  return (
    <Container
      className="card-container"
      isDragging={isDragging}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      data-is-dragging={isDragging}
      data-testid={card.id}
      aria-label={card.name}
    >
      <Content>
        <Title
          onChange={renameCard}
          title={card.name}
          fontSize="large"
          isBold
        />
        <Text text={card.description} onChange={changeDescription} />
        <Footer>
          <DeleteButton onClick={onDeleteButton} />
          <Splitter />
          <CopyButton onClick={copyButton} />
        </Footer>
      </Content>
    </Container>
  );
};
